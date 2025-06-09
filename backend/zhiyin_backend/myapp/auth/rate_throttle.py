from rest_framework.throttling import AnonRateThrottle, UserRateThrottle as DRFUserRateThrottle


class MyRateThrottle(AnonRateThrottle):
    # 限流 每分钟2次
    THROTTLE_RATES = {"anon": "2/min"}


class UserRateThrottle(DRFUserRateThrottle):
    # 限流 每分钟5次
    """ 
    重写了 get_cache_key 方法，不再依赖 is_authenticated 属性，
    而是直接检查 request.user 是否存在。如果存在，就使用用户 ID 作为限流的标识；
    如果不存在，就使用 IP 地址作为标识。
    """
    THROTTLE_RATES = {"user": "5/min"}
    
    def get_cache_key(self, request, view):
        if request.user:
            ident = str(request.user.id)
        else:
            ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident
        }