# Generated by Django 5.2.1 on 2025-06-06 17:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0019_remove_song_classification_song_classifications'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='song',
            name='classifications',
        ),
        migrations.AddField(
            model_name='song',
            name='classification',
            field=models.ForeignKey(blank=True, help_text='所属分类', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='classification_song', to='myapp.classification'),
        ),
    ]
