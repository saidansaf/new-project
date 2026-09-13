from django.conf import settings
from django.db import models


class Badge(models.Model):
    code = models.SlugField(unique=True)
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=10, default='🏅')

    def __str__(self):
        return self.title


class UserBadge(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='badges'
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='holders')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'badge')
        ordering = ['-earned_at']

    def __str__(self):
        return f'{self.student} — {self.badge}'
