from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Course
from apps.notifications.utils import send_notification

from .models import Payment
from .serializers import CheckoutSerializer, PaymentSerializer


class CheckoutView(APIView):
    """
    To'lov (stub). Haqiqiy loyihada bu yerda Click/Payme invoice yaratish
    API'siga so'rov yuboriladi, foydalanuvchi tashqi sahifada to'laydi va
    webhook orqali status='paid' bo'ladi. Hozircha gateway ulanmagani uchun
    to'lov darhol muvaffaqiyatli deb belgilanadi (demo/diplom uchun yetarli).
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = get_object_or_404(Course, pk=serializer.validated_data['course'])

        payment = Payment.objects.create(
            student=request.user,
            course=course,
            amount=course.price,
            payment_method=serializer.validated_data['payment_method'],
            status=Payment.Status.PAID,  # TODO: haqiqiy gateway ulanganda PENDING qilib, webhook kutiladi
        )
        send_notification(
            request.user,
            f'"{course.title}" kursi uchun {payment.amount} so\'m to\'lovingiz qabul qilindi!',
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(student=self.request.user)
