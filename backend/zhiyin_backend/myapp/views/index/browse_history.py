from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import UserAuthentication
from myapp.logging.logger import logger
from myapp.models import Song, BrowseHistory
from myapp.serializers import BrowseHistorySerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success
from datetime import datetime


@api_view(["POST"])
@authentication_classes([UserAuthentication])
def create_browse_history(request: Request):
    """
    创建浏览记录
    请求参数: { "song_id": "<歌曲ID>" }
    """
    try:
        user = request.user
        song_id = request.data.get("song_id")

        if not song_id:
            return error(msg="缺少参数：song_id")

        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return error(msg="该歌曲不存在")

        # 查询是否存在浏览记录
        record = BrowseHistory.objects.filter(user=user, song=song).first()

        now = datetime.now()

        if record:
            # 更新浏览时间
            record.browse_time = now
            record.save(update_fields=['browse_time'])
            return success(msg="浏览记录更新成功")
        else:
            # 创建新浏览记录
            BrowseHistory.objects.create(user=user, song=song)
            return success(msg="浏览记录添加成功")

    except Exception as e:
        logger.error(f"添加浏览记录失败: {str(e)}")
        return error(msg="添加失败")


@api_view(["GET"])
@authentication_classes([UserAuthentication])
def get_browse_history_list(request: Request):
    """
    获取浏览记录（支持分页、关键词搜索，仅限当前用户）
    """
    try:
        user = request.user
        keyword = request.query_params.get("keyword", "").strip()

        queryset = BrowseHistory.objects.filter(user=user).select_related("song")

        if keyword:
            queryset = queryset.filter(song__title__icontains=keyword)

        return paginate_and_respond(
            request=request,
            queryset=queryset,
            serializer_class=BrowseHistorySerializer,
            context={"request": request},
            msg="查询成功"
        )

    except Exception as e:
        return error(msg="获取浏览记录失败", data={"error": str(e)})


@api_view(["DELETE"])
@authentication_classes([UserAuthentication])
def delete_browse_history(request: Request):
    """
    删除浏览记录（支持单条或批量）
    请求体格式：
    {
        "ids": ["记录ID1", "记录ID2", ...]
    }
    """
    try:
        user = request.user
        ids = request.data.get("ids", [])

        if not isinstance(ids, list) or not ids:
            return error(msg="缺少参数或格式错误：ids")

        # 仅删除当前用户的记录，避免越权
        deleted_count, _ = BrowseHistory.objects.filter(user=user, id__in=ids).delete()

        return success(
            msg="删除成功",
            data={"deleted_count": deleted_count}
        )

    except Exception as e:
        logger.error(f"删除浏览记录失败: {str(e)}")
        return error(msg="删除失败", data={"error": str(e)})
