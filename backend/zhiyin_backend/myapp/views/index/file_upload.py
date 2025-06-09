from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.conf import settings
import os

from myapp.utils.response import error, success

MAX_COVER_SIZE = settings.MAX_COVER_SIZE  # 10MB
MAX_AUDIO_SIZE = settings.MAX_AUDIO_SIZE  # 50MB
MAX_VIDEO_SIZE = settings.MAX_VIDEO_SIZE  # 100MB


class FileUploadView(APIView):
    def post(self, request):
        file = request.FILES.get("file")
        file_type = request.query_params.get("type")  # 例如 ?type=avatar

        allowed_types = ["advertise", "avatar", "cover", "feedback","lyric", "source", "video"]

        if not file or not file_type:
            return error(msg="缺少文件或类型参数")

        if file_type not in allowed_types:
            return error(msg="不支持的文件类型")

        # 大小限制：图片、音频和视频类型
        if file_type in ["advertise", "avatar", "cover", "feedback"]:
            if file.size > MAX_COVER_SIZE:
                return error(
                    msg=f"图片文件不能超过 {MAX_COVER_SIZE // (1024 * 1024)}MB"
                )
        elif file_type == "source":
            if file.size > MAX_AUDIO_SIZE:
                return error(
                    msg=f"音频文件不能超过 {MAX_AUDIO_SIZE // (1024 * 1024)}MB"
                )
        elif file_type == "video":
            if file.size > MAX_VIDEO_SIZE:
                return error(
                    msg=f"视频文件不能超过 {MAX_VIDEO_SIZE // (1024 * 1024)}MB"
                )

        # 保存文件
        path = default_storage.save(os.path.join(file_type, file.name), file)

        return success(
            {"message": "上传成功", "path": path}  # 只返回相对路径，例如 avatar/xxx.jpg
        )
