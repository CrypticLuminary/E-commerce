"""
Accounts App - Admin Configuration
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Address


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User Admin with email-based authentication.
    """
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """
    Address Admin Configuration.
    """
    list_display = ['full_name', 'user', 'city', 'state', 'address_type', 'is_default']
    list_filter = ['address_type', 'is_default', 'country', 'state']
    search_fields = ['full_name', 'city', 'address_line1', 'user__email']
    ordering = ['-created_at']
