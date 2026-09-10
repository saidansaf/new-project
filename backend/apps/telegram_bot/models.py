import uuid

from django.conf import settings
from django.db import models


class TelegramLinkToken(models.Model):
    """Foydalanuvchi saytda tugma bosganda yaratiladigan bir martalik token.
    Bot /start orqali shu tokenni oladi va akkauntni bog'laydi."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='telegram_link_tokens'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} — {self.token}'


class TelegramProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='telegram_profile'
    )
    chat_id = models.BigIntegerField(unique=True)
    username = models.CharField(max_length=150, blank=True)
    linked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user} ↔ chat:{self.chat_id}'
