from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Enrollment
from .serializers import EnrollmentSerializer, ProgressUpdateSerializer


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

    @action(detail=True, methods=['patch'], url_path='progress')
    def progress(self, request, pk=None):
        enrollment = self.get_object()
        serializer = ProgressUpdateSerializer(enrollment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EnrollmentSerializer(enrollment).data)
