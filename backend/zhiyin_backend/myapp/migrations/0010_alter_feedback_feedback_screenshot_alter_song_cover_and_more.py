# Generated by Django 5.2.1 on 2025-06-02 19:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0009_alter_advertise_cover'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feedback',
            name='feedback_screenshot',
            field=models.CharField(blank=True, help_text='反馈截图', max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='song',
            name='cover',
            field=models.CharField(blank=True, help_text='歌曲封面', max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='avatar',
            field=models.CharField(blank=True, default='avatar/default.png', help_text='用户头像', max_length=200, null=True),
        ),
    ]
