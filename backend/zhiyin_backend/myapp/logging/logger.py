# core/logger.py
import logging
from typing import Optional, Any


class AppLogger:
    """
    增强型日志记录器，支持结构化日志和智能异常处理
    用法：
    from core.logger import logger
    logger.info("Processing request", extra={"user": user.id})
    logger.error("Failed to process", exc_info=True)
    """

    def __init__(self, name: str = "myapp"):
        self._logger = logging.getLogger(name)

    def _log(self, level: int, msg: str, **kwargs):
        # 自动添加调用上下文信息
        extra = kwargs.pop('extra', {})
        if 'extra' not in kwargs:
            kwargs['extra'] = extra

        self._logger.log(level, msg, **kwargs)

    def debug(self, msg: str, **kwargs):
        self._log(logging.DEBUG, msg, **kwargs)

    def info(self, msg: str, **kwargs):
        self._log(logging.INFO, msg, **kwargs)

    def warning(self, msg: str, **kwargs):
        self._log(logging.WARNING, msg, **kwargs)

    def error(self, msg: str, exc_info: Optional[Any] = True, **kwargs):
        """
        增强的error记录，自动捕获异常堆栈
        :param exc_info: True|False|异常对象
        """
        self._log(logging.ERROR, msg, exc_info=exc_info, **kwargs)

    def critical(self, msg: str, exc_info: Optional[Any] = True, **kwargs):
        self._log(logging.CRITICAL, msg, exc_info=exc_info, **kwargs)

    def exception(self, msg: str, **kwargs):
        """专门记录异常的方法"""
        self.error(msg, exc_info=True, **kwargs)


# 默认应用日志记录器
logger = AppLogger()


# 模块专用日志记录器工厂函数
def get_module_logger(module_name: str) -> AppLogger:
    """
    获取模块专用日志记录器
    示例：
    logger = get_module_logger(__name__)
    """
    return AppLogger(f"myapp.{module_name}")


# 快捷方法 (保持与原有代码兼容)
def log_debug(msg: str, *args, **kwargs):
    logger.debug(msg, *args, **kwargs)


def log_info(msg: str, *args, **kwargs):
    logger.info(msg, *args, **kwargs)


def log_warning(msg: str, *args, **kwargs):
    logger.warning(msg, *args, **kwargs)


def log_error(msg: str, *args, **kwargs):
    logger.error(msg, *args, **kwargs)


def log_critical(msg: str, *args, **kwargs):
    logger.critical(msg, *args, **kwargs)