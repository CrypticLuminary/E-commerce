"""
Products App - Admin Configuration
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, ProductImage, CATEGORY_ICON_CHOICES


class SubcategoryInline(admin.TabularInline):
    """
    Inline admin for subcategories.
    """
    model = Category
    fk_name = 'parent'
    extra = 1
    fields = ['name', 'slug', 'icon', 'custom_icon', 'order', 'is_active']
    prepopulated_fields = {'slug': ('name',)}
    verbose_name = "Subcategory"
    verbose_name_plural = "Subcategories"


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
    Category Admin Configuration with enhanced icon support.
    """
    list_display = ['name', 'display_icon_preview', 'parent', 'subcategory_count', 'product_count', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'parent', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']
    list_editable = ['order', 'is_active']
    
    inlines = [SubcategoryInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'image')
        }),
        ('Icon Settings', {
            'fields': ('icon', 'custom_icon'),
            'description': 'Choose a preset icon OR enter a custom Lucide icon name. Custom icon takes priority if both are set.'
        }),
        ('Hierarchy', {
            'fields': ('parent',),
            'description': 'Leave empty to create a parent/root category. Select a parent to create a subcategory.'
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active')
        }),
    )
    
    def display_icon_preview(self, obj):
        """Display the icon name with emoji preview."""
        icon = obj.display_icon
        if not icon:
            return '-'
        
        # Find emoji from choices
        emoji = ''
        for choice_value, choice_label in CATEGORY_ICON_CHOICES:
            if choice_value == icon:
                emoji = choice_label.split(' ')[0] if ' ' in choice_label else ''
                break
        
        if obj.custom_icon:
            return format_html('<span title="Custom icon">{} (custom)</span>', icon)
        return format_html('<span>{} {}</span>', emoji, icon)
    
    display_icon_preview.short_description = 'Icon'
    
    def subcategory_count(self, obj):
        """Count of subcategories."""
        count = obj.subcategories.count()
        if count > 0:
            return format_html('<span style="color: green; font-weight: bold;">{}</span>', count)
        return count
    
    subcategory_count.short_description = 'Subcategories'
    
    def product_count(self, obj):
        """Count of products in this category."""
        count = Product.objects.filter(category=obj).count()
        return count
    
    product_count.short_description = 'Products'
    
    def get_queryset(self, request):
        """Optimize queryset with prefetch."""
        return super().get_queryset(request).select_related('parent').prefetch_related('subcategories')


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
