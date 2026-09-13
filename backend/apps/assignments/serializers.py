from rest_framework import serializers

from .models import Assignment, Submission


class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='section.course.title', read_only=True)

    class Meta:
        model = Assignment
        fields = ('id', 'section', 'title', 'description', 'max_score', 'course_title')


class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)

    class Meta:
        model = Submission
        fields = (
            'id', 'assignment', 'assignment_title', 'student', 'student_name', 'text', 'file',
            'submitted_at', 'grade', 'feedback', 'graded_at',
        )
        read_only_fields = ('id', 'student', 'submitted_at', 'grade', 'feedback', 'graded_at')


class GradeSubmissionSerializer(serializers.Serializer):
    grade = serializers.IntegerField(min_value=0, max_value=100)
    feedback = serializers.CharField(required=False, allow_blank=True, default='')
