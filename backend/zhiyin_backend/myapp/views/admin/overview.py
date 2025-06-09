# 系统信息，仪表盘展示数据
from django.db import connection
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.request import Request

from myapp.auth.authentication import AdminAuthentication
from myapp.logging.logger import logger
from myapp.utils.common import dict_fetchall, get_week_days
from myapp.utils.response import success, error
import platform
import psutil
import locale
import time
from multiprocessing import cpu_count


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def sys_info(request: Request):
    try:
        memory = psutil.virtual_memory()
        cpu_usage = psutil.cpu_percent(interval=1)

        data = {
            "sysName": "Music Admin",
            "versionName": "1.1.0",
            "osName": platform.system(),
            "osBuild": platform.architecture()[0],
            "platform": platform.platform(),
            "processor": platform.processor(),
            "cpuCount": cpu_count(),
            "cpuLoad": round(cpu_usage, 2),
            "pyVersion": platform.python_version(),
            "memoryTotalGB": round(memory.total / 1024 ** 3, 2),
            "memoryUsedGB": round(memory.used / 1024 ** 3, 2),
            "memoryPercent": round(memory.percent, 2),
            "locale": locale.getdefaultlocale()[0],
            "timezone": time.strftime("%Z", time.localtime()),
        }

        return success(msg="查询成功", data=data)
    except Exception as e:
        logger.error(f"系统信息获取失败：{str(e)}")
        return error(msg="获取系统信息失败，请稍后再试")


@api_view(["GET"])
@authentication_classes([AdminAuthentication])
def get_dashboard_info(request):
    week_days = get_week_days()

    user_growth = []
    song_growth = []
    try:
        with connection.cursor() as cursor:
            # 音乐总数
            cursor.execute("SELECT COUNT(*) FROM song")
            song_count = cursor.fetchone()[0]

            # 用户总数
            cursor.execute("SELECT COUNT(*) FROM user")
            user_count = cursor.fetchone()[0]

            # 总播放次数
            cursor.execute("SELECT SUM(plays) FROM song")
            total_plays = cursor.fetchone()[0] or 0

            # 总评论数
            cursor.execute("SELECT COUNT(*) FROM comment")
            comment_count = cursor.fetchone()[0]

            for date in week_days:
                # 每日新增用户和歌曲数量
                cursor.execute("SELECT COUNT(*) FROM user WHERE DATE(create_time) = %s", [date])
                user_growth.append({"date": date, "count": cursor.fetchone()[0]})

                cursor.execute("SELECT COUNT(*) FROM song WHERE DATE(create_time) = %s", [date])
                song_growth.append({"date": date, "count": cursor.fetchone()[0]})
            # 热门歌曲排名（前10）
            cursor.execute("""
                SELECT title, plays AS count 
                FROM song 
                ORDER BY plays DESC 
                LIMIT 10
            """)
            order_rank_data = dict_fetchall(cursor)

            # 分类数量统计
            cursor.execute("""
                SELECT B.name, COUNT(*) AS count 
                FROM song A 
                JOIN classification B ON A.classification_id = B.id 
                GROUP BY B.name 
                ORDER BY count DESC
            """)
            classification_rank_data = dict_fetchall(cursor)

        return success(
            msg="查询成功",
            data={
                "song_count": song_count,
                "user_count": user_count,
                "total_plays": total_plays,
                "comment_count": comment_count,
                "user_growth": user_growth,
                "song_growth": song_growth,
                "order_rank_data": order_rank_data,
                "classification_rank_data": classification_rank_data,
            },
        )

    except Exception as e:
        logger.error(f"后台统计失败：{str(e)}")
        return error(msg="统计失败，请稍后再试")
