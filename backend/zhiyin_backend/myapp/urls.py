from django.urls import path
from myapp.views import admin
from myapp.views import index
from myapp.views.index import FileUploadView

app_name = "myapp"
urlpatterns = [
    # ================ 后台api================
    # 用户部分
    path('admin/user/create/', admin.create_user, name='create_user'),
    path('admin/user/getUserList/', admin.get_user_list, name='get_user_list'),
    path('admin/user/getUserInfo/<str:pk>/', admin.get_user_info, name='get_user_info'),
    path('admin/user/delete/', admin.delete_user, name='delete_user'),
    path('admin/user/<str:pk>/update/', admin.update_user_info, name='update_user'),
    path('admin/user/<str:pk>/updatePassword/', admin.update_password, name='update_password'),

    # 音乐部分
    path('admin/song/getSongList/', admin.get_song_list, name='get_music_list'),
    path('admin/song/create/', admin.create_song, name='create_music'),
    path('admin/song/<str:pk>/update/', admin.update_song, name='update_song'),
    path('admin/song/delete/', admin.delete_songs, name='delete_songs'),

    # 评论部分
    path('admin/comment/getCommentList/', admin.get_comments_list, name='get_comment_list'),
    path('admin/comment/<str:pk>/update/', admin.update_comment, name='update_comment'),
    # 反馈部分
    path('admin/feedback/getFeedbackList/', admin.get_feedback_list, name='get_feedback_list'),
    path('admin/feedback/<str:pk>/update/', admin.update_feedback, name='update_feedback'),
    path('admin/feedback/delete/', admin.delete_feedback, name='delete_feedback'),

    # 广告
    path('admin/advertise/create/', admin.create_advertise, name='create_advertise'),
    path('admin/advertise/getAdvertiseList/', admin.get_advertise_list, name='get_advertise_list'),
    path('admin/advertise/<str:pk>/update/', admin.update_advertise, name='update_advertise'),
    path('admin/advertise/delete/', admin.delete_advertise, name='delete_advertise'),

    # 登录日志
    path('admin/loginLog/getLoginLogList/', admin.get_login_log_list, name='get_login_log_list'),
    path('admin/loginLog/delete/', admin.delete_login_logs, name='update_login_log'),
    path('admin/loginLog/clear/', admin.clear_login_logs, name='clear_login_logs'),

    # 音乐分类
    path('admin/category/create/', admin.create_classification, name='create_classification'),
    path('admin/category/getCategoryList/', admin.get_classification_list, name='get_classification_list'),
    path('admin/category/<str:pk>/update/', admin.update_classification, name='update_classification'),
    path('admin/category/delete/', admin.delete_classification, name='delete_classification'),

    # 歌单
    path('admin/playlist/create/', admin.playlist_create, name='create_playlist'),
    path('admin/playlist/getPlaylistList/', admin.playlist_list, name='get_playlist_list'),
    path('admin/playlist/<str:pk>/update/', admin.playlist_update, name='update_playlist'),
    path('admin/playlist/delete/', admin.playlist_delete, name='delete_playlist'),

    # 语言
    path('admin/language/create/', admin.create_language, name='create_language'),
    path('admin/language/getLanguageList/', admin.get_language_list, name='get_language_list'),
    path('admin/language/<str:pk>/update/', admin.update_language, name='update_language'),
    path('admin/language/delete/', admin.delete_language, name='delete_language'),

    # 系统信息部分
    path('admin/overview/sysInfo/', admin.sys_info, name='get_sys_info'),
    path('admin/overview/getDashboardInfo/', admin.get_dashboard_info, name='get_dashboard_info'),

    # 通知部分
    path('admin/notice/createForAll/', admin.create_notice_all, name='create_notice_all'),
    path('admin/notice/createForSome/', admin.create_notice_some, name='create_notice_some'),
    path('admin/notice/delete/', admin.delete_notices, name='delete_notices'),
    path('admin/notice/<str:pk>/update/', admin.update_notice, name='update_notice'),
    path('admin/notice/get/', admin.list_all_notices, name='list_all_notices'),

    # ================ 前台api================
    # 用户部分
    path('user/register/', index.user_register, name='register'),
    path('user/login/', index.user_login, name='login'),
    path('user/getUserInfo/', index.get_user_info, name='get_user_info'),
    path('user/updateUserInfo/', index.update_user_info, name='update_user_info'),
    path('user/logout/', index.user_logout),
    path('user/updatePassword/', index.update_password, name='update_password'),
    path('user/sendEmailCode/', index.send_email_code, name='send_email_code'),
    path('user/bindEmail/', index.bind_email, name='bind_email'),
    path('user/sendResetCode/', index.send_reset_code, name='send_reset_code'),
    path('user/resetPassword/', index.reset_password, name='reset_password'),

    # 音乐部分
    path('song/getSongList/', index.get_song_list, name='get_song_list'),
    path('song/addPlays/', index.add_plays, name='add_plays'),
    path('song/getRecommendSong/', index.get_recommend_song, name='get_recommend_song'),
    path('song/<str:pk>/getSongInfo/', index.get_song_info, name='get_music_info'),

    # 歌单部分
    path('playlist/create/', index.create_playlist, name='create_playlist'),
    path('playlist/<str:pk>/update/', index.update_playlist, name='update_playlist'),
    path('playlist/delete/', index.delete_playlist, name='delete_playlist'),
    path('playlist/<str:pk>/details/', index.playlist_detail, name='get_playlist_details'),
    path('playlist/getPlaylistList/', index.playlist_list, name='get_playlist_list'),
    path('playlist/getMyPlaylists/', index.my_playlists, name='get_my_playlist_list'),
    path('playlist/getMyCollectedPlaylists/', index.my_collected_playlists, name='my_collected_playlists'),
    path('playlist/<str:pk>/collect/', index.playlist_collect_toggle, name='playlist_collect_toggle'),
    path('playlist/addSong/', index.add_song_to_playlist, name='add_song_to_playlist'),
    path('playlist/removeSong/', index.remove_song_from_playlist, name='remove_song_from_playlist'),
    path('playlist/getLikedPlaylist/', index.get_liked_playlist, name='get_liked_playlist'),
    path('playlist/addSongToLikedPlaylist/', index.add_song_to_liked_playlist, name='add_song_to_liked_playlist'),
    path('playlist/removeSongFromLikedPlaylist/', index.remove_song_from_liked_playlist, name='remove_song_from_liked_playlist'),

    # 评论部分
    path('comment/create/', index.create_comment, name='create_comment'),
    path('comment/reply/', index.reply_comment, name='reply_comment'),
    path('comment/delete/', index.batch_delete_comments, name='delete_comments'),
    path('comment/getCommentList/', index.get_user_comments, name='get_comment_list'),
    path('comment/getCommentsBySong/', index.get_comments_by_song, name='get_comments_by_song'),
    path('comment/toggleLikeComment/', index.toggle_comment_like, name='toggle_like_comment'),

    # 反馈部分
    path('feedback/create/', index.create_feedback, name='create_feedback'),
    path('feedback/getFeedbackList/', index.get_feedback_list, name='get_feedback_list'),
    path('feedback/<str:pk>/delete/', index.delete_feedback, name='delete_feedback'),
    path('feedback/<str:pk>/update/', index.update_feedback, name='update_feedback'),

    # 分类部分
    path('category/getCategoryList/', index.get_classification_list, name='get_classification_list'),

    # 语言部分
    path('language/getLanguageList/', index.get_language_list, name='get_language_list'),

    # 通知部分
    path('notice/getUserNoticeList/', index.get_user_notice_list, name='get_user_notice_list'),
    path('notice/getAnnouncementList/', index.get_announcement_list, name='get_announcement_list'),
    path('notice/<str:pk>/markRead/', index.mark_notice_read, name='mark_notice_read'),

    # 浏览记录部分
    path('browseHistory/create/', index.create_browse_history, name='create_browse_history'),
    path('browseHistory/getBrowseHistoryList/', index.get_browse_history_list, name='get_browse_history_list'),
    path('browseHistory/delete/', index.delete_browse_history, name='delete_browse_history'),

    path('upload/', FileUploadView.as_view(), name='file-upload'),
]
