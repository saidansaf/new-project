from django.contrib import admin

from .models import TelegramLinkToken, TelegramProfile


@admin.register(TelegramProfile)
class TelegramProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'chat_id', 'username', 'linked_at')


@admin.register(TelegramLinkToken)
class TelegramLinkTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'is_used', 'created_at')
