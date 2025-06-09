# 管理员特有用户相关的api
import os

from rest_framework.decorators import api_view, throttle_classes, authentication_classes
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.auth.rate_throttle import UserRateThrottle
from myapp.logging.logger import logger
from myapp.models import User
from myapp.serializers import CreateUserSerializer, AdminUserInfoSerializer
from myapp.utils.common import is_valid_password, md5value, validate_upload_size, get_file_hash
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success
from django.db.models import Q


@api_view(["POST"])
@authentication_classes([AdminAuthentication])
def create_user(request: Request):
    """创建用户"""
    data = request.data
    username = data.get("username")
    role = data.get("role")
    status = data.get("status")
    if not username or not role or not status:
        return error(msg="缺少必要参数")

    # 检查用户名是否已存在
    if User.objects.filter(username=username).exists():
        return error(msg="用户名已存在")

    data = {k: v for k, v in data.items() if v not in [None, ""]}

    # 设置默认密码
    data.setdefault("password", md5value("123456abc"))

    serializer = CreateUserSerializer(data=data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return success(data=serializer.data, msg="创建成功")

    logger.error("用户创建失败")
    return error(msg="创建失败", data=serializer.errors)


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def get_user_info(request: Request, pk: str):
    """获取任意用户信息"""
    user = User.objects.filter(id=pk).first()
    user_info = AdminUserInfoSerializer(user, context={"request": request}).data
    return success(data=user_info, msg="获取用户信息成功")


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def get_user_list(request: Request):
    """获取用户列表（支持分页和关键词搜索）"""
    keyword = request.query_params.get("keyword", "").strip()

    # 构造查询集
    users = User.objects  # 懒加载 QuerySet
    if keyword:
        users = users.filter(
            Q(username__icontains=keyword) |
            Q(nickname__icontains=keyword) |
            Q(email__icontains=keyword) |
            Q(mobile__icontains=keyword)
        )
    else:
        users = users.all()

    # 使用封装后的分页响应
    return paginate_and_respond(
        queryset=users,
        request=request,
        serializer_class=AdminUserInfoSerializer,
        context={"request": request},
        msg="获取用户列表成功"
    )


@api_view(["PUT", "PATCH"])
@authentication_classes([AdminAuthentication])
@throttle_classes([UserRateThrottle])
def update_user_info(request: Request, pk: str):
    """更新任意用户信息"""
    try:
        user = User.objects.filter(id=pk).first()
        data = request.data.copy()
        username = data.get("username")
        if username and user.username != username:
            if User.objects.filter(username=username).exists():
                return error(msg="用户名已存在")
        # 去除空值
        data = request.data.copy()
        data = {k: v for k, v in data.items() if v not in [None, ""]}

        if not data and not request.FILES:
            return error(msg="没有提供任何有效的更新数据", code=400)

        serializer = AdminUserInfoSerializer(
            instance=user,
            data=data,
            context={"request": request},
            partial=True
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


@api_view(['PUT', 'PATCH'])
@authentication_classes([AdminAuthentication])
@throttle_classes([UserRateThrottle])
def update_password(request: Request, pk: str):
    """更新任意用户密码"""
    user = User.objects.filter(id=pk).first()
    new_password = request.data.get("password")
    # 非空校验
    if not new_password:
        return error(msg="密码不能为空")

    # 密码是否有效
    is_valid, error_msg = is_valid_password(new_password)
    if not is_valid:
        return error(msg=error_msg)

    # 更新密码
    user.password = md5value(new_password)
    user.save(update_fields=["password"])

    return success(msg="密码修改成功, 请重新登录")


@api_view(["DELETE"])
@authentication_classes([AdminAuthentication])
def delete_user(request: Request):
    """批量删除用户"""
    ids_arr = request.data
    if not ids_arr or not isinstance(ids_arr, list):
        return error(msg="请提供有效的 ID 列表")

    # 删除用户，返回删除数量
    deleted_count, _ = User.objects.filter(id__in=ids_arr).delete()

    if deleted_count == 0:
        return error(msg="未找到要删除的用户")

    return success(msg=f"成功删除 {deleted_count} 个用户")
