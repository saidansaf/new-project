from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'amount', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method')
