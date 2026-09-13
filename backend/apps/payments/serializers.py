from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'student', 'course', 'course_title', 'amount', 'status',
            'payment_method', 'transaction_id', 'created_at',
        )
        read_only_fields = ('id', 'student', 'status', 'transaction_id', 'created_at')


class CheckoutSerializer(serializers.Serializer):
    course = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)
