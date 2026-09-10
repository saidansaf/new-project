from django.urls import path

from .views import GenerateLinkTokenView, LinkAccountView

urlpatterns = [
    path('link-token/', GenerateLinkTokenView.as_view(), name='telegram-link-token'),
    path('link/', LinkAccountView.as_view(), name='telegram-link'),
]
