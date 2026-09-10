from django.conf import settings
from django.db import models

from apps.courses.models import Section


class Quiz(models.Model):
    section = models.OneToOneField(Section, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=255)

    def __str__(self):
        return self.title


class Question(models.Model):
    class Type(models.TextChoices):
        SINGLE = 'single', 'Bitta to\'g\'ri javob'
        MULTIPLE = 'multiple', 'Ko\'p tanlovli'

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=Type.choices, default=Type.SINGLE)

    def __str__(self):
        return self.text


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text


class QuizResult(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_results'
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='results')
    score = models.PositiveSmallIntegerField(default=0)
    passed = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
