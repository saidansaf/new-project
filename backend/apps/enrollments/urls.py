from rest_framework.routers import DefaultRouter

from .views import EnrollmentViewSet

router = DefaultRouter()
router.register('', EnrollmentViewSet, basename='enrollment')

urlpatterns = router.urls
