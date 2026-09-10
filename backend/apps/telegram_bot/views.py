from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TelegramLinkToken, TelegramProfile
from .permissions import IsBotService
from .serializers import LinkAccountSerializer, LinkTokenSerializer, TelegramProfileSerializer


class GenerateLinkTokenView(APIView):
    """Saytda login qilgan foydalanuvchi 'Telegram botga ulash' tugmasini bosganda chaqiriladi."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = TelegramLinkToken.objects.create(user=request.user)
        serializer = LinkTokenSerializer(
            token, context={'bot_username': getattr(settings, 'TELEGRAM_BOT_USERNAME', 'EduNestBot')}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LinkAccountView(APIView):
    """Bot /start <token> qabul qilgach shu endpointga murojaat qilib akkauntni bog'laydi.
    Faqat bot xizmati (X-Bot-Secret) chaqira oladi — foydalanuvchi JWT'i shart emas."""

    permission_classes = [IsBotService]

    def post(self, request):
        serializer = LinkAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            link_token = TelegramLinkToken.objects.get(token=data['token'], is_used=False)
        except TelegramLinkToken.DoesNotExist:
            return Response({'detail': 'Token yaroqsiz yoki ishlatilgan.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = TelegramProfile.objects.update_or_create(
            user=link_token.user,
            defaults={'chat_id': data['chat_id'], 'username': data.get('username', '')},
        )
        link_token.is_used = True
        link_token.save(update_fields=['is_used'])

        return Response(
            {
                'user_id': link_token.user_id,
                'full_name': link_token.user.get_full_name() or link_token.user.username,
                'profile': TelegramProfileSerializer(profile).data,
            },
            status=status.HTTP_200_OK,
        )
