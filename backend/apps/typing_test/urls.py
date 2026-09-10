from django.urls import path

from .views import TypingLeaderboardView, TypingResultCreateView

urlpatterns = [
    path('submit/', TypingResultCreateView.as_view(), name='typing-submit'),
    path('leaderboard/', TypingLeaderboardView.as_view(), name='typing-leaderboard'),
]
