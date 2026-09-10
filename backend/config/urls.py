from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Eslatma: '/' va boshqa frontend fayllari (index.html, css/, js/...) WhiteNoise
# middleware orqali beriladi (config/settings.py: WHITENOISE_ROOT) — shuning uchun
# bu yerda alohida bosh sahifa view'i kerak emas.

urlpatterns = [
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
    path('api/admin-panel/', include('apps.admin_panel.urls')),
    path('api/typing/', include('apps.typing_test.urls')),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
]

# Media (masalan sertifikat PDF'lari) — S3 kabi tashqi storage ulanmagani uchun
# hozircha DEBUG holatidan qat'i nazar Django orqali beriladi.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
