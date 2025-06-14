# Generated by Django 5.2.1 on 2025-06-04 10:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0011_alter_advertise_cover'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemnotice',
            name='is_global',
            field=models.BooleanField(default=False, help_text='是否面向所有用户'),
        ),
        migrations.AddField(
            model_name='systemnotice',
            name='type',
            field=models.CharField(choices=[('announcement', '公告'), ('notification', '普通通知')], default='notification', help_text='通知类型', max_length=20),
        ),
        migrations.AddField(
            model_name='usernotice',
            name='read_time',
            field=models.DateTimeField(blank=True, help_text='阅读时间', null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='push_switch',
            field=models.BooleanField(blank=True, default=True, help_text='推送开关', null=True),
        ),
    ]
