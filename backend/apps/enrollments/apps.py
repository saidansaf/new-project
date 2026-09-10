from django.apps import AppConfig


class EnrollmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.enrollments'
    label = 'enrollments'
    verbose_name = "Ro'yxatdan o'tishlar"

    def ready(self):
        from . import signals  # noqa: F401
