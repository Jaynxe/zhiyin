# Generated by Django 5.2.1 on 2025-06-06 14:53

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0016_rename_lyrics_song_lyric'),
    ]

    operations = [
        migrations.CreateModel(
            name='Playlist',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='歌单ID', primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='歌单名称', max_length=100)),
                ('description', models.TextField(blank=True, help_text='歌单描述', max_length=1000, null=True)),
                ('cover', models.CharField(blank=True, help_text='歌单封面', max_length=200, null=True)),
                ('visibility', models.CharField(choices=[('public', '公开'), ('private', '私密')], default='public', help_text='是否公开', max_length=10)),
                ('create_time', models.DateTimeField(auto_now_add=True, help_text='创建时间')),
                ('update_time', models.DateTimeField(auto_now=True, help_text='更新时间')),
                ('collect_count', models.IntegerField(default=0, help_text='收藏数')),
                ('play_count', models.IntegerField(default=0, help_text='播放数')),
                ('collect_users', models.ManyToManyField(blank=True, help_text='收藏该歌单的用户', related_name='collected_playlists', to='myapp.user')),
                ('creator', models.ForeignKey(help_text='创建者', on_delete=django.db.models.deletion.CASCADE, related_name='created_playlists', to='myapp.user')),
                ('songs', models.ManyToManyField(blank=True, help_text='包含的歌曲', related_name='in_playlists', to='myapp.song')),
            ],
            options={
                'db_table': 'playlist',
                'ordering': ['-create_time'],
            },
        ),
    ]
