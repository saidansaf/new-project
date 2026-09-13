from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminApproveCourseView, AdminCouponViewSet, AdminPendingCoursesView, AdminStatsView,
    AdminUserListView, AdminUserToggleBlockView,
)

router = DefaultRouter()
router.register('coupons', AdminCouponViewSet, basename='admin-coupon')

urlpatterns = [
    path('users/', AdminUserListView.as_view(), name='admin-users'),
    path('users/<int:pk>/toggle-block/', AdminUserToggleBlockView.as_view(), name='admin-user-toggle-block'),
    path('courses/pending/', AdminPendingCoursesView.as_view(), name='admin-courses-pending'),
    path('courses/<int:pk>/approve/', AdminApproveCourseView.as_view(), name='admin-course-approve'),
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
] + router.urls
