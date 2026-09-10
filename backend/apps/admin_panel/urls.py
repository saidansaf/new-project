from django.urls import path

from .views import (
    AdminApproveCourseView, AdminPendingCoursesView, AdminStatsView,
    AdminUserListView, AdminUserToggleBlockView,
)

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/toggle-block/', AdminUserToggleBlockView.as_view(), name='admin-user-toggle-block'),
    path('courses/pending/', AdminPendingCoursesView.as_view(), name='admin-courses-pending'),
    path('courses/<int:pk>/approve/', AdminApproveCourseView.as_view(), name='admin-course-approve'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
]
