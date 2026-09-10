from django.conf import settings
from rest_framework import permissions


class IsBotService(permissions.BasePermission):
    """Faqat Telegram bot mikroservisi (X-Bot-Secret header) kira oladi."""

    def has_permission(self, request, view):
        secret = request.headers.get('X-Bot-Secret')
        return bool(secret) and secret == settings.BOT_API_SECRET
