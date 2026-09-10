from django.conf import settings
from django.db import models

from apps.courses.models import Course


class Certificate(models.Model):
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    file = models.FileField(upload_to='certificates/', null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')
        ordering = ['-issued_at']

    def __str__(self):
        return f'{self.student} — {self.course}'
