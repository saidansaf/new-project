import uuid

from django.conf import settings
from django.db import models

from apps.courses.models import Course


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Kutilmoqda'
        PAID = 'paid', "To'landi"
        FAILED = 'failed', 'Muvaffaqiyatsiz'

    class Method(models.TextChoices):
        CLICK = 'click', 'Click'
        PAYME = 'payme', 'Payme'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments'
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=Method.choices, default=Method.CLICK)
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student} — {self.course} ({self.status})'
