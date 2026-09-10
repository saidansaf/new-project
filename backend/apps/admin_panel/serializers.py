from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.courses.models import Course

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'is_active', 'is_staff', 'created_at',
        )


class AdminCourseSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)

    class Meta:
        model = Course
        fields = ('id', 'title', 'instructor', 'instructor_name', 'is_approved', 'created_at')
