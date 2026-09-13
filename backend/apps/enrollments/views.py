from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Lesson

from .models import Enrollment, LessonProgress, Wishlist
from .progress import recalculate_progress
from .serializers import (
    EnrollmentSerializer, ProgressUpdateSerializer, WatchLessonSerializer, WishlistSerializer,
)


class EnrollmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Enrollment.objects.all()
        return Enrollment.objects.filter(student=user)

    @action(detail=False, methods=['get'], url_path='my')
    def my(self, request):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True, methods=['patch'], url_path='progress',
        permission_classes=[permissions.IsAdminUser],
    )
    def progress(self, request, pk=None):
        """Progress endi avtomatik hisoblanadi (video + test) — bu faqat admin uchun qo'lda tuzatish."""
        enrollment = self.get_object()
        serializer = ProgressUpdateSerializer(enrollment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EnrollmentSerializer(enrollment).data)


class WatchedLessonsView(APIView):
    """Berilgan kurs bo'yicha joriy foydalanuvchi ko'rgan darslar ID ro'yxati."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        course_id = request.query_params.get('course')
        qs = LessonProgress.objects.filter(student=request.user)
        if course_id:
            qs = qs.filter(lesson__section__course_id=course_id)
        return Response(list(qs.values_list('lesson_id', flat=True)))


class WatchLessonView(APIView):
    """Talaba video darsni охиригача ko'rganida (YouTube player ENDED) chaqiriladi."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = WatchLessonSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = get_object_or_404(Lesson, pk=serializer.validated_data['lesson'])
        course = lesson.section.course

        if not Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': "Siz bu kursga yozilmagansiz."}, status=status.HTTP_403_FORBIDDEN)

        LessonProgress.objects.get_or_create(student=request.user, lesson=lesson)
        percent = recalculate_progress(request.user, course)
        return Response({'progress_percent': percent})


class WishlistListCreateView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(student=self.request.user)


class WishlistDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, course_id):
        Wishlist.objects.filter(student=request.user, course_id=course_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
