"""
Oddiy content-based tavsiya tizimi.

Mantiq: foydalanuvchi ro'yxatdan o'tgan kurslarning kategoriyalarini olib,
o'sha kategoriyalardagi hali yozilmagan, tasdiqlangan kurslarni reyting
bo'yicha tartiblab taklif qiladi. Tarixi bo'lmasa — eng yuqori baholangan
kurslarni qaytaradi.

Kelajakda bu yerni collaborative filtering yoki tashqi AI (OpenAI/Claude)
so'rovi bilan almashtirish mumkin — API (views.py) o'zgarmaydi.
"""
from django.db.models import Avg, Count

from apps.courses.models import Course
from apps.enrollments.models import Enrollment


def recommend_courses_for_user(user, limit: int = 10):
    enrolled_course_ids = Enrollment.objects.filter(student=user).values_list('course_id', flat=True)
    enrolled_categories = Course.objects.filter(id__in=enrolled_course_ids).values_list(
        'category_id', flat=True
    )

    base_qs = Course.objects.filter(is_approved=True).exclude(id__in=enrolled_course_ids)
    base_qs = base_qs.annotate(avg_rating=Avg('reviews__rating'), reviews_count=Count('reviews'))

    if enrolled_categories:
        recommended = base_qs.filter(category_id__in=list(enrolled_categories))
        if recommended.exists():
            return recommended.order_by('-avg_rating', '-reviews_count')[:limit]

    return base_qs.order_by('-avg_rating', '-reviews_count')[:limit]
