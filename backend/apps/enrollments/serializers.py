from rest_framework import serializers

from apps.courses.models import Course

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'course', 'course_title', 'progress_percent', 'enrolled_at')
        read_only_fields = ('id', 'student', 'progress_percent', 'enrolled_at')

    def validate_course(self, course):
        if not course.is_approved:
            raise serializers.ValidationError('Bu kurs hali tasdiqlanmagan.')
        return course

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)


class ProgressUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ('progress_percent',)


class WatchLessonSerializer(serializers.Serializer):
    lesson = serializers.IntegerField()
