from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, CourseViewSet, LessonViewSet, SectionViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('sections', SectionViewSet, basename='section')
router.register('lessons', LessonViewSet, basename='lesson')
router.register('', CourseViewSet, basename='course')

urlpatterns = router.urls
