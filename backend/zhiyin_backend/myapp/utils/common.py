# 通用的一些方法

import datetime
import hashlib
import random
import string
import time

from django.conf import settings

from myapp.cf.user_cf import UserCf
from myapp.logging.logger import logger
from myapp.models import Record, Song
from myapp.serializers import LoginLogSerializer
from typing import List
from collections import defaultdict
import re
from rest_framework.request import Request


def md5value(key):
    """
    md5加密
    """
    input_name = hashlib.md5()
    input_name.update(key.encode("utf-8"))
    md5str = (input_name.hexdigest()).lower()
    print("计算md5:", md5str)
    return md5str


def validate_upload_size(request: Request, max_size: int = None) -> tuple[bool, str | None]:
    """
    验证HTTP请求中上传文件的大小是否超过限制
    Args:
        request: Django请求对象
        max_size: 允许的最大文件大小（字节），默认使用settings.MAX_COVER_SIZE
    Returns:
        tuple: (验证结果, 错误信息)
            - 验证结果: True表示验证通过，False表示失败
            - 错误信息: 验证失败时返回的错误消息，成功时为None
    """
    # 获取配置的最大尺寸，默认为2MB（如果settings未定义则使用2MB）
    max_allowed = max_size if max_size is not None else getattr(settings, 'MAX_COVER_SIZE', 2 * 1024 * 1024)

    try:
        content_length = int(request.META.get('CONTENT_LENGTH', 0))
    except (ValueError, TypeError):
        return False, '无效的文件大小格式'

    if content_length > max_allowed:
        # 将字节转换为MB显示
        max_size_mb = max_allowed / (1024 * 1024)
        return False, f'上传文件不能超过 {max_size_mb:.1f}MB'

    return True, None


def is_valid_email(email: str) -> tuple[bool, str]:
    """
    验证邮箱格式
    """
    pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    if not re.match(pattern, email):
        return False, "邮箱格式不正确"

    return True, ""


def is_valid_password(password: str) -> tuple[bool, str]:
    """
    密码强度验证：8位以上，必须包含字母和数字
    """

    if len(password) < 8:
        return False, "密码长度不能少于 8 位"

    if not re.search(r"[A-Za-z]", password):
        return False, "密码必须包含字母"

    if not re.search(r"[0-9]", password):
        return False, "密码必须包含数字"

    return True, ""


def is_valid_phone(phone: str) -> tuple[bool, str]:
    """
    验证手机号格式（中国大陆）
    """

    pattern = r"^1[3-9]\d{9}$"
    if not re.match(pattern, phone):
        return False, "手机号格式不正确"

    return True, ""


def generate_verification_code(length=6):
    """生成指定长度的数字验证码"""
    return ''.join(random.choices(string.digits, k=length))


def get_redis_token_key(token):
    """
    拼接redis_jet_key
    """
    return f"{settings.REDIS_JWT_PREFIX}{token}"


def get_file_hash(file) -> str:
    """根据图片内容计算哈希值"""
    hasher = hashlib.md5()
    for chunk in file.chunks():
        hasher.update(chunk)
    return hasher.hexdigest()


def get_timestamp():
    """
    获取时间戳
    """
    return int(round(time.time() * 1000))


def get_ip(request):
    """
    获取请求者的IP信息
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def get_ua(request):
    """
    获取请求者的IP信息
    """
    ua = request.META.get("HTTP_USER_AGENT")
    return ua[0:200]


def get_week_days():
    """
    获取近一周的日期
    """
    week_days = []
    now = datetime.datetime.now()
    for i in range(7):
        day = now - datetime.timedelta(days=i)
        week_days.append(day.strftime("%Y-%m-%d %H:%M:%S.%f")[:10])
    week_days.reverse()  # 逆序
    return week_days


def get_monday():
    """
    获取本周周一日期
    """
    now = datetime.datetime.now()
    monday = now - datetime.timedelta(now.weekday())
    return monday.strftime("%Y-%m-%d %H:%M:%S.%f")[:10]


def make_login_log(request):
    """记录用户登录日志"""
    try:
        username = request.data.get("username", "").strip()
        if not username:
            logger.error("[登录日志记录失败] 缺少用户名")
            return

        log_data = {
            "username": username,
            "ip": get_ip(request),
            "ua": get_ua(request)
        }

        serializer = LoginLogSerializer(data=log_data)
        if serializer.is_valid():
            serializer.save()
        else:
            logger.error("[登录日志验证失败]", serializer.errors)

    except Exception as e:
        logger.error("[登录日志记录异常]", str(e))


def dict_fetchall(cursor):  # cursor是执行sql_str后的记录，作入参
    columns = [col[0] for col in cursor.description]  # 得到域的名字col[0]，组成List
    return [
        dict(zip(columns, row)) for row in cursor.fetchall()
    ]


def get_recommend(request) -> List[Song]:
    """
    获取推荐物品列表，优先使用协同过滤推荐，不足时回退到热门推荐

    Args:
        request: Django请求对象（需包含user_id参数）

    Returns:
        推荐物品的QuerySet
    """
    # 1. 安全获取当前用户ID
    try:
        current_user_id = request.user.id
    except (ValueError, TypeError):
        print("无效的user_id参数，使用热门推荐")
        return get_fallback_recommendations()

    print(f"当前用户ID: {current_user_id}")

    # 2. 构建协同过滤数据（确保类型一致）
    user_data = defaultdict(dict)
    records = (
        Record.objects.select_related("song")
        .values("user_id", "song_id", "score")
        .order_by("user_id")[:300]
    )
    print(f'所有用户-歌曲评分记录 ======> {records}')

    for record in records:
        try:
            user_id = record["user_id"]
            if len(user_data) > 30:
                break
            user_data[user_id][record["song_id"]] = record["score"]
        except (KeyError, ValueError) as e:
            print(f"跳过无效记录: {record}，错误: {e}")
    print(f'协同过滤数据 ======> {user_data}')
    print(f"协同过滤数据构建完成，共{len(user_data)}个用户")

    # 3. 协同过滤推荐
    recommendations = []
    if current_user_id in user_data and len(user_data) > 1:
        try:
            user_cf = UserCf(data=user_data)
            recommended_ids = user_cf.recommend(current_user_id, n_neighbors=2)
            print(f"协同过滤推荐结果: {recommended_ids}")

            if recommended_ids:
                recommendations = Song.objects.filter(
                    id__in=recommended_ids, status="0"
                ).order_by("-plays")[
                                  :20
                                  ]  # 限制结果数量
        except Exception as e:
            print(f"协同过滤异常: {e}")

    # 4. 回退到热门推荐
    if not recommendations:
        print("协同过滤推荐不足，使用热门推荐")
        recommendations = get_fallback_recommendations()

    return recommendations


def get_fallback_recommendations() -> List[Song]:
    """获取热门推荐"""
    return list(Song.objects.filter(status="0").order_by("-plays", "-collect_count")[:20])
