from myapp.auth.authentication import UserAuthentication

from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request
from django.utils.timezone import now
from myapp.models import UserNotice, SystemNotice
from myapp.serializers import UserNoticeSerializer, SystemNoticeSerializer
from myapp.utils.response import success, error


@api_view(["GET"])
@authentication_classes([UserAuthentication])
def get_user_notice_list(request: Request):
    """
    获取当前用户的个人通知列表（不含公告），只包含未读通知。
    仅当用户的 push_switch 为 True 时才返回通知。
    """
    user = request.user

    # 判断用户是否开启通知推送
    if not getattr(user, "push_switch", False):
        return success(msg="通知推送已关闭", data=[])

    notices = (
        UserNotice.objects.filter(
            user=user,
            notice__status="0",
            notice__type="notification",
            is_read=False,
        )
        .select_related("notice")
        .order_by("-receive_time")
    )

    serializer = UserNoticeSerializer(notices, many=True)
    return success(msg="查询成功", data=serializer.data)


@api_view(["GET"])
@authentication_classes([UserAuthentication])
def get_announcement_list(request: Request):
    """
    获取系统公告列表（全体用户可见的发布状态公告），只返回未读公告
    """
    user = request.user

    # 全局公告，未读过滤逻辑：UserNotice 关联了公告和用户的已读状态
    read_announcement_ids = UserNotice.objects.filter(
        user=user, is_read=True, notice__type="announcement"
    ).values_list("notice_id", flat=True)

    announcements = (
        SystemNotice.objects.filter(
            status="0",
            type="announcement",
            is_global=True,
        )
        .exclude(id__in=read_announcement_ids)
        .order_by("-create_time")
    )

    serializer = SystemNoticeSerializer(announcements, many=True)
    return success(msg="查询成功", data=serializer.data)


@api_view(["POST"])
@authentication_classes([UserAuthentication])
def mark_notice_read(request: Request, pk: str):
    """
    标记用户通知为已读
    """
    user = request.user
    try:
        user_notice = UserNotice.objects.get(user=user, notice_id=pk)

        if not user_notice.is_read:
            user_notice.is_read = True
            user_notice.read_time = now()
            user_notice.save(update_fields=["is_read", "read_time"])

        return success(msg="标记成功")

    except UserNotice.DoesNotExist:
        return error(msg="通知不存在")
