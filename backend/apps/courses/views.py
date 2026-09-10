from django.db.models import Q
from rest_framework import viewsets

from .models import Category, Course, Lesson, Section
from .permissions import IsInstructorOrReadOnly
from .serializers import (
    CategorySerializer, CourseDetailSerializer, CourseListSerializer,
    LessonSerializer, SectionSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsInstructorOrReadOnly]
    filterset_fields = ['slug']


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsInstructorOrReadOnly]
    filterset_fields = ['category', 'level', 'instructor']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CourseDetailSerializer
        return CourseListSerializer

    def get_queryset(self):
        qs = Course.objects.select_related('instructor', 'category')
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.role == 'instructor'):
            return qs.filter(Q(is_approved=True) | Q(instructor=user))
        return qs.filter(is_approved=True)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsInstructorOrReadOnly]
    filterset_fields = ['course']


class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsInstructorOrReadOnly]
    filterset_fields = ['section']
