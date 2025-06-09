from rest_framework import serializers
from .models import (
    User,
    LoginLog,
    Feedback,
    Advertise,
    Classification,
    SystemNotice,
    UserNotice,
    Song,
    Language,
    Comment,
    BrowseHistory, Playlist,
)
from django.conf import settings


# 用户部分序列化器
class CreateUserSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = User
        fields = "__all__"
        extra_kwargs = {
            "password": {"write_only": True},
            "status": {"read_only": True},
            "create_time": {"read_only": True},
        }


class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "avatar", "role", "email"]


# 普通用户api使用
class UserInfoSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "nickname",
            "avatar",
            "avatarHash",
            "email",
            "mobile",
            "gender",
            "description",
            "mobile",
            "push_switch",
            "role",
            "status",
            "create_time",
            "update_time",
        ]
        extra_kwargs = {
            "avatarHash": {"write_only": True},
            "id": {"read_only": True},
            "role": {"read_only": True},
            "status": {"read_only": True},
        }


# 管理员api使用
class AdminUserInfoSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "nickname",
            "email",
            "mobile",
            "gender",
            "description",
            "avatar",
            "avatarHash",
            "status",
            "role",
            "push_switch",
            "create_time",
            "update_time",
        ]
        extra_kwargs = {
            "avatarHash": {"write_only": True},
            "id": {"read_only": True},
        }


class SongSerializer(serializers.ModelSerializer):
    # 额外字段
    classification_name = serializers.ReadOnlyField(source="classification.name")
    language_name = serializers.ReadOnlyField(source="language.name")
    username = serializers.ReadOnlyField(source="user.username")
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Song
        fields = "__all__"


class PlaylistSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)
    songs = SongSerializer(many=True, read_only=True)  # 使用 SongSerializer 显示歌曲详情
    song_count = serializers.IntegerField(source="songs.count", read_only=True)
    collect_users = serializers.PrimaryKeyRelatedField(
        many=True, read_only=True
    )
    classifications = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Classification.objects.all(), required=False
    )
    collect_count = serializers.IntegerField(source="collect_users.count", read_only=True)

    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Playlist
        fields = [
            "id", "name", "description", "cover", "creator",
            "songs", "visibility", "create_time", "update_time",
            "collect_users", "collect_count", "play_count", "status", "song_count", "classifications",
        ]
        read_only_fields = ["id", "creator", "create_time", "update_time", "collect_count", "play_count"]


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    song_name = serializers.ReadOnlyField(source="song.title")
    comment_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Comment
        fields = "__all__"
        extra_kwargs = {
            "user": {"write_only": True},
            "song": {"write_only": True},
            "parent": {"write_only": True},
        }


class FeedbackSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Feedback
        fields = [
            "id",
            "create_time",
            "update_time",
            "email",
            "title",
            "content",
            "feedback_screenshot",
            "status",
            "reply",
            "user",
            "username",
        ]

    def __init__(self, *args, **kwargs):
        exclude_fields = kwargs.pop("exclude_fields", [])
        super().__init__(*args, **kwargs)

        for field_name in exclude_fields:
            self.fields.pop(field_name, None)


class AdSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Advertise
        fields = "__all__"


# 日志部分序列化器
class LoginLogSerializer(serializers.ModelSerializer):
    log_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", required=False)

    class Meta:
        model = LoginLog
        fields = "__all__"


# 音乐分类部分序列化器
class ClassificationSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Classification
        fields = "__all__"


# 语言部分序列化器
class LanguageSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    update_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = Language
        fields = "__all__"


# 通知部分序列化器
class SystemNoticeSerializer(serializers.ModelSerializer):
    create_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = SystemNotice
        fields = "__all__"


class UserNoticeSerializer(serializers.ModelSerializer):
    notice_title = serializers.CharField(source="notice.title", read_only=True)
    notice_content = serializers.CharField(source="notice.content", read_only=True)
    notice_create_time = serializers.DateTimeField(
        source="notice.create_time", read_only=True
    )

    class Meta:
        model = UserNotice
        fields = [
            "id",
            "notice",
            "notice_title",
            "notice_content",
            "is_read",
            "read_time",
            "receive_time",
            "notice_create_time",
        ]


# 浏览记录
class BrowseHistorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    song_title = serializers.CharField(source="song.title", read_only=True)
    browse_time = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)

    class Meta:
        model = BrowseHistory
        fields = ["id", "username", "song_title", "browse_time"]
