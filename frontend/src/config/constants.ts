// 文件上传配置
export const UPLOAD_CONFIG = {
  // 图片文件大小限制（单位：MB）
  IMAGE_MAX_FILE_SIZE: 2,
  // 音频文件大小限制（单位：MB）
  AUDIO_MAX_FILE_SIZE: 30,
  // 视频文件大小限制（单位：MB）
  VIDEO_MAX_FILE_SIZE: 100,
  // 允许的图片文件类型
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  // 允许的音频文件类型
  ALLOWED_AUDIO_TYPES: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp3",
    "audio/flac",
  ],
  // 允许的视频文件类型
  ALLOWED_VIDEO_TYPES: [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-msvideo",
  ],
  // 图片文件大小限制提示
  IMAGE_SIZE_ERROR_MSG: "图片大小不能超过 2MB",
  // 音频文件大小限制提示
  AUDIO_SIZE_ERROR_MSG: "音频大小不能超过 30MB",
  // 视频文件大小限制提示
  VIDEO_SIZE_ERROR_MSG: "视频大小不能超过 100MB",
  // 图片文件类型限制提示
  IMAGE_TYPE_ERROR_MSG: "只能上传图片文件",
  // 音频文件类型限制提示
  AUDIO_TYPE_ERROR_MSG: "只能上传音频文件",
  // 视频文件类型限制提示
  VIDEO_TYPE_ERROR_MSG: "只能上传视频文件",
} as const;
