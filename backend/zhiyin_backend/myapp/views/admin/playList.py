from django.db import transaction
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request
from myapp.auth.authentication import AdminAuthentication
from myapp.models import Playlist
from myapp.serializers import PlaylistSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success


# 获取歌单列表（分页）
@api_view(['GET'])
@authentication_classes([AdminAuthentication])
def playlist_list(request: Request):
    keyword = request.query_params.get('keyword', '').strip()
    classification = request.query_params.get('classification')

    filters = Q()
    if keyword:
        filters &= Q(name__icontains=keyword)
    if classification:
        filters &= Q(classifications__id=classification)

    queryset = Playlist.objects.filter(filters).distinct().order_by("-create_time")
    return paginate_and_respond(queryset, request, PlaylistSerializer, msg="获取歌单列表成功")


# 创建歌单
@api_view(['POST'])
@authentication_classes([AdminAuthentication])
def playlist_create(request: Request):
    serializer = PlaylistSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(creator=request.user)  # 自动保存 classifications
        return success(msg="创建成功", data=serializer.data)
    return error(msg=serializer.errors)


# 更新歌单
@api_view(['PUT'])
@authentication_classes([AdminAuthentication])
def playlist_update(request: Request, pk: str):
    try:
        playlist = Playlist.objects.get(pk=pk)
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在")
    serializer = PlaylistSerializer(playlist, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()  # 自动更新 classifications
        return success(msg="操作成功", data=serializer.data)
    return error(msg=serializer.errors)


# 删除歌单
@api_view(['DELETE'])
@authentication_classes([AdminAuthentication])
def playlist_delete(request: Request):
    ids = request.data
    if not ids:
        return error(msg="请提供要删除的歌单 ID 列表")

    playlist = Playlist.objects.filter(id__in=ids)
    count = playlist.count()

    with transaction.atomic():
        playlist.delete()

    return success(msg=f"成功删除 {count} 条歌单")
