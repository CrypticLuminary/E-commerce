"""
Orders App - Admin Configuration
"""

from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    """
    Inline admin for order items.
    """
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_price', 'vendor_name', 'subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Order Admin Configuration.
    """
    list_display = [
        'order_number', 'customer_name', 'status', 'total',
        'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['order_number', 'user__email', 'guest_email', 'shipping_full_name']
    ordering = ['-created_at']
    
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'user', 'guest_email', 'status')
        }),
        ('Shipping Address', {
            'fields': (
                'shipping_full_name', 'shipping_phone',
                'shipping_address_line1', 'shipping_address_line2',
                'shipping_city', 'shipping_state', 'shipping_postal_code',
                'shipping_country'
            )
        }),
        ('Totals', {
            'fields': ('subtotal', 'shipping_cost', 'tax', 'total')
        }),
        ('Notes', {
            'fields': ('customer_notes', 'admin_notes'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['order_number', 'subtotal', 'shipping_cost', 'tax', 'total']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    """
    Order Item Admin Configuration.
    """
    list_display = [
        'order', 'product_name', 'vendor_name', 'quantity',
        'subtotal', 'status'
    ]
    list_filter = ['status', 'vendor_name', 'created_at']
    search_fields = ['order__order_number', 'product_name', 'vendor_name']
