from rest_framework.routers import DefaultRouter

from .views import CertificateViewSet

router = DefaultRouter()
router.register('', CertificateViewSet, basename='certificate')

urlpatterns = router.urls
