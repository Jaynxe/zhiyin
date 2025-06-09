from django.shortcuts import get_object_or_404

from myapp.auth.authentication import AdminAuthentication
from myapp.logging.logger import logger
from myapp.models import Feedback, UserNotice, SystemNotice
from myapp.serializers import FeedbackSerializer
from myapp.utils.email import send_email
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success

from rest_framework.decorators import api_view, authentication_classes

from django.db.models import Q
from rest_framework.request import Request


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def get_feedback_list(request):
    keyword = request.query_params.get("keyword", "").strip()

    filters = Q()
    if keyword:
        filters |= Q(title__icontains=keyword)
        filters |= Q(content__icontains=keyword)

    queryset = Feedback.objects.filter(filters).order_by("-create_time")

    return paginate_and_respond(
        queryset,
        request,
        FeedbackSerializer,
        context={"request": request},
        msg="获取反馈成功",
    )


@api_view(["PUT", "PATCH"])
@authentication_classes([AdminAuthentication])
def update_feedback(request: Request, pk: str):
    """管理员回复反馈并设置状态"""
    feedback = get_object_or_404(Feedback, pk=pk)
    data = request.data.copy()

    allowed_fields = {"reply", "status"}
    data = {k: v for k, v in data.items() if k in allowed_fields and v not in [None, "", [], {}]}

    if not data:
        return error(msg="请提供回复内容或状态更新")

    if feedback.status == "1":
        return error(msg="反馈已处理，不能修改")

    serializer = FeedbackSerializer(
        feedback, data=data, partial=True, context={"request": request}
    )

    if serializer.is_valid():
        serializer.save()

        # 构造通知内容
        if "reply" in data:
            reply_content = data["reply"]
            subject = f"您的反馈《{feedback.title}》有了新的回复"
            content = f"管理员回复了您的反馈内容：{reply_content}"

            # ✅ 发站内通知
            notice = SystemNotice.objects.create(
                title=subject,
                content=content,
                status="0",  # 发布
                type="notification",
                is_global=False,
            )
            UserNotice.objects.create(user=feedback.user, notice=notice)

            # ✅ 发邮件（可选）
            if feedback.user.email and feedback.user.push_switch:
                try:
                    send_email(feedback.user.email, subject, content,html=True)
                except Exception as e:
                    logger.error(f"发送反馈回复邮件失败: {str(e)}")

        return success(msg="处理反馈成功", data=serializer.data)

    return error(msg="处理失败", data=serializer.errors)



@api_view(["DELETE"])
@authentication_classes([AdminAuthentication])
def delete_feedback(request: Request):
    """
    删除反馈（支持批量删除）
    请求体 JSON 示例：
    {
        "ids": [1, 2, 3]
    }
    """
    ids_arr = request.data
    if not ids_arr or not isinstance(ids_arr, list):
        return error(msg="请提供有效的 ID 列表")

    deleted_count, _ = Feedback.objects.filter(id__in=ids_arr, status="0").delete()
    if deleted_count == 0:
        return error(msg="没有找到要删除的广告")
    return success(msg=f"成功删除 {deleted_count} 条反馈")
