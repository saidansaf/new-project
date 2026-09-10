from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def api_root(request):
    return JsonResponse({
        'message': "Bu EduNest backend (REST API). Sayt (frontend) alohida joyda joylashtiriladi.",
        'api_docs': request.build_absolute_uri('/api/docs/'),
        'admin': request.build_absolute_uri('/admin/'),
    })


urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),

    path('api/auth/', include('apps.users.urls')),
    path('api/courses/', include('apps.courses.urls')),
    path('api/enrollments/', include('apps.enrollments.urls')),
    path('api/quizzes/', include('apps.quizzes.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/recommendations/', include('apps.ai_recommend.urls')),
    path('api/certificates/', include('apps.certificates.urls')),
    path('api/telegram/', include('apps.telegram_bot.urls')),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
