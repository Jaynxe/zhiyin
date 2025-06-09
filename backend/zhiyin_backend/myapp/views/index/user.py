# 通用的用户相关api(包括管理员)
import os

from rest_framework.decorators import api_view, authentication_classes, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from django.core.cache import cache
from myapp.auth.authentication import UserAuthentication
from myapp.logging.logger import logger
from myapp.models import User
from myapp.serializers import CreateUserSerializer, UserInfoSerializer, LoginSerializer
from myapp.utils.common import (
    md5value,
    is_valid_password,
    is_valid_email,
    generate_verification_code,
    get_file_hash,
    validate_upload_size,
    make_login_log,
)
from myapp.utils.email import send_email
from myapp.utils.jwt_token import generate_jwt, invalidate_token
from myapp.utils.response import success, error
from myapp.auth.rate_throttle import UserRateThrottle


@api_view(["POST"])
def user_register(request: Request):
    """用户注册"""
    username = request.data.get("username")
    password = request.data.get("password")
    repassword = request.data.get("repassword")

    if not username or not password or not repassword:
        return error(msg="用户名或密码不能为空")

    is_valid, error_msg = is_valid_password(password)

    if not is_valid:
        return error(msg=error_msg)
    if password != repassword:
        return error(msg="密码不一致")
    if User.objects.filter(username=username).exists():
        return error(msg="该用户名已存在")

    data = {
        "username": username,
        "password": md5value(password),
    }

    serializer = CreateUserSerializer(
        data=data,
        context={
            "request": request,
        },
    )
    if serializer.is_valid():
        serializer.save()
        return success(msg="创建成功")
    logger.error("用户注册失败")
    return error(msg="创建失败", data=serializer.errors)


@api_view(["POST"])
def user_login(request: Request):
    """用户登录"""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return error("用户名或密码不能为空")

    is_valid, error_msg = is_valid_password(password)

    if not is_valid:
        return error(msg=error_msg)

    user = User.objects.filter(username=username).first()
    if not user:
        return error("用户不存在")

    if user.status == "1":
        return error("用户已被禁用")

    if user.password != md5value(password):
        return error("密码错误")

    # 登录成功，生成 JWT
    token = generate_jwt(
        {"user_id": str(user.id), "username": user.username, "role": user.role}
    )

    # 记录登录日志
    make_login_log(request)
    user_info = LoginSerializer(user, context={"request": request}).data
    return success(
        data={"accessToken": token, "userInfo": user_info},
        msg="登录成功",
    )


@api_view(["POST"])
@authentication_classes([UserAuthentication])
def user_logout(request: Request):
    """用户退出登录"""
    user = request.user
    token = request.auth

    # 1. 删除 Redis 中的 Token
    if token:
        invalidate_token(token)

    return success(msg="退出登录成功")


@api_view(["GET"])
@authentication_classes([UserAuthentication])
def get_user_info(request: Request):
    """获取任意用户信息"""
    user = request.user
    user_info = UserInfoSerializer(user, context={"request": request}).data
    return success(data=user_info, msg="获取用户信息成功")


@api_view(["PUT", "PATCH"])
@authentication_classes([UserAuthentication])
@throttle_classes([UserRateThrottle])
def update_user_info(request: Request):
    try:
        user = request.user

        # 去除空值
        data = request.data.copy()
        username = data.get("username")

        if username and username != user.username:
            if User.objects.filter(username=username).exclude(id=user.id).exists():
                return error(msg="该用户名已存在")

        # 过滤掉空值
        data = {k: v for k, v in data.items() if v not in [None, ""]}

        if not data:
            return error(msg="没有提供任何有效的更新数据", code=400)

        serializer = UserInfoSerializer(
            instance=user, data=data, context={"request": request}, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return success(msg="用户信息更新成功", data=serializer.data)
        else:
            error_msg = "数据验证失败：" + ", ".join(
                f"{field}: {errors[0]}" for field, errors in serializer.errors.items()
            )
            logger.error(f"用户信息更新失败: {error_msg}")
            return error(msg=error_msg, code=400)

    except ValidationError as ve:
        logger.error(f"参数验证错误: {str(ve)}")
        return error(msg=f"参数验证错误：{str(ve)}", code=400)

    except Exception as e:
        logger.error(f"更新失败: {str(e)}")
        return error(msg=f"更新失败：{str(e)}", code=500)


@api_view(["PUT", "PATCH"])
@authentication_classes([UserAuthentication])
@throttle_classes([UserRateThrottle])
def update_password(request: Request):
    user = request.user
    token = request.auth

    try:
        password = request.data.get("password", "").strip()
        new_password1 = request.data.get("new_password1", "").strip()
        new_password2 = request.data.get("new_password2", "").strip()

        # 参数非空校验
        if not password:
            return error(msg="请输入当前密码")
        if not new_password1:
            return error(msg="请输入新密码")
        if not new_password2:
            return error(msg="请再次输入新密码")

        # 原密码校验
        if user.password != md5value(password):
            return error(msg="当前密码不正确")

        # 新密码格式校验（如长度、强度等）
        is_valid, error_msg = is_valid_password(new_password1)
        if not is_valid:
            return error(msg=error_msg or "新密码格式不合法")

        # 两次新密码是否一致
        if new_password1 != new_password2:
            return error(msg="两次输入的新密码不一致")

        # 是否与原密码相同
        if md5value(new_password1) == user.password:
            return error(msg="新密码不能与原密码相同")

        # 更新密码
        user.password = md5value(new_password1)
        user.save(update_fields=["password"])

        # 删除 Redis 中的 token 使其失效（强制重新登录）
        if token:
            try:
                invalidate_token(token)
            except Exception as e:
                # 即使 token 删除失败，也继续流程
                logger.warning(f"Token 失效失败：{e}")

        return success(msg="密码修改成功，请重新登录")

    except Exception as e:
        logger.error(f"密码修改异常：{e}")
        return error(msg="服务器内部错误，请稍后重试")


@api_view(["POST"])
@authentication_classes([UserAuthentication])
def send_email_code(request: Request):
    """发送邮箱绑定验证码"""
    user = request.user
    email = request.data.get("email")
    if not email:
        return error(msg="邮箱不能为空")
    is_valid, error_msg = is_valid_email(email)
    if not is_valid:
        return error(msg=error_msg)

    if User.objects.filter(email=email).exists():
        return error(msg="该邮箱已被注册")

    email_code = generate_verification_code()
    cache_key = f"bind_email_code_{user.id}"
    cache.set(cache_key, {"code": email_code, "email": email}, timeout=600)

    subject = "zhiyin 邮箱绑定验证码"
    content = f"您好，您的验证码是：{email_code}，有效期10分钟，请勿泄露给他人。"

    try:
        send_email(email, subject, content)
        return success(msg="验证码已发送，请查收邮箱")
    except Exception as e:
        print(f"[验证码发送失败] {e}")
        logger.error(
            f"验证码发送失败: {str(e)}",
        )
        return error(msg="验证码发送失败，请稍后重试")


@api_view(["POST"])
@authentication_classes([UserAuthentication])
def bind_email(request: Request):
    user = request.user
    email = request.data.get("email")
    code = request.data.get("code")

    if not email or not code:
        return error(msg="邮箱和验证码不能为空")

    is_valid, error_msg = is_valid_email(email)
    if not is_valid:
        return error(msg=error_msg)

    cache_key = f"bind_email_code_user_{user.id}"
    cached = cache.get(cache_key)

    if not cached:
        return error(msg="验证码已过期")

    if cached.get("code") != code:
        return error(msg="验证码错误")

    if cached.get("email") != email:
        return error(msg="请确保和获取验证码的邮箱一致或重新获取验证码")

    user.email = email
    user.save(update_fields=["email"])
    cache.delete(cache_key)

    return success(msg="邮箱绑定成功")


@api_view(["POST"])
def send_reset_code(request: Request):
    """发送密码重置验证码"""
    email = request.data.get("email", "").strip()

    if not email:
        return error(msg="邮箱不能为空")

    is_valid, error_msg = is_valid_email(email)
    if not is_valid:
        return error(msg=error_msg)

    user = User.objects.filter(email=email).first()
    if not user:
        return error(msg="该邮箱未注册")

    # 生成验证码并存入缓存
    reset_code = generate_verification_code()
    cache_key = f"reset_password_code_{email}"
    cache.set(cache_key, {"code": reset_code}, timeout=300)

    subject = "zhiyin 密码重置验证码"
    message = f"您好，您的验证码是：{reset_code}，有效期5分钟，请勿泄露给他人。"

    try:
        send_email(email, subject, message)
        return success(msg="验证码已发送，请查收邮箱")
    except Exception as e:
        print(f"[发送验证码失败] 邮箱: {email}, 错误: {e}")
        logger.error(
            f"发送验证码失败: {str(e)}",
        )
        return error(msg="验证码发送失败，请稍后重试")


@api_view(["POST"])
def reset_password(request: Request):
    """通过验证码重置密码"""
    email = request.data.get("email", "").strip()
    code = request.data.get("code", "").strip()
    new_password = request.data.get("new_password", "").strip()

    if not all([email, code, new_password]):
        return error(msg="所有字段不能为空")

    is_valid, error_msg = is_valid_email(email)
    if not is_valid:
        return error(msg=error_msg)

    is_valid, error_msg = is_valid_password(new_password)
    if not is_valid:
        return error(msg=error_msg)

    # 验证验证码
    cache_key = f"reset_password_code_{email}"
    cached_data = cache.get(cache_key)

    if not cached_data or cached_data.get("code") != code:
        return error(msg="验证码错误或已过期")

    try:
        user = User.objects.get(email=email)
        user.password = md5value(new_password)
        user.save()
        cache.delete(cache_key)
        return success(msg="密码重置成功，请使用新密码登录")

    except User.DoesNotExist:
        return error(msg="用户不存在")
    except Exception as e:
        print(f"[重置密码失败] 邮箱: {email}, 错误: {e}")
        logger.error(
            f"重置密码失败: {str(e)}",
        )
        return error(msg="密码重置失败，请稍后重试")
