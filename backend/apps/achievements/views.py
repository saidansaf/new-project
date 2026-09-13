from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Badge, UserBadge
from .serializers import BadgeSerializer, UserBadgeSerializer


class MyBadgesView(APIView):
    """Foydalanuvchining olgan yutuqlari + hali olmagan (locked) yutuqlar ro'yxati."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        earned = UserBadge.objects.filter(student=request.user).select_related('badge')
        earned_codes = set(earned.values_list('badge__code', flat=True))
        locked = Badge.objects.exclude(code__in=earned_codes)

        return Response({
            'earned': UserBadgeSerializer(earned, many=True).data,
            'locked': BadgeSerializer(locked, many=True).data,
        })
