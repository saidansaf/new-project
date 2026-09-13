import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


@shared_task
def send_notification_email(email: str, message: str):
    try:
        send_mail(
            subject="EduNest — yangi bildirishnoma",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:  # SMTP sozlanmagan/vaqtinchalik xato bo'lsa ham asosiy oqim buzilmasin
        logger.warning("Email bildirishnoma yuborilmadi (%s): %s", email, exc)
