import redis
from django.conf import settings
from redis.exceptions import ConnectionError, TimeoutError

class RedisClient:
    _instance = None  # 单例实例
    _pool = None      # 连接池

    def __new__(cls):
        if cls._instance is None:
            try:
                # 初始化连接池（只创建一次）
                cls._pool = redis.ConnectionPool(
                    host=getattr(settings, 'REDIS_HOST', 'localhost'),
                    port=getattr(settings, 'REDIS_PORT', 6379),
                    password=getattr(settings, 'REDIS_PASSWORD', None),
                    db=getattr(settings, 'REDIS_DB', 0),
                    decode_responses=True,
                    max_connections=10  # 可自定义最大连接数
                )

                # 使用连接池创建 Redis 实例
                cls._instance = redis.Redis(connection_pool=cls._pool)

                # 测试连接
                cls._instance.ping()

            except (ConnectionError, TimeoutError) as e:
                print(f"❌ Redis 连接失败：{str(e)}")
                cls._instance = None

            except Exception as e:
                print(f"❌ Redis 初始化异常：{str(e)}")
                cls._instance = None

        return cls._instance

# ✅ 外部使用方式：
def get_redis_client():
    return RedisClient()

