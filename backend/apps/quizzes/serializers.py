from rest_framework import serializers

from .models import Answer, Question, Quiz, QuizResult


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ('id', 'text')  # is_correct talabaga ko'rsatilmaydi


class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ('id', 'text', 'question_type', 'answers')


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ('id', 'section', 'title', 'questions')


class QuizResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizResult
        fields = ('id', 'student', 'quiz', 'score', 'passed', 'submitted_at')
        read_only_fields = fields


class QuizSubmitSerializer(serializers.Serializer):
    # {"answers": {"<question_id>": [<answer_id>, ...]}}
    answers = serializers.DictField(child=serializers.ListField(child=serializers.IntegerField()))
