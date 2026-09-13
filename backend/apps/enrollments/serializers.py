from rest_framework import serializers

from apps.courses.models import Course

from .models import Enrollment, Wishlist


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


class WishlistSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    course_price = serializers.DecimalField(source='course.price', read_only=True, max_digits=10, decimal_places=2)
    course_level = serializers.CharField(source='course.level', read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ('id', 'course', 'course_title', 'course_price', 'course_level', 'average_rating', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_average_rating(self, obj):
        ratings = list(obj.course.reviews.values_list('rating', flat=True))
        return round(sum(ratings) / len(ratings), 1) if ratings else None

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
