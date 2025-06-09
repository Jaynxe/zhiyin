from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.logging.logger import logger
from myapp.models import Classification
from myapp.serializers import ClassificationSerializer
from myapp.utils.pagination import paginate_and_respond
from myapp.utils.response import error, success
from django.db.models import Q


@api_view(['GET'])
@authentication_classes([AdminAuthentication])
def get_classification_list(request: Request):
    keyword = request.query_params.get("keyword", "").strip()

    filters = Q()
    if keyword:
        filters &= Q(name__icontains=keyword)

    queryset = Classification.objects.filter(filters).order_by("-id")

    return paginate_and_respond(queryset, request, ClassificationSerializer, context={"request": request},
                                msg="查询成功")


@api_view(['POST'])
@authentication_classes([AdminAuthentication])
def create_classification(request: Request):
    name = request.data.get('name', '').strip()

    if not name:
        return error(msg='分类名不能为空')

    if Classification.objects.filter(name=name).exists():
        return error(msg='该分类已存在')

    serializer = ClassificationSerializer(data={"name": name})
    if serializer.is_valid():
        serializer.save()
        return success(msg='创建成功', data=serializer.data)

    logger.error(f"分类创建失败: {serializer.errors}")
    return error(msg='创建失败', data=serializer.errors)


# 更新分类
@api_view(['PUT', 'PATCH'])
@authentication_classes([AdminAuthentication])
def update_classification(request: Request, pk: str):
    classification = get_object_or_404(Classification, pk=pk)

    # 去除 name 前后空格（如有）
    name = request.data.get("name", "").strip()
    if not name:
        return error(msg="分类名不能为空")

    # 避免更新成已存在的分类
    if Classification.objects.exclude(pk=pk).filter(name=name).exists():
        return error(msg="该分类名称已存在")

    # 用清洗后的数据更新
    data = request.data.copy()
    data["name"] = name

    serializer = ClassificationSerializer(classification, data=data)
    if serializer.is_valid():
        serializer.save()
        return success(msg="更新成功", data=serializer.data)

    logger.warning(f"分类更新失败：{serializer.errors}")
    return error(msg="更新失败", data=serializer.errors)


# 删除分类
@api_view(['DELETE'])
@authentication_classes([AdminAuthentication])
def delete_classification(request: Request):
    ids = request.data

    if not ids or not isinstance(ids, list):
        return error(msg="参数错误，缺少有效的分类ID列表")

    try:
        deleted_count, _ = Classification.objects.filter(id__in=ids).delete()
        return success(msg=f"删除成功，共删除 {deleted_count} 条分类记录")
    except Exception as e:
        logger.error(f"批量删除分类失败：{str(e)}")
        return error(msg="删除失败，请稍后再试")
