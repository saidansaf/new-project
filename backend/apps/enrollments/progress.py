"""
Kurs progressini avtomatik hisoblash.

Qoida: video darslarni ko'rish umumiy progressning 50%'ini, testlardan
o'tish qolgan 50%'ini tashkil qiladi. Agar kursda faqat biri bo'lsa
(masalan testlar yo'q), o'sha yagona qism 100% hisoblanadi.
"""
from apps.courses.models import Lesson
from apps.quizzes.models import Quiz, QuizResult

from .models import Enrollment, LessonProgress


def recalculate_progress(student, course) -> int:
    total_lessons = Lesson.objects.filter(section__course=course).count()
    watched_lessons = LessonProgress.objects.filter(
        student=student, lesson__section__course=course
    ).count()

    total_quizzes = Quiz.objects.filter(section__course=course).count()
    passed_quizzes = (
        QuizResult.objects.filter(student=student, quiz__section__course=course, passed=True)
        .values('quiz')
        .distinct()
        .count()
    )

    has_lessons = total_lessons > 0
    has_quizzes = total_quizzes > 0

    if has_lessons and has_quizzes:
        video_part = (watched_lessons / total_lessons) * 50
        quiz_part = (passed_quizzes / total_quizzes) * 50
        percent = video_part + quiz_part
    elif has_lessons:
        percent = (watched_lessons / total_lessons) * 100
    elif has_quizzes:
        percent = (passed_quizzes / total_quizzes) * 100
    else:
        percent = 0

    percent = round(percent)

    enrollment, _ = Enrollment.objects.get_or_create(student=student, course=course)
    if enrollment.progress_percent != percent:
        enrollment.progress_percent = percent
        enrollment.save(update_fields=['progress_percent'])

        if percent == 100:
            from apps.achievements.awards import check_course_completion_badges
            check_course_completion_badges(student)

    return percent
