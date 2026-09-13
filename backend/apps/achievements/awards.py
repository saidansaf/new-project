"""Turli hodisalarda (progress, streak, typing, referral) foydalanuvchiga
yutuq (badge) berish logikasi. Badge'lar 0002_seed_badges migratsiyasida
oldindan yaratiladi — bu yerda faqat mos kelganini biriktiramiz."""

from .models import Badge, UserBadge


def award_badge(user, code: str):
    try:
        badge = Badge.objects.get(code=code)
    except Badge.DoesNotExist:
        return None
    obj, created = UserBadge.objects.get_or_create(student=user, badge=badge)
    return obj if created else None


def check_course_completion_badges(user):
    from apps.enrollments.models import Enrollment

    completed = Enrollment.objects.filter(student=user, progress_percent=100).count()
    if completed >= 1:
        award_badge(user, 'first-course')
    if completed >= 5:
        award_badge(user, 'five-courses')


def check_streak_badges(user):
    if user.current_streak >= 7:
        award_badge(user, 'week-streak')
    if user.current_streak >= 30:
        award_badge(user, 'month-streak')


def check_typing_badge(user, wpm: int):
    if wpm >= 60:
        award_badge(user, 'fast-typer')
    if wpm >= 100:
        award_badge(user, 'speed-demon')


def check_referral_badge(user):
    award_badge(user, 'referrer')
