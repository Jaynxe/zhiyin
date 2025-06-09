from django.db.models import Q
from rest_framework.decorators import authentication_classes, api_view
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.models import Comment
from myapp.serializers import CommentSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success


@api_view(['GET'])
@authentication_classes([AdminAuthentication])
def get_comments_list(request: Request):
    """
    管理员接口：获取所有评论（支持分页和关键词搜索）
    查询参数:
        - keyword: 关键词（搜索评论内容）
        - page: 页码
        - pageSize: 每页大小
    """
    keyword = request.query_params.get('keyword', '').strip()

    filters = Q()  # 默认只获取正常状态的评论
    if keyword:
        filters &= Q(content__icontains=keyword)

    queryset = Comment.objects.filter(filters).order_by('-comment_time')
    return paginate_and_respond(queryset, request, CommentSerializer,
                                msg="查询成功",
                                context={'request': request})


@api_view(['PUT', 'PATCH'])
@authentication_classes([AdminAuthentication])
def update_comment(request: Request, pk: str):
    """
    管理员接口：更新评论内容或状态
    路径参数:
        - pk: 评论ID
    请求体参数:
        - content: 新的评论内容（可选）
        - status: 评论状态：'0'正常 / '1'禁用（可选）
    """
    comment = Comment.objects.filter(pk=pk).first()
    if not comment:
        return error(msg="评论不存在", code=404)
    data = request.data
    data = {k: v for k, v in data.items() if v not in [None, "", [], {}]}

    serializer = CommentSerializer(comment, data=data, partial=True)
    if not serializer.is_valid():
        return error(msg="参数验证失败", data=serializer.errors, code=400)

    serializer.save()
    return success(msg="评论更新成功", data=serializer.data)
