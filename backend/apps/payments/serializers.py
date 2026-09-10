from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id', 'student', 'course', 'amount', 'status',
            'payment_method', 'transaction_id', 'created_at',
        )
        read_only_fields = ('id', 'student', 'status', 'transaction_id', 'created_at')


class CheckoutSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)
