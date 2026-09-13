from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet, CourseViewSet, InstructorStatsView, LessonViewSet, SectionViewSet,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('sections', SectionViewSet, basename='section')
router.register('lessons', LessonViewSet, basename='lesson')
router.register('', CourseViewSet, basename='course')

urlpatterns = [
    # Router'dagi '<pk>/' bilan to'qnashmasligi uchun bu yo'l undan OLDIN turishi shart.
    path('my-stats/', InstructorStatsView.as_view(), name='instructor-stats'),
] + router.urls
