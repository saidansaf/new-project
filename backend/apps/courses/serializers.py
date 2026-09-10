from rest_framework import serializers

from apps.quizzes.models import Quiz

from .models import Category, Course, Lesson, Section


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug')


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'section', 'title', 'video_url', 'content', 'order')


class SectionSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quiz_id = serializers.SerializerMethodField()

    class Meta:
        model = Section
        fields = ('id', 'course', 'title', 'order', 'lessons', 'quiz_id')

    def get_quiz_id(self, obj):
        return Quiz.objects.filter(section=obj).values_list('id', flat=True).first()


class CourseListSerializer(serializers.ModelSerializer):
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'title', 'slug', 'price', 'level', 'cover_image',
            'category', 'category_name', 'instructor', 'instructor_name',
            'is_approved', 'average_rating', 'created_at',
        )
        # is_approved faqat admin panel orqali o'zgartiriladi — instructor
        # o'z kursini o'zi tasdiqlay olmasligi kerak. instructor esa
        # perform_create() da so'rov yuborgan foydalanuvchidan avtomatik olinadi.
        read_only_fields = ('is_approved', 'instructor')

    def get_average_rating(self, obj):
        ratings = list(obj.reviews.values_list('rating', flat=True))
        return round(sum(ratings) / len(ratings), 1) if ratings else None


class CourseDetailSerializer(CourseListSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ('description', 'sections')
