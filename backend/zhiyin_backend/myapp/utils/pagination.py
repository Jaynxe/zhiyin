from rest_framework.pagination import PageNumberPagination

from myapp.utils.response import success, error

class CustomPagination(PageNumberPagination):
    page_size_query_param = 'pageSize'
    page_query_param = 'page'
    max_page_size = 100
    page_size = 10  # 默认 pageSize


def paginate_and_respond(queryset, request, serializer_class, context=None, msg="获取成功"):
    try:
        page = request.query_params.get("page")
        page_size = request.query_params.get("pageSize")

        # 如果传了分页参数就分页
        if page or page_size:
            paginator = CustomPagination()
            page_data = paginator.paginate_queryset(queryset, request)
            if page_data is None:
                return error(msg="分页失败")

            serializer = serializer_class(page_data, many=True, context=context or {})
            return success(data={
                "list": serializer.data,
                "total": paginator.page.paginator.count,
                "page": paginator.page.number,
                "pageSize": paginator.get_page_size(request)
            }, msg=msg)
        else:
            # 不分页，直接全部返回
            serializer = serializer_class(queryset, many=True, context=context or {})
            return success(data={
                "list": serializer.data,
                "total": len(serializer.data),
                "page": None,
                "pageSize": None,
            }, msg=msg)

    except Exception as e:
        return error(msg=f"分页异常：{str(e)}")
