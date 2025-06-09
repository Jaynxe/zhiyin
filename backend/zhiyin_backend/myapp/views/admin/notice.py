from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.models import UserNotice, SystemNotice
from myapp.serializers import SystemNoticeSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import success, error

from django.db.models import Q


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def list_all_notices(request: Request):
    keyword = request.query_params.get("keyword", "").strip()
    status = request.query_params.get("status")
    notice_type = request.query_params.get("type")

    filters = Q()
    if keyword:
        filters |= Q(title__icontains=keyword)
        filters |= Q(content__icontains=keyword)

    if status in ["0", "1"]:
        filters &= Q(status=status)

    if notice_type in ["announcement", "notification"]:
        filters &= Q(type=notice_type)

    queryset = SystemNotice.objects.filter(filters).order_by("-create_time")

    return paginate_and_respond(
        queryset, request, SystemNoticeSerializer, msg="获取通知列表成功"
    )


@api_view(["POST"])
@authentication_classes([AdminAuthentication])
def create_notice_all(request: Request):
    """
    创建并发送系统公告给所有用户
    """
    data = request.data.copy()
    data["is_global"] = True
    data["type"] = "announcement"

    serializer = SystemNoticeSerializer(data=data)
    if serializer.is_valid():
        notice = serializer.save()
        notice.send_to_users()  # 会自动发送给所有用户
        return success(msg="发送成功", data=serializer.data)

    return error(msg="验证失败", data=serializer.errors)


@api_view(["POST"])
@authentication_classes([AdminAuthentication])
def create_notice_some(request: Request):
    """
    创建并发送通知给指定用户
    """
    user_ids = request.POST.getlist("receivers")  # ['2', '5', '9']

    if not user_ids:
        return error(msg="请提供接收用户的 ID 列表")

    data = request.data.copy()
    data["type"] = "notification"
    data["is_global"] = False

    serializer = SystemNoticeSerializer(data=data)
    if serializer.is_valid():
        notice = serializer.save()
        notice.send_to_users(user_ids)
        return success(msg="发送成功", data=serializer.data)

    return error(msg="验证失败", data=serializer.errors)


@api_view(["DELETE"])
@authentication_classes([AdminAuthentication])
def delete_notices(request: Request):
    """
    批量删除通知及关联记录
    """
    ids = request.data
    if not ids:
        return error(msg="请提供要删除的通知 ID 列表")

    notices = SystemNotice.objects.filter(id__in=ids)
    count = notices.count()

    with transaction.atomic():
        UserNotice.objects.filter(notice_id__in=ids).delete()
        notices.delete()

    return success(msg=f"成功删除 {count} 条通知")


@api_view(["PUT"])
@authentication_classes([AdminAuthentication])
def update_notice(request, pk: str):
    """
    更新通知内容（仅未下线通知可编辑）
    """
    notice = get_object_or_404(SystemNotice, pk=pk)

    if notice.status == "1":
        return error(msg="下线通知无法编辑")

    serializer = SystemNoticeSerializer(
        instance=notice, data=request.data, partial=True
    )
    if serializer.is_valid():
        serializer.save()
        return success(msg="通知更新成功", data=serializer.data)

    return error(msg="更新失败", data=serializer.errors)
