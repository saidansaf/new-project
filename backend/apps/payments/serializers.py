from rest_framework import serializers

from .models import Coupon, Payment


class PaymentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True, default=None)

    class Meta:
        model = Payment
        fields = (
            'id', 'student', 'course', 'course_title', 'amount', 'discount_amount', 'coupon_code',
            'status', 'payment_method', 'transaction_id', 'created_at',
        )
        read_only_fields = (
            'id', 'student', 'discount_amount', 'coupon_code', 'status', 'transaction_id', 'created_at',
        )


class CheckoutSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'discount_percent', 'is_active', 'max_uses',
            'used_count', 'expires_at', 'created_at',
        )
        read_only_fields = ('id', 'used_count', 'created_at')
