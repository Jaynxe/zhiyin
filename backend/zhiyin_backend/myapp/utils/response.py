# 封装的自定义响应结构
from rest_framework.response import Response
from rest_framework import status


def success(data=None, msg="操作成功", code=0, http_status=status.HTTP_200_OK):
    return Response({"code": code, "msg": msg, "data": data}, status=http_status)


def error(msg="操作失败", code=1, data=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({"code": code, "msg": msg, "data": data}, status=http_status)
