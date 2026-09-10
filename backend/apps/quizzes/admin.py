from django.contrib import admin

from .models import Answer, Question, Quiz, QuizResult


class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 2


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'section')
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'question_type')
    inlines = [AnswerInline]


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'score', 'passed', 'submitted_at')
