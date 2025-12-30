"""
Cart App - Admin Configuration
"""

from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    """
    Inline admin for cart items.
    """
    model = CartItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Cart Admin Configuration.
    """
    list_display = ['user', 'total_items', 'subtotal', 'created_at', 'updated_at']
    search_fields = ['user__email']
    ordering = ['-updated_at']
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """
    Cart Item Admin Configuration.
    """
    list_display = ['cart', 'product', 'quantity', 'subtotal', 'created_at']
    list_filter = ['created_at']
    search_fields = ['cart__user__email', 'product__name']
