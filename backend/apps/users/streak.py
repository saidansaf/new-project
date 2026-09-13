import datetime

from django.utils import timezone


def update_streak(user) -> int:
    """Foydalanuvchi login qilganda chaqiriladi. Kunlik streak'ni yangilaydi va qaytaradi."""
    today = timezone.localdate()

    if user.last_active_date == today:
        pass  # bugun allaqachon hisoblangan
    elif user.last_active_date == today - datetime.timedelta(days=1):
        user.current_streak += 1
    else:
        user.current_streak = 1

    user.longest_streak = max(user.longest_streak, user.current_streak)
    user.last_active_date = today
    user.save(update_fields=['current_streak', 'longest_streak', 'last_active_date'])

    from apps.achievements.awards import check_streak_badges
    check_streak_badges(user)

    return user.current_streak
