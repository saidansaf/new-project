from rest_framework import permissions, viewsets

from .models import Certificate
from .serializers import CertificateSerializer


class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Certificate.objects.all()
        return Certificate.objects.filter(student=user)
