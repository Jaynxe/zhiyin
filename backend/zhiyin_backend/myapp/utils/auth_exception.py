from rest_framework.views import exception_handler
from rest_framework.exceptions import (
    AuthenticationFailed, NotAuthenticated,
    PermissionDenied, APIException
)

from rest_framework import status
from datetime import datetime
import traceback

from myapp.logging.logger import logger
from myapp.utils.response import error


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")

    # 用户未认证或认证失败
    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return error(msg=str(exc), http_status=status.HTTP_401_UNAUTHORIZED)

    # 权限不足
    if isinstance(exc, PermissionDenied):
        return error(msg=str(exc) or "权限不足", http_status=status.HTTP_403_FORBIDDEN)

    # DRF 处理过的 API 异常
    if isinstance(exc, APIException):
        http_status_code = response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR
        return error(msg=str(exc.detail), http_status=http_status_code)

    # Django 原生异常（比如 404 等）
    if response is not None:
        return error(msg=response.status_text or "请求错误", http_status=response.status_code)

    # 未知异常（500），记录日志
    logger.error(
        f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] "
        f"[{request.method}] "
        f"[{type(exc).__name__}] {str(exc)}\n{traceback.format_exc()}"
    )

    return error(msg="服务器内部错误", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)
