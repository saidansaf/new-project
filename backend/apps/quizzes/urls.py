from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import QuizSubmitView, QuizViewSet

router = DefaultRouter()
router.register('', QuizViewSet, basename='quiz')

urlpatterns = [
    path('<int:pk>/submit/', QuizSubmitView.as_view(), name='quiz-submit'),
] + router.urls
