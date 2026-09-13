from django.contrib import admin

from .models import Enrollment, LessonProgress, VideoPosition, Wishlist


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'progress_percent', 'enrolled_at')
    list_filter = ('course',)


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'watched_at')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'created_at')


@admin.register(VideoPosition)
class VideoPositionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'position_seconds', 'updated_at')
