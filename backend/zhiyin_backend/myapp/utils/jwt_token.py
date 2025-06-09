# 生成和解析token

import jwt
from django.conf import settings
from datetime import datetime, timedelta

from myapp.utils.common import get_redis_token_key

from myapp.utils.redis import get_redis_client

r = get_redis_client()


def generate_jwt(payload: dict, exp_seconds: int = None) -> str:
    """
    生成 JWT 并保存到 Redis
    """
    if exp_seconds is None:
        exp_seconds = getattr(settings, "JWT_EXP_DELTA_SECONDS", 3600)  # 默认1小时

    payload = payload.copy()
    payload["exp"] = datetime.utcnow() + timedelta(seconds=exp_seconds)
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    # 保存 token 到 Redis，设置过期时间
    redis_key = get_redis_token_key(token)
    r.set(redis_key, payload.get("user_id", ""), ex=exp_seconds)

    return token


def decode_jwt(token: str) -> dict | None:
    """
    解析 JWT 并校验 Redis 是否有效
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

    return payload


def invalidate_token(token: str) -> bool:
    """
    手动使 token 失效（删除 Redis 记录）
    返回是否成功删除
    """
    redis_key = get_redis_token_key(token)
    return r.delete(redis_key) > 0
