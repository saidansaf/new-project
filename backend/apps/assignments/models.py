from django.conf import settings
from django.db import models

from apps.courses.models import Section


class Assignment(models.Model):
    section = models.OneToOneField(Section, on_delete=models.CASCADE, related_name='assignment')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    max_score = models.PositiveSmallIntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def course(self):
        return self.section.course

    def __str__(self):
        return self.title


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assignment_submissions'
    )
    text = models.TextField(blank=True)
    file = models.FileField(upload_to='submissions/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.PositiveSmallIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('assignment', 'student')
        ordering = ['-submitted_at']

    def __str__(self):
        return f'{self.student} -> {self.assignment}'
