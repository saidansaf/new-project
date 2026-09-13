from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    referrals_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'avatar', 'bio', 'phone', 'created_at', 'is_staff',
            'current_streak', 'longest_streak', 'referral_code', 'referrals_count',
        )
        read_only_fields = (
            'id', 'role', 'created_at', 'is_staff', 'current_streak', 'longest_streak',
            'referral_code', 'referrals_count',
        )

    def get_referrals_count(self, obj):
        return obj.referrals.count()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    referral_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'role', 'first_name', 'last_name', 'referral_code')
        extra_kwargs = {'role': {'default': User.Role.STUDENT}}

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Admin rolini o'zi tanlab ro'yxatdan o'tib bo'lmaydi.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        ref_code = validated_data.pop('referral_code', '').strip().upper()

        referrer = User.objects.filter(referral_code=ref_code).first() if ref_code else None

        user = User(**validated_data)
        user.set_password(password)
        if referrer:
            user.referred_by = referrer
        user.save()

        if referrer:
            from apps.achievements.awards import check_referral_badge
            check_referral_badge(referrer)

        return user
