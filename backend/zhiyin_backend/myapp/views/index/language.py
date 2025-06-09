from rest_framework.decorators import api_view
from rest_framework.request import Request

from myapp.logging.logger import logger
from myapp.models import Language
from myapp.serializers import LanguageSerializer
from myapp.utils.response import success, error


@api_view(['GET'])
def get_language_list(request: Request):
    try:
        classification_list = Language.objects.all().order_by("-id")
        serializer = LanguageSerializer(classification_list, many=True)
        return success(msg='查询成功', data=serializer.data)
    except Exception as e:
        logger.error(f"获取语言列表失败: {str(e)}")
        return error(msg='获取语言失败，请稍后再试')
