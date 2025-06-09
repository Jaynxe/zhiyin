from rest_framework.decorators import api_view, authentication_classes

from rest_framework.request import Request
from django.shortcuts import get_object_or_404
from myapp.auth.authentication import AdminAuthentication
from myapp.logging.logger import logger
from myapp.models import Advertise

from myapp.serializers import AdSerializer
from myapp.utils.common import validate_upload_size
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import success, error

from django.db.models import Q


@api_view(["GET"])
def get_advertise_list(request):
    keyword = request.query_params.get("keyword", "").strip()

    filters = Q()
    if keyword:
        filters |= Q(title__icontains=keyword)

    queryset = Advertise.objects.filter(filters).order_by("-create_time")

    return paginate_and_respond(
        queryset, request, AdSerializer, context={"request": request}, msg="查询成功"
    )


@api_view(["POST"])
@authentication_classes([AdminAuthentication])
def create_advertise(request: Request):
    """
    创建广告（支持上传图片）
    """
    ad_data = request.data

    # 参数完整性校验
    required_fields = ["title", "cover", "link"]
    for field in required_fields:
        if not ad_data.get(field):
            return error(msg=f"缺少必填字段: {field}")

    data = {
        "title": ad_data.get("title"),
        "cover": ad_data.get("cover"),
        "link": ad_data.get("link"),
    }

    serializer = AdSerializer(data=data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return success(msg="创建成功", data=serializer.data)
    else:
        logger.error(serializer.errors)
        return error(msg="创建失败", data=serializer.errors)


# 更新广告
@api_view(["PUT", "PATCH"])
@authentication_classes([AdminAuthentication])
def update_advertise(request: Request, pk: str):
    ad = get_object_or_404(Advertise, pk=pk)

    # 清除空字段，避免误更新为空
    data = request.data
    data = {k: v for k, v in data.items() if v not in [None, "", [], {}]}
    print(data)
    serializer = AdSerializer(ad, data=data, partial=True, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        print(serializer.data)
        return success(msg="更新成功", data=serializer.data)
    else:
        logger.error(serializer.errors)
        return error(msg="更新失败", data=serializer.errors)


# 删除广告
@api_view(["DELETE"])
@authentication_classes([AdminAuthentication])
def delete_advertise(request: Request):
    """删除广告"""
    ids_arr = request.data
    if not ids_arr or not isinstance(ids_arr, list):
        return error(msg="请提供有效的 ID 列表")

    deleted_count, _ = Advertise.objects.filter(id__in=ids_arr).delete()
    if deleted_count == 0:
        return error(msg="没有找到要删除的广告")
    return success(msg=f"成功删除 {deleted_count} 个广告")
