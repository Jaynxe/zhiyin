from django.shortcuts import get_object_or_404
from rest_framework.request import Request

from myapp.auth.authentication import UserAuthentication
from myapp.auth.rate_throttle import UserRateThrottle
from myapp.logging.logger import logger
from myapp.models import Feedback
from myapp.serializers import FeedbackSerializer
from myapp.utils.response import error, success

from rest_framework.decorators import api_view, throttle_classes, authentication_classes


@api_view(['POST'])
@throttle_classes([UserRateThrottle])
@authentication_classes([UserAuthentication])
def create_feedback(request: Request):
    user = request.user
    data = request.data.copy()
    # 去除空值
    data = {k: v for k, v in data.items() if v not in [None, ""]}

    title = data.get('title')
    content = data.get('content')

    if not title or not content:
        return error(msg='标题和内容不能为空')

    # 强制绑定当前用户和邮箱
    data['user'] = user.id
    if user.email:
        data['email'] = user.email

    serializer = FeedbackSerializer(data=data, context={"request": request}, partial=True)
    if serializer.is_valid():
        serializer.save()
        ret_serializer = FeedbackSerializer(serializer.instance, exclude_fields=['email', 'user'])
        return success(msg='提交成功', data=ret_serializer.data)
    else:
        logger.error(serializer.errors)
        return error(msg='提交失败', data=serializer.errors)


@api_view(['GET'])
@throttle_classes([UserRateThrottle])
@authentication_classes([UserAuthentication])
def get_feedback_list(request):
    user = request.user
    feedbacks = Feedback.objects.filter(user=user).order_by('-create_time')

    serializer = FeedbackSerializer(feedbacks, context={"request": request}, many=True,
                                    exclude_fields=['email', 'user'])
    return success(msg='获取成功', data=serializer.data)


@api_view(['PUT', 'PATCH'])
@authentication_classes([UserAuthentication])
def update_feedback(request, pk: str):
    feedback = get_object_or_404(Feedback, pk=pk, user=request.user)

    if feedback.status == '1':
        return error(msg="反馈已处理，不能修改")

    data = request.data.copy()

    # 去除空字段（None、空字符串、空列表等）
    data = {k: v for k, v in data.items() if v not in [None, '', [], {}]}

    serializer = FeedbackSerializer(feedback, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        ret_serializer = FeedbackSerializer(serializer.instance, exclude_fields=['email', 'user'])
        return success(msg="修改成功", data=ret_serializer.data)
    logger.error(serializer.errors)
    return error(msg="修改失败", data=serializer.errors)


@api_view(['DELETE'])
@authentication_classes([UserAuthentication])
def delete_feedback(request, pk: str):
    feedback = get_object_or_404(Feedback, pk=pk, user=request.user)

    if feedback.status == '1':
        return error(msg="反馈已处理，不能删除")

    feedback.delete()
    return success(msg="删除成功")
