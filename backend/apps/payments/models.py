import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.courses.models import Course


class Coupon(models.Model):
    """Admin panel orqali yaratiladigan chegirma kodi."""

    code = models.CharField(max_length=30, unique=True)
    discount_percent = models.PositiveSmallIntegerField(help_text="1-100 oralig'ida foiz chegirma")
    is_active = models.BooleanField(default=True)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Bo'sh = cheksiz")
    used_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True

    def __str__(self):
        return f'{self.code} (-{self.discount_percent}%)'


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
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=Method.choices, default=Method.CLICK)
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.student} — {self.course} ({self.status})'
