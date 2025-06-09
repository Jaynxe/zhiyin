from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request
from django.db import transaction
from django.db.models import Q

from myapp.auth.authentication import UserAuthentication
from myapp.models import Playlist, Song, Record
from myapp.serializers import PlaylistSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success


# 歌单列表
@api_view(['GET'])
@authentication_classes([UserAuthentication])
def playlist_list(request: Request):
    keyword = request.query_params.get('keyword', '').strip()
    classification_id = request.query_params.get('classification')

    filters = Q(status='0', visibility='public')

    if keyword:
        filters &= (Q(name__icontains=keyword) | Q(description__icontains=keyword))

    if classification_id:
        filters &= Q(classifications__id=classification_id)

    sort = request.query_params.get('sort', 'create_time')  # 支持按创建时间、播放数、收藏数排序
    order_by = f'-{sort}' if sort in ['create_time', 'play_count', 'collect_count'] else '-create_time'
    queryset = Playlist.objects.filter(filters).order_by(order_by)
    return paginate_and_respond(queryset, request, PlaylistSerializer, msg="获取歌单列表成功")


# 歌单详情
@api_view(['GET'])
@authentication_classes([UserAuthentication])
def playlist_detail(request: Request, pk: str):
    try:
        playlist = Playlist.objects.get(pk=pk, status='0', visibility='public')  # 只允许访问上架歌单
        if playlist.visibility == 'private' and playlist.creator != request.user:
            return error(msg="该歌单是私密的，你没有权限访问")
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在或已下架")

    serializer = PlaylistSerializer(playlist)
    return success(data=serializer.data, msg="获取歌单详情成功")


#  用户收藏的歌单
@api_view(['GET'])
@authentication_classes([UserAuthentication])
def my_collected_playlists(request: Request):
    queryset = request.user.collected_playlists.filter(status='0', visibility='public').order_by('-create_time')
    return paginate_and_respond(queryset, request, PlaylistSerializer, msg="获取我的收藏歌单成功")


# 用户创建的歌单
@api_view(['GET'])
@authentication_classes([UserAuthentication])
def my_playlists(request: Request):
    queryset = request.user.collected_playlists.filter(status='0').order_by('-create_time')
    return paginate_and_respond(queryset, request, PlaylistSerializer, msg="获取我的歌单成功")


# 收藏/移除收藏歌单
@api_view(['POST'])
@authentication_classes([UserAuthentication])
def playlist_collect_toggle(request: Request, pk: str):
    try:
        playlist = Playlist.objects.get(pk=pk, status='0')
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在或已下架")

    user = request.user
    if playlist.collect_users.filter(id=user.id).exists():
        playlist.collect_users.remove(user)
        playlist.collect_count = playlist.collect_users.count()
        playlist.save()
        return success(msg="取消收藏成功")
    else:
        playlist.collect_users.add(user)
        playlist.collect_count = playlist.collect_users.count()
        playlist.save()
        return success(msg="收藏成功")


# 创建歌单
@api_view(['POST'])
@authentication_classes([UserAuthentication])
def create_playlist(request: Request):
    data = request.data.copy()
    serializer = PlaylistSerializer(data=data)

    if serializer.is_valid():
        serializer.save(creator=request.user)
        return success(data=serializer.data, msg="创建歌单成功")
    else:
        return error(msg="创建失败", data=serializer.errors)


# 更新歌单
@api_view(['PUT'])
@authentication_classes([UserAuthentication])
def update_playlist(request: Request, pk: str):
    try:
        playlist = Playlist.objects.filter(pk=pk, creator=request.user).first()
        if playlist and playlist.creator != request.user:
            return error(msg="你没有权限修改此歌单")
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在或你无权限修改")

    serializer = PlaylistSerializer(playlist, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return success(data=serializer.data, msg="更新歌单成功")
    else:
        return error(msg="更新失败", data=serializer.errors)


# 删除歌单
@api_view(['DELETE'])
@authentication_classes([UserAuthentication])
def delete_playlist(request: Request):
    ids = request.data
    if not ids:
        return error(msg="请提供要删除的歌单 ID 列表")

    playlist = Playlist.objects.filter(id__in=ids)
    count = playlist.count()

    with transaction.atomic():
        playlist.delete()

    return success(msg=f"成功删除 {count} 条歌单")


# 添加歌曲到歌单
@api_view(['POST'])
@authentication_classes([UserAuthentication])
def add_song_to_playlist(request: Request):
    user = request.user
    song_id = request.data.get('song_id')
    playlist_id = request.data.get('playlist_id')

    # 获取用户的歌单
    try:
        playlist = Playlist.objects.get(pk=playlist_id, creator=user)
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在或你没有权限操作")

    # 获取歌曲
    try:
        song = Song.objects.get(pk=song_id)
    except Song.DoesNotExist:
        return error(msg="歌曲不存在")

    # 检查歌曲是否已经在歌单中
    if playlist.songs.filter(pk=song.id).exists():
        return error(msg="歌曲已经在该歌单中")

    # 将歌曲添加到歌单
    playlist.songs.add(song)

    # 记录用户对歌曲的评分（如果没有记录，创建新记录；如果有记录，增加评分）
    record, created = Record.objects.get_or_create(
        user=user, song=song
    )
    if created:
        # 如果记录是新创建的，则默认评分为 5
        record.score = 5
    else:
        # 如果记录已存在，则增加 5 分
        record.score += 5

    # 保存评分记录
    record.save()

    # 返回成功消息
    return success(msg="歌曲已成功添加到歌单")


# 移除歌曲出歌单
@api_view(['POST'])
@authentication_classes([UserAuthentication])
def remove_song_from_playlist(request: Request):
    user = request.user
    song_id = request.data.get('song_id')
    playlist_id = request.data.get('playlist_id')

    # 获取用户的歌单
    try:
        playlist = Playlist.objects.get(pk=playlist_id, creator=user)
    except Playlist.DoesNotExist:
        return error(msg="歌单不存在或你没有权限操作")

    # 获取歌曲
    try:
        song = Song.objects.get(pk=song_id)
    except Song.DoesNotExist:
        return error(msg="歌曲不存在")

    # 检查歌曲是否在歌单中
    if not playlist.songs.filter(pk=song.id).exists():
        return error(msg="歌曲不在该歌单中")

    # 从歌单中移除歌曲
    playlist.songs.remove(song)

    # 更新评分记录（移除时扣 5 分，如果评分小于 0 则删除记录）
    try:
        record = Record.objects.get(user=user, song=song)
        record.score -= 5
        if record.score < 0:
            record.delete()
        else:
            record.save()
    except Record.DoesNotExist:
        return error(msg="评分记录不存在")

    # 返回成功消息
    return success(msg="歌曲已从歌单中移除")


# =============== 我喜欢的音乐歌单=============

@api_view(['GET'])
@authentication_classes([UserAuthentication])
def get_liked_playlist(request: Request):
    user = request.user
    liked_playlist = user.get_liked_playlist()

    # 序列化并返回歌单和歌曲信息
    serializer = PlaylistSerializer(liked_playlist, context={'request': request})
    return success(msg='查询成功', data=serializer.data)


@api_view(['POST'])
@authentication_classes([UserAuthentication])
def add_song_to_liked_playlist(request: Request):
    user = request.user
    song_id = request.data.get('song_id')

    # 获取用户的"我喜欢的歌曲"歌单
    liked_playlist = user.get_liked_playlist()

    try:
        song = Song.objects.get(pk=song_id)
    except Song.DoesNotExist:
        return error(msg='歌曲不存在')

    # 检查歌曲是否已存在于"我喜欢的歌曲"歌单中
    if liked_playlist.songs.filter(id=song_id).exists():
        return error(msg='这首歌已经在“我喜欢的歌曲”歌单里了')

    # 将歌曲添加到“我喜欢的歌曲”歌单
    liked_playlist.songs.add(song)

    # 记录用户对歌曲的评分（如果没有记录，创建新记录；如果有记录，增加评分）
    record, created = Record.objects.get_or_create(
        user=user, song=song
    )
    if created:
        # 如果记录是新创建的，则默认评分为 5
        record.score = 5
    else:
        # 如果记录已存在，则增加 5 分
        record.score += 5

    # 保存评分记录
    record.save()

    return success(msg='歌曲已添加到“我喜欢的歌曲”歌单')


@api_view(['POST'])
@authentication_classes([UserAuthentication])
def remove_song_from_liked_playlist(request: Request):
    user = request.user
    song_id = request.data.get('song_id')

    # 获取用户的"我喜欢的歌曲"歌单
    liked_playlist = user.get_liked_playlist()

    try:
        song = Song.objects.get(pk=song_id)
    except Song.DoesNotExist:
        return error(msg='歌曲不存在')

    # 从“我喜欢的歌曲”歌单中移除
    liked_playlist.songs.remove(song)

    # 更新评分记录（移除时扣 5 分，如果评分小于 0 则删除记录）
    try:
        record = Record.objects.get(user=user, song=song)
        record.score -= 5
        if record.score < 0:
            record.delete()
        else:
            record.save()
    except Record.DoesNotExist:
        return error(msg="评分记录不存在")

    return success(msg='歌曲已从“我喜欢的歌曲”歌单移除')
