from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    EnrollmentViewSet, WatchedLessonsView, WatchLessonView,
    WishlistDeleteView, WishlistListCreateView,
)

router = DefaultRouter()
router.register('', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('watch-lesson/', WatchLessonView.as_view(), name='watch-lesson'),
    path('watched-lessons/', WatchedLessonsView.as_view(), name='watched-lessons'),
    path('wishlist/', WishlistListCreateView.as_view(), name='wishlist-list'),
    path('wishlist/<int:course_id>/', WishlistDeleteView.as_view(), name='wishlist-delete'),
] + router.urls
