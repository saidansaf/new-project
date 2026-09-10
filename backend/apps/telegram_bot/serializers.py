from rest_framework import serializers

from .models import TelegramLinkToken, TelegramProfile


class LinkTokenSerializer(serializers.ModelSerializer):
    deep_link = serializers.SerializerMethodField()

    class Meta:
        model = TelegramLinkToken
        fields = ('token', 'deep_link', 'created_at')

    def get_deep_link(self, obj):
        bot_username = self.context.get('bot_username', 'EduNestBot')
        return f'https://t.me/{bot_username}?start={obj.token}'


class LinkAccountSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    chat_id = serializers.IntegerField()
    username = serializers.CharField(required=False, allow_blank=True, default='')


class TelegramProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelegramProfile
        fields = ('chat_id', 'username', 'linked_at')
