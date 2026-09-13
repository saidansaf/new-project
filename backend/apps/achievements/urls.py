from django.urls import path

from .views import MyBadgesView

urlpatterns = [
    path('my/', MyBadgesView.as_view(), name='my-badges'),
]
