from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.models import Course

from .models import Payment
from .serializers import CheckoutSerializer, PaymentSerializer


class CheckoutView(APIView):
    """
    To'lov boshlash (stub). Haqiqiy loyihada bu yerda Click/Payme
    invoice yaratish API'siga so'rov yuboriladi va to'lov havolasi qaytariladi.
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
            status=Payment.Status.PENDING,
        )
        return Response(
            {
                'payment': PaymentSerializer(payment).data,
                # TODO: haqiqiy Click/Payme checkout URL bilan almashtiriladi
                'checkout_url': f'https://example-payment.local/pay/{payment.transaction_id}',
            },
            status=status.HTTP_201_CREATED,
        )


class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(student=self.request.user)
