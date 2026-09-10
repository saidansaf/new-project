from rest_framework import generics, permissions

from .models import TypingResult
from .serializers import TypingResultSerializer


class TypingResultCreateView(generics.CreateAPIView):
    serializer_class = TypingResultSerializer
    permission_classes = [permissions.IsAuthenticated]


class TypingLeaderboardView(generics.ListAPIView):
    serializer_class = TypingResultSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        duration = self.request.query_params.get('duration', 60)
        # Har bir foydalanuvchining shu duration bo'yicha eng yaxshi (top) natijasi
        best_ids = (
            TypingResult.objects.filter(duration_seconds=duration)
            .order_by('student_id', '-wpm')
            .distinct('student_id')
            .values_list('id', flat=True)
        )
        return TypingResult.objects.filter(id__in=best_ids).order_by('-wpm')[:10]
