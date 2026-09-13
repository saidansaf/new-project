from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Course
from apps.notifications.utils import send_notification

from .models import Coupon, Payment
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
        data = serializer.validated_data
        course = get_object_or_404(Course, pk=data['course'])

        amount = course.price
        discount_amount = Decimal('0')
        coupon = None

        code = data.get('coupon_code', '').strip().upper()
        if code:
            coupon = Coupon.objects.filter(code=code).first()
            if not coupon or not coupon.is_valid():
                return Response({'coupon_code': ["Chegirma kodi yaroqsiz yoki muddati o'tgan."]}, status=400)
            discount_amount = (amount * coupon.discount_percent / Decimal('100')).quantize(Decimal('0.01'))
            amount = max(Decimal('0'), amount - discount_amount)

        with transaction.atomic():
            payment = Payment.objects.create(
                student=request.user,
                course=course,
                amount=amount,
                coupon=coupon,
                discount_amount=discount_amount,
                payment_method=data['payment_method'],
                status=Payment.Status.PAID,  # TODO: haqiqiy gateway ulanganda PENDING + webhook
            )
            if coupon:
                coupon.used_count += 1
                coupon.save(update_fields=['used_count'])

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
