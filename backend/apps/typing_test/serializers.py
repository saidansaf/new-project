from rest_framework import serializers

from .models import TypingResult


class TypingResultSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = TypingResult
        fields = ('id', 'username', 'duration_seconds', 'wpm', 'accuracy', 'created_at')
        read_only_fields = ('id', 'username', 'created_at')

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)
