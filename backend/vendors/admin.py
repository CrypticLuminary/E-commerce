"""
Vendors App - Admin Configuration
"""

from django.contrib import admin
from .models import Vendor


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    """
    Vendor Admin Configuration.
    """
    list_display = [
        'store_name', 'user', 'status', 'is_featured',
        'total_products', 'total_sales', 'rating', 'created_at'
    ]
    list_filter = ['status', 'is_featured', 'country', 'created_at']
    search_fields = ['store_name', 'user__email', 'business_email', 'city']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'store_name', 'store_description')
        }),
        ('Media', {
            'fields': ('store_logo', 'store_banner')
        }),
        ('Contact', {
            'fields': ('business_email', 'business_phone')
        }),
        ('Address', {
            'fields': ('address', 'city', 'state', 'postal_code', 'country')
        }),
        ('Status', {
            'fields': ('status', 'is_featured')
        }),
        ('Statistics', {
            'fields': ('total_products', 'total_sales', 'rating'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['total_products', 'total_sales', 'rating']
    
    actions = ['approve_vendors', 'suspend_vendors']
    
    def approve_vendors(self, request, queryset):
        queryset.update(status='approved')
        self.message_user(request, f'{queryset.count()} vendors approved.')
    approve_vendors.short_description = 'Approve selected vendors'
    
    def suspend_vendors(self, request, queryset):
        queryset.update(status='suspended')
        self.message_user(request, f'{queryset.count()} vendors suspended.')
    suspend_vendors.short_description = 'Suspend selected vendors'
