from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'student', 'student_name', 'course', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'student', 'created_at')

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
