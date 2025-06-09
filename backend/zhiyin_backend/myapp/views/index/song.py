from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import UserAuthentication
from myapp.logging.logger import logger
from myapp.models import Song, Record, User
from myapp.serializers import SongSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import success, error
from myapp.utils.common import get_recommend
from django.db import transaction


# 获取歌曲列表
@api_view(['GET'])
def get_song_list(request: Request):
    """
    获取歌曲列表
    """
    keyword = request.query_params.get('keyword', '').strip()
    classification_id = request.query_params.get("classification")  # 分类 ID
    language_id = request.query_params.get("language")  # 语言 ID
    sort = request.query_params.get("sort", 'recent')  # 排序方式: recent / hot

    # 排序字段
    order_by = '-plays' if sort == 'hot' else '-create_time'

    # 构建基础过滤条件
    filters = Q(status='0')

    if keyword:
        filters &= Q(title__icontains=keyword)
    if classification_id:
        filters &= Q(classification_id=classification_id)
    if language_id:
        filters &= Q(language_id=language_id)

    # 查询集
    queryset = Song.objects.filter(filters).order_by(order_by)

    # 使用封装的分页返回方法
    return paginate_and_respond(
        queryset=queryset,
        request=request,
        serializer_class=SongSerializer,
        context={'request': request},
        msg='查询成功'
    )


# 获取推荐歌曲
@api_view(['GET'])
@authentication_classes([UserAuthentication])
def get_recommend_song(request: Request):
    # 推荐（协同过滤）
    things = get_recommend(request)
    serializer = SongSerializer(things, many=True, context={'request': request})
    return success(msg='查询成功', data=serializer.data)


# 音乐详情
@api_view(['GET'])
def get_song_info(request: Request, pk: str):
    try:
        song = Song.objects.get(pk=pk)
    except Song.DoesNotExist:
        return error(msg='歌曲不存在')

    serializer = SongSerializer(song, context={'request': request})
    return success(msg='获取成功', data=serializer.data)


# 播放量+1
@api_view(['POST'])
@authentication_classes([UserAuthentication])
def add_plays(request: Request):
    user = request.user
    user_id = user.id
    song_id = request.data.get('song_id')
    try:
        # 使用事务保证操作一致性
        with transaction.atomic():
            song = Song.objects.select_for_update().get(pk=song_id)
            song.plays = song.plays + 1
            song.save()

            # 记录用户浏览行为（协同过滤）
            if user_id is not None:
                record, created = Record.objects.get_or_create(
                    user_id=user_id,
                    song_id=song_id,
                    defaults={'score': 1}
                )
                if not created:
                    record.score += 1
                    record.save()

        return success(msg='操作成功')

    except Song.DoesNotExist:
        return error(msg='对象不存在')
    except Exception as e:
        return error(msg=f'服务异常：{str(e)}')
