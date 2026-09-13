from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.certificates.models import Certificate
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.payments.models import Coupon
from apps.payments.serializers import CouponSerializer

from .serializers import AdminCourseSerializer, AdminUserSerializer

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email']


class AdminUserToggleBlockView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.is_staff:
            return Response({'detail': "Admin foydalanuvchini bloklab bo'lmaydi."}, status=400)
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response(AdminUserSerializer(user).data)


class AdminPendingCoursesView(generics.ListAPIView):
    queryset = Course.objects.filter(is_approved=False).order_by('-created_at')
    serializer_class = AdminCourseSerializer
    permission_classes = [IsAdmin]


class AdminApproveCourseView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        course.is_approved = True
        course.save(update_fields=['is_approved'])
        return Response(AdminCourseSerializer(course).data)


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response({
            'total_users': User.objects.count(),
            'total_students': User.objects.filter(role=User.Role.STUDENT).count(),
            'total_instructors': User.objects.filter(role=User.Role.INSTRUCTOR).count(),
            'blocked_users': User.objects.filter(is_active=False).count(),
            'total_courses': Course.objects.count(),
            'pending_courses': Course.objects.filter(is_approved=False).count(),
            'total_enrollments': Enrollment.objects.count(),
            'total_certificates': Certificate.objects.count(),
        })


class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [IsAdmin]
