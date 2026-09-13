from django.contrib import admin

from .models import Coupon, Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'amount', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percent', 'is_active', 'used_count', 'max_uses', 'expires_at')
