from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Enrollment


@receiver(post_save, sender=Enrollment)
def issue_certificate_on_completion(sender, instance, created, **kwargs):
    if created or instance.progress_percent < 100:
        return
    from apps.certificates.tasks import generate_certificate_task

    generate_certificate_task.delay(instance.id)
