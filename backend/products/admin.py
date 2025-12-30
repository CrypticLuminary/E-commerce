"""
Products App - Admin Configuration
"""

from django.contrib import admin
from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    """
    Inline admin for product images.
    """
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary', 'order']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Category Admin Configuration.
    """
    list_display = ['name', 'parent', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Product Admin Configuration.
    """
    list_display = [
        'name', 'vendor', 'category', 'price', 'stock',
        'is_active', 'is_featured', 'sales_count', 'created_at'
    ]
    list_filter = ['is_active', 'is_featured', 'category', 'vendor', 'created_at']
    search_fields = ['name', 'sku', 'description', 'vendor__store_name']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-created_at']
    
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('vendor', 'category', 'name', 'slug', 'description', 'short_description')
        }),
        ('Pricing', {
            'fields': ('price', 'compare_price')
        }),
        ('Inventory', {
            'fields': ('stock', 'sku', 'weight')
        }),
        ('Status', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Statistics', {
            'fields': ('view_count', 'sales_count'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['view_count', 'sales_count']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """
    Product Image Admin Configuration.
    """
    list_display = ['product', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['product__name', 'alt_text']
