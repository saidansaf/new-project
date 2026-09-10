from django.contrib import admin

from .models import TypingResult


@admin.register(TypingResult)
class TypingResultAdmin(admin.ModelAdmin):
    list_display = ('student', 'duration_seconds', 'wpm', 'accuracy', 'created_at')
    list_filter = ('duration_seconds',)
