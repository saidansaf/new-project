from django.urls import path

from .views import ChatView, RecommendationView

urlpatterns = [
    path('', RecommendationView.as_view(), name='recommendations'),
    path('chat/', ChatView.as_view(), name='ai-chat'),
]
