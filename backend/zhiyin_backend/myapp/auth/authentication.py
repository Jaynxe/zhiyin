# token验证

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from myapp.models import User
from myapp.utils.common import get_redis_token_key
from myapp.utils.jwt_token import decode_jwt
from myapp.logging.logger import logger
from myapp.utils.redis import get_redis_client

r = get_redis_client()


class BaseTokenAuthentication(BaseAuthentication):
    """
    基础Token认证类（支持Redis校验Token是否有效）
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise AuthenticationFailed("未提供有效的身份凭证")

        token = auth_header.split(" ")[1]

        try:
            payload = decode_jwt(token)
            if not payload:
                raise AuthenticationFailed("Token 无效或已过期")

            user_id = payload.get("user_id")
            if not user_id:
                raise AuthenticationFailed("Token 中缺少用户信息")

            user = User.objects.filter(id=user_id).first()
            if not user:
                raise AuthenticationFailed("用户不存在")

            # Redis Token 校验
            redis_key = get_redis_token_key(token)
            if not r.exists(redis_key):
                raise AuthenticationFailed("Token 已失效，请重新登录")

            return user, token

        except AuthenticationFailed:
            raise  # 保留原始认证异常信息
        except Exception as e:
            logger.exception("认证失败：%s", str(e))
            raise AuthenticationFailed("身份认证异常，请稍后再试")


class AdminAuthentication(BaseTokenAuthentication):
    """
    管理员认证类（role=0 表示管理员）
    """

    def authenticate(self, request):
        user, token = super().authenticate(request)

        if str(user.role) != "0":
            raise PermissionDenied("权限不足，需要管理员权限")

        return user, token


class UserAuthentication(BaseTokenAuthentication):
    """
    普通用户认证类
    验证用户是否已登录
    """

    pass
