from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.logging.logger import logger
from myapp.models import Song
from myapp.serializers import SongSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success


@api_view(['GET'])
@authentication_classes([AdminAuthentication])
def get_song_list(request: Request):
    keyword = request.query_params.get('keyword', '').strip()

    # 构建查询条件
    filters = Q()
    if keyword:
        filters &= (
                Q(title__icontains=keyword) |
                Q(singer__icontains=keyword) |
                Q(classification__name__icontains=keyword) |
                Q(language__name__icontains=keyword)
        )

    # 使用过滤条件查询 + 排序（注意只查询必要字段可以提高效率）
    queryset = Song.objects.filter(filters).order_by('-id')

    return paginate_and_respond(
        queryset=queryset,
        request=request,
        serializer_class=SongSerializer,
        context={'request': request},
        msg="获取成功"
    )


@api_view(['POST'])
@authentication_classes([AdminAuthentication])
def create_song(request: Request):
    user = request.user
    #  验证基础字段
    required_fields = ['title', 'cover', 'source', 'singer', 'classification', 'language']
    for field in required_fields:
        if not request.data.get(field):
            return error(msg=f"{field} 不能为空")
    # 去除空值
    data = {k: v for k, v in request.data.items() if v not in [None, ""]}
    data['user'] = user.id
    # 4. 组合数据并验证
    serializer = SongSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return success(msg='创建成功', data=serializer.data)
    else:
        logger.error(serializer.errors)
        return error(msg='创建失败', data=serializer.errors)


@api_view(['PUT', 'PATCH'])
@authentication_classes([AdminAuthentication])
def update_song(request: Request, pk: str):
    try:
        song = Song.objects.get(pk=pk)
    except Song.DoesNotExist:
        return error(msg="歌曲不存在")

    # 只保留非空字段（包括 cover 和 source 字符串路径）
    data = {k: v for k, v in request.data.items() if v not in [None, ""]}
    print(data)
    serializer = SongSerializer(instance=song, data=data, context={'request': request}, partial=True)
    if serializer.is_valid():
        serializer.save()
        return success(msg='更新成功', data=serializer.data)
    else:
        logger.error(serializer.errors)
        return error(msg='更新失败', data=serializer.errors)


@api_view(['DELETE'])  # 通常用 POST 处理批量删除请求
@authentication_classes([AdminAuthentication])
def delete_songs(request: Request):
    ids = request.data

    if not ids or not isinstance(ids, list):
        return error(msg='请提供待删除的歌曲ID列表')

    songs = Song.objects.filter(id__in=ids)
    deleted_count = songs.count()
    if deleted_count == 0:
        return error(msg='未找到任何匹配的歌曲')

    try:
        songs.delete()
        return success(msg=f'成功删除 {deleted_count} 首歌曲')
    except Exception as e:
        logger.error(f"批量删除出错: {e}")
        return error(msg='批量删除失败')
