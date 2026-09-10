from django.conf import settings
from django.db import models


class TypingResult(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='typing_results'
    )
    duration_seconds = models.PositiveSmallIntegerField()
    wpm = models.PositiveSmallIntegerField()
    accuracy = models.PositiveSmallIntegerField()  # 0-100
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-wpm']

    def __str__(self):
        return f'{self.student} — {self.wpm} WPM ({self.duration_seconds}s)'
