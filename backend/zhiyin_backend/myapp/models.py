from django.db import models, transaction
import uuid


class User(models.Model):
    GENDER_CHOICES = (
        ("M", "男"),
        ("F", "女"),
    )
    STATUS_CHOICES = (
        ("0", "正常"),
        ("1", "封号"),
    )
    ROLE_CHOICES = (
        ("0", "管理员"),
        ("1", "普通用户"),
    )
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="用户唯一标识"
    )
    username = models.CharField(max_length=50, null=True, help_text="用户名")
    password = models.CharField(max_length=50, null=True, help_text="密码")
    role = models.CharField(
        max_length=2,
        choices=ROLE_CHOICES,
        blank=True,
        null=True,
        help_text="用户角色",
        default="1",
    )
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default="0", help_text="用户状态"
    )
    nickname = models.CharField(blank=True, null=True, max_length=20, help_text="昵称")
    avatar = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="用户头像",
        default="avatar/default.png",
    )
    avatarHash = models.CharField(
        max_length=32, blank=True, null=True, help_text="头像哈希值"
    )
    mobile = models.CharField(max_length=13, blank=True, null=True, help_text="手机号")
    email = models.CharField(max_length=50, blank=True, null=True, help_text="邮箱")
    gender = models.CharField(
        max_length=1, choices=GENDER_CHOICES, default="M", blank=True, null=True, help_text="性别"
    )
    description = models.TextField(max_length=200, null=True, help_text="个人描述")
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    update_time = models.DateTimeField(auto_now=True, null=True, help_text="更新时间")
    push_switch = models.BooleanField(
        blank=True, null=True, default=True, help_text="推送开关"
    )

    class Meta:
        db_table = "user"

    def __str__(self):
        return self.username

    def get_liked_playlist(self):
        # 获取用户的“我喜欢的歌曲”歌单
        playlist, created = Playlist.objects.get_or_create(
            creator=self,
            name="我喜欢的歌曲",
            defaults={
                'description': '用户的个人喜欢歌曲歌单',
                'status': '0',
                'visibility': 'private',  # 设为私密歌单，避免其他用户查看
                'cover': 'cover/default.png',
            }
        )
        return playlist


class Language(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="语言ID"
    )
    name = models.CharField(max_length=50, help_text="语言名称，如中文、英文")
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    update_time = models.DateTimeField(auto_now=True, null=True, help_text="更新时间")

    class Meta:
        db_table = "language"


class Classification(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="分类ID"
    )
    name = models.CharField(max_length=100, blank=True, null=True, help_text="分类名称")
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    update_time = models.DateTimeField(auto_now=True, null=True, help_text="更新时间")

    class Meta:
        db_table = "classification"


class Song(models.Model):
    STATUS_CHOICES = (
        ("0", "上架"),
        ("1", "下架"),
    )
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="歌曲ID"
    )
    classification = models.ForeignKey(
        Classification,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="classification_song",
        help_text="所属分类",
    )
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="language_song",
        help_text="所属语言",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="user_song",
        help_text="上传用户",
    )
    title = models.CharField(
        max_length=100, blank=True, null=True, help_text="歌曲标题"
    )
    cover = models.CharField(
        max_length=200, null=True, blank=True, help_text="歌曲封面"
    )
    source = models.CharField(max_length=200,
                              null=True,
                              blank=True, help_text="音频文件")
    lyric = models.CharField(max_length=200,
                             null=True,
                             blank=True, help_text="歌词文件")
    description = models.TextField(
        max_length=1000, blank=True, null=True, help_text="歌曲描述"
    )
    singer = models.CharField(max_length=50, blank=True, null=True, help_text="演唱者")
    album = models.CharField(max_length=50, blank=True, null=True, help_text="所属专辑")
    issuer = models.CharField(max_length=50, blank=True, null=True, help_text="发行方")
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default="0", help_text="状态"
    )
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    plays = models.IntegerField(default=0, help_text="播放次数")
    comment_count = models.IntegerField(default=0, help_text="评论数")

    class Meta:
        db_table = "song"


class Playlist(models.Model):
    VISIBILITY_CHOICES = (
        ("public", "公开"),
        ("private", "私密"),
    )
    STATUS_CHOICES = (
        ("0", "正常"),
        ("1", "禁用"),
    )
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="歌单ID"
    )
    name = models.CharField(max_length=100, help_text="歌单名称")
    description = models.TextField(
        max_length=1000, blank=True, null=True, help_text="歌单描述"
    )
    cover = models.CharField(
        max_length=200, null=True, blank=True, help_text="歌单封面"
    )
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default="0", help_text="状态"
    )
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_playlists",
        help_text="创建者"
    )
    classifications = models.ManyToManyField(
        Classification,
        blank=True,
        related_name="playlists",
        help_text="所属分类（可多选）",
    )
    songs = models.ManyToManyField(
        'Song',
        blank=True,
        related_name="in_playlists",
        help_text="包含的歌曲"
    )
    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default="public",
        help_text="是否公开"
    )
    collect_users = models.ManyToManyField(
        User,
        blank=True,
        related_name="collected_playlists",
        help_text="收藏用户"
    )
    play_count = models.IntegerField(default=0, help_text="播放数")
    create_time = models.DateTimeField(auto_now_add=True, help_text="创建时间")
    update_time = models.DateTimeField(auto_now=True, help_text="更新时间")

    class Meta:
        db_table = "playlist"
        ordering = ["-create_time"]

    def __str__(self):
        return self.name


class Comment(models.Model):
    STATUS_CHOICES = (
        ("0", "正常"),
        ("1", "禁用"),
    )
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="评论ID"
    )
    content = models.TextField(
        max_length=1000, blank=True, null=True, help_text="评论内容"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name="user_comment",
        help_text="评论用户",
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        null=True,
        related_name="song_comment",
        help_text="评论歌曲",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        help_text="父评论",
    )
    comment_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="评论时间"
    )
    update_time = models.DateTimeField(
        auto_now=True, null=True, help_text="更新时间"
    )
    like_count = models.IntegerField(default=0, help_text="点赞数")
    status = models.CharField(
        max_length=1, choices=STATUS_CHOICES, default="0", help_text="评论状态"
    )
    level = models.IntegerField(default=0, help_text="评论层级")

    class Meta:
        db_table = "comment"
        ordering = ["-comment_time"]

    def save(self, *args, **kwargs):
        if self.parent:
            self.level = self.parent.level + 1
        super().save(*args, **kwargs)


class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="点赞用户")
    comment = models.ForeignKey(
        Comment, on_delete=models.CASCADE, help_text="被点赞的评论"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment_like"
        unique_together = ("user", "comment")  # 保证一个用户只能点赞一次


class Record(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="记录ID"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name="user_record",
        help_text="用户",
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        null=True,
        related_name="song_record",
        help_text="歌曲",
    )
    score = models.IntegerField(default=0, help_text="得分")
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )

    class Meta:
        db_table = "record"
        ordering = ["-create_time"]
        verbose_name = "用户-歌曲评分"
        verbose_name_plural = "用户-歌曲评分"


class LoginLog(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="日志ID"
    )
    username = models.CharField(
        max_length=50, blank=True, null=True, help_text="登录用户名"
    )
    ip = models.CharField(max_length=100, blank=True, null=True, help_text="登录IP地址")
    location = models.CharField(
        max_length=100, blank=True, null=True, help_text="登录地点"
    )
    ua = models.CharField(max_length=200, blank=True, null=True, help_text="用户代理")
    log_time = models.DateTimeField(auto_now_add=True, null=True, help_text="登录时间")

    class Meta:
        db_table = "login_log"
        ordering = ["-log_time"]
        verbose_name = "登录日志"
        verbose_name_plural = "登录日志"


class Order(models.Model):
    id = models.BigAutoField(primary_key=True)
    order_number = models.CharField(max_length=13, blank=True, null=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, related_name="user_order"
    )
    song = models.ForeignKey(
        Song, on_delete=models.CASCADE, null=True, related_name="song_order"
    )
    count = models.IntegerField(default=0)
    status = models.CharField(max_length=2, blank=True, null=True)  # 1正常 2取消
    order_time = models.DateTimeField(auto_now_add=True, null=True)
    receiver_name = models.CharField(max_length=20, blank=True, null=True)
    receiver_address = models.CharField(max_length=50, blank=True, null=True)
    receiver_phone = models.CharField(max_length=20, blank=True, null=True)
    remark = models.CharField(max_length=30, blank=True, null=True)

    class Meta:
        db_table = "order"


class Advertise(models.Model):
    STATUS_CHOICES = (
        ("0", "已发布"),
        ("1", "已下线"),
    )

    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="广告"
    )
    title = models.CharField(
        max_length=100, blank=True, null=True, help_text="广告标题"
    )
    cover = models.CharField(
        max_length=200, null=True, blank=True, help_text="广告图片"
    )
    link = models.CharField(max_length=500, blank=True, null=True, help_text="广告链接")
    status = models.CharField(
        max_length=2, choices=STATUS_CHOICES, default="0", help_text="广告状态"
    )

    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    update_time = models.DateTimeField(auto_now=True, null=True, help_text="更新时间")

    class Meta:
        db_table = "advertise"
        ordering = ["-create_time"]
        verbose_name = "广告管理"
        verbose_name_plural = "广告管理"


class SystemNotice(models.Model):
    STATUS_CHOICES = (
        ("0", "发布"),
        ("1", "下线"),
    )

    TYPE_CHOICES = (
        ("announcement", "公告"),
        ("notification", "普通通知"),
    )

    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="通知ID"
    )
    title = models.CharField(max_length=100, help_text="通知标题")
    content = models.TextField(help_text="通知内容")
    status = models.CharField(
        max_length=2, choices=STATUS_CHOICES, default="0", help_text="通知状态"
    )
    type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default="notification",
        help_text="通知类型",
    )
    is_global = models.BooleanField(default=False, help_text="是否面向所有用户")
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )

    class Meta:
        db_table = "system_notice"
        ordering = ["-create_time"]
        verbose_name = "系统通知"
        verbose_name_plural = "系统通知"

    def send_to_users(self, user_ids: list = None):
        """
        向指定用户或所有用户发送通知。
        如果 is_global=True，将忽略 user_ids，自动向所有用户发送。
        """
        if self.is_global:
            valid_users = User.objects.values_list("id", flat=True)
        else:
            if not user_ids:
                return
            valid_users = User.objects.filter(id__in=user_ids).values_list(
                "id", flat=True
            )

        user_notice_list = [
            UserNotice(notice=self, user_id=user_id) for user_id in valid_users
        ]

        with transaction.atomic():
            UserNotice.objects.bulk_create(user_notice_list, ignore_conflicts=True)


class UserNotice(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="用户日志ID"
    )
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    notice = models.ForeignKey("SystemNotice", on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False, help_text="是否已读")
    receive_time = models.DateTimeField(auto_now_add=True)
    read_time = models.DateTimeField(null=True, blank=True, help_text="阅读时间")

    class Meta:
        db_table = "user_notice"
        verbose_name = "用户通知"
        verbose_name_plural = "用户通知"
        unique_together = ("notice", "user")  # 防止重复发送


class Feedback(models.Model):
    STATUS_CHOICES = (
        ("0", "待处理"),
        ("1", "已处理"),
    )
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="反馈ID"
    )
    title = models.CharField(
        max_length=100, blank=True, null=True, help_text="反馈标题"
    )
    content = models.TextField(
        max_length=1000, blank=True, null=True, help_text="反馈内容"
    )

    feedback_screenshot = models.CharField(
        max_length=200, null=True, blank=True, help_text="反馈截图"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name="user_feedback",
        help_text="反馈用户",
    )
    email = models.EmailField(
        max_length=100, blank=True, null=True, help_text="联系邮箱"
    )
    status = models.CharField(
        max_length=2,
        choices=STATUS_CHOICES,
        blank=True,
        null=True,
        default="0",
        help_text="反馈状态",
    )
    reply = models.TextField(
        max_length=1000, blank=True, null=True, help_text="管理员回复"
    )
    create_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="创建时间"
    )
    update_time = models.DateTimeField(auto_now=True, null=True, help_text="处理时间")

    class Meta:
        db_table = "feedback"
        ordering = ["-create_time"]
        verbose_name = "用户反馈"
        verbose_name_plural = "用户反馈"


class BrowseHistory(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, help_text="浏览记录ID"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        related_name="browse_history",
        help_text="用户",
    )
    song = models.ForeignKey(
        Song,
        on_delete=models.CASCADE,
        null=True,
        related_name="browse_history",
        help_text="歌曲",
    )
    browse_time = models.DateTimeField(
        auto_now_add=True, null=True, help_text="浏览时间"
    )

    class Meta:
        db_table = "browse_history"
        ordering = ["-browse_time"]
        verbose_name = "浏览记录"
        verbose_name_plural = "浏览记录"
