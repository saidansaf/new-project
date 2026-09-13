import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


def generate_referral_code():
    return uuid.uuid4().hex[:8].upper()


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', 'Talaba'
        INSTRUCTOR = 'instructor', "O'qituvchi"
        ADMIN = 'admin', 'Admin'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Kunlik streak: har kuni tizimga kirganda +1, bir kun o'tkazib yuborilsa 0'dan boshlanadi.
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    # Do'stni taklif qilish (referral)
    referral_code = models.CharField(max_length=12, unique=True, default=generate_referral_code)
    referred_by = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals'
    )

    def __str__(self):
        return self.username

    @property
    def is_instructor(self):
        return self.role == self.Role.INSTRUCTOR
