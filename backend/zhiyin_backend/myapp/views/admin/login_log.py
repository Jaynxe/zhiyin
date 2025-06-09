from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication

from django.db.models import Q

from myapp.logging.logger import logger
from myapp.utils.pagination import paginate_and_respond
from myapp.models import LoginLog
from myapp.serializers import LoginLogSerializer
from myapp.utils.response import error, success


@api_view(['GET'])
@authentication_classes([AdminAuthentication])
def get_login_log_list(request:Request):
    """
    登录日志列表，支持分页和模糊搜索（按用户名、IP）。
    GET 参数：
        - page: 当前页码
        - pageSize: 每页数量
        - keyword: 关键字（搜索用户名或 IP）
    """
    keyword = request.query_params.get("keyword", "").strip()

    filters = Q()
    if keyword:
        filters |= Q(username__icontains=keyword) | Q(ip__icontains=keyword)

    queryset = LoginLog.objects.filter(filters).order_by("-log_time")

    return paginate_and_respond(
        queryset=queryset,
        request=request,
        serializer_class=LoginLogSerializer,
        context={"request": request},
        msg="查询成功"
    )


@api_view(['DELETE'])
@authentication_classes([AdminAuthentication])
def delete_login_logs(request:Request):
    """
    批量删除登录日志
    请求体：{ "ids": [1, 2, 3] }
    """
    ids = request.data

    if not ids or not isinstance(ids, list):
        print(type(ids))
        return error(msg="请提供待删除的 ID 列表")
    

    queryset = LoginLog.objects.filter(id__in=ids)
    deleted_count = queryset.count()
    if deleted_count == 0:
        return error(msg="未找到指定的日志记录")

    queryset.delete()
    return success(msg=f"删除成功，共删除 {deleted_count} 条记录")


@api_view(['DELETE'])
@authentication_classes([AdminAuthentication])
def clear_login_logs(request: Request):
    """
    清空所有登录日志（管理员操作）
    可选参数：confirm=true
    """
    confirm = request.query_params.get("confirm")
    if confirm != "true":
        return error(msg="请确认是否清空日志：传入参数 ?confirm=true")

    count = LoginLog.objects.count()
    if count == 0:
        return success(msg="日志已为空，无需清除")

    LoginLog.objects.all().delete()

    logger.info(f"管理员 {request.user.username} 清空了所有登录日志（共 {count} 条）")

    return success(msg=f"删除成功，共清除 {count} 条登录日志")