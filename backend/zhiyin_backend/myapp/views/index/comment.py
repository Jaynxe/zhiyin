from django.db.models import Q
from django.utils.html import strip_tags
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import UserAuthentication
from myapp.models import Song, Comment, User, CommentLike
from myapp.serializers import CommentSerializer
from myapp.utils.pagination import CustomPagination, paginate_and_respond
from myapp.utils.response import success, error


@api_view(['GET'])
@authentication_classes([UserAuthentication])
def get_user_comments(request: Request):
    """
    获取指定用户的评论列表（支持关键词搜索和分页）
    查询参数:
        - username: 用户名
        - keyword: 关键词（搜索内容字段）
        - page: 页码
        - pageSize: 每页大小
    """
    user = request.user
    keyword = request.query_params.get('keyword', '').strip()

    # 构建查询条件
    filters = Q(user=user, status='0')  # 只查询正常状态的评论
    if keyword:
        filters &= Q(content__icontains=keyword)

    queryset = Comment.objects.filter(filters).order_by("-comment_time")

    return paginate_and_respond(queryset, request, CommentSerializer,
                                msg="查询成功",
                                context={'request': request})


@api_view(['GET'])
def get_comments_by_song(request: Request):
    """
    获取某首歌曲的所有评论（支持分页与关键词搜索）
    查询参数:
        - song_id: 歌曲ID（必须）
        - keyword: 模糊搜索内容（可选）
        - page: 页码（可选）
        - pageSize: 每页条数（可选）
    """
    song_id = request.query_params.get('song_id', '').strip()
    keyword = request.query_params.get('keyword', '').strip()

    if not song_id:
        return error(msg="缺少参数：song_id")

    filters = Q(song__id=song_id, status='0')
    if keyword:
        filters &= Q(content__icontains=keyword)

    queryset = Comment.objects.filter(filters).order_by('-comment_time')

    return paginate_and_respond(queryset, request, CommentSerializer,
                                msg="查询成功",
                                context={'request': request})


@api_view(['POST'])
@authentication_classes([UserAuthentication])
def create_comment(request: Request):
    data = request.data.copy()

    # 去除空格和 HTML 标签
    content = strip_tags(data.get("content", "")).strip()
    song_id = data.get("song_id")
    user = request.user
    # 参数检查
    if not song_id:
        return error(msg="缺少歌曲ID")
    if not content:
        return error(msg="评论内容不能为空")

    # 校验歌曲是否存在
    try:
        song = Song.objects.get(id=song_id)
        song.comment_count += 1
        song.save()
    except Song.DoesNotExist:
        return error(msg="歌曲不存在")

    # 创建评论
    data["content"] = content
    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=user, song=song)
        return success(msg="评论成功", data=serializer.data)
    return error(msg="评论失败", data=serializer.errors)


@api_view(['POST'])
@authentication_classes([UserAuthentication])
def reply_comment(request: Request):
    data = request.data.copy()

    content = strip_tags(data.get("content", "")).strip()
    song_id = data.get("song_id")
    parent_id = data.get("parent_id")  # 父评论ID，回复时需要传入

    if not song_id:
        return error(msg="缺少歌曲ID")
    if not content:
        return error(msg="回复内容不能为空")

    # 验证歌曲是否存在
    try:
        song = Song.objects.get(id=song_id)
        song.comment_count += 1
        song.save()
    except Song.DoesNotExist:
        return error(msg="歌曲不存在")

    parent_comment = None
    if parent_id:
        try:
            parent_comment = Comment.objects.get(id=parent_id)
        except Comment.DoesNotExist:
            return error(msg="父评论不存在")

    data["content"] = content
    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user, song=song, parent=parent_comment)
        return success(msg="回复成功", data=serializer.data)

    return error(msg="回复失败", data=serializer.errors)


@api_view(['POST'])
@authentication_classes([UserAuthentication])
def toggle_comment_like(request: Request):
    """
    点赞/取消点赞评论
    参数:
    - comment_id: 评论ID
    """
    user = request.user
    comment_id = request.data.get("comment_id")

    if not user:
        return error(msg="请先登录")

    if not comment_id:
        return error(msg="缺少参数：comment_id")

    try:
        comment = Comment.objects.get(pk=comment_id, status="0")
    except Comment.DoesNotExist:
        return error(msg="评论不存在")

    # 检查是否已经点赞
    existing_like = CommentLike.objects.filter(user=user, comment=comment).first()

    if existing_like:
        # 已点赞，取消点赞
        existing_like.delete()
        comment.like_count = max(comment.like_count - 1, 0)
        comment.save()
        return success(msg="取消点赞成功", data={
            "is_liked": False,
            "like_count": comment.like_count
        })
    else:
        # 未点赞，执行点赞
        CommentLike.objects.create(user=user, comment=comment)
        comment.like_count += 1
        comment.save()
        return success(msg="点赞成功", data={
            "is_liked": True,
            "like_count": comment.like_count
        })


def delete_comment_and_replies(comment):
    """
    递归删除评论及其子评论，同时更新歌曲的评论计数
    """
    for reply in comment.replies.all():
        delete_comment_and_replies(reply)

    if comment.song and comment.song.comment_count > 0:
        comment.song.comment_count -= 1
        comment.song.save()

    comment.delete()


@api_view(['DELETE'])
@authentication_classes([UserAuthentication])
def batch_delete_comments(request: Request):
    """
    批量物理删除评论及其所有子评论，并同步更新歌曲的评论数
    """
    comment_ids = request.data
    if not isinstance(comment_ids, list) or not comment_ids:
        return error(msg="请提供评论ID列表")

    deleted_count = 0
    for cid in comment_ids:
        try:
            comment = Comment.objects.get(id=cid)
            delete_comment_and_replies(comment)
            deleted_count += 1
        except Comment.DoesNotExist:
            continue  # 跳过不存在的评论

    return success(msg=f"成功删除{deleted_count}条评论及其子评论")
