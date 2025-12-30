"""
Products App - Models
Handles product catalog, categories, and inventory management
"""

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


# Icon choices for categories (Lucide icon names)
CATEGORY_ICON_CHOICES = [
    ('', '-- Select an Icon --'),
    ('shopping-bag', '🛍️ Shopping Bag'),
    ('shirt', '👕 Shirt / Clothing'),
    ('smartphone', '📱 Smartphone'),
    ('laptop', '💻 Laptop'),
    ('headphones', '🎧 Headphones'),
    ('watch', '⌚ Watch'),
    ('home', '🏠 Home'),
    ('sofa', '🛋️ Sofa / Furniture'),
    ('utensils', '🍴 Utensils / Kitchen'),
    ('book', '📚 Book'),
    ('gamepad-2', '🎮 Gaming'),
    ('dumbbell', '🏋️ Fitness'),
    ('bike', '🚲 Bike / Sports'),
    ('car', '🚗 Car / Automotive'),
    ('baby', '👶 Baby'),
    ('heart', '❤️ Health'),
    ('sparkles', '✨ Beauty'),
    ('gift', '🎁 Gift'),
    ('music', '🎵 Music'),
    ('camera', '📷 Camera'),
    ('tv', '📺 TV / Electronics'),
    ('flower-2', '🌸 Garden'),
    ('dog', '🐕 Pets'),
    ('plane', '✈️ Travel'),
    ('coffee', '☕ Food & Drinks'),
    ('gem', '💎 Jewelry'),
    ('brush', '🖌️ Art & Craft'),
    ('wrench', '🔧 Tools'),
    ('zap', '⚡ Electronics'),
    ('package', '📦 General'),
]


class Category(models.Model):
    """
    Category model for organizing products.
    Supports hierarchical categories (parent-child relationship).
    """
    
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    
    # Icon field - choose from preset icons or use custom
    icon = models.CharField(
        max_length=50, 
        choices=CATEGORY_ICON_CHOICES, 
        blank=True,
        help_text="Select a preset icon for this category"
    )
    custom_icon = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Or enter a custom Lucide icon name (e.g., 'shopping-cart'). See https://lucide.dev/icons"
    )
    
    # Parent category for hierarchical structure
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='subcategories',
        blank=True,
        null=True
    )
    
    # Display order
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['order', 'name']
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    @property
    def display_icon(self):
        """Return the icon to use - custom takes priority over preset."""
        return self.custom_icon if self.custom_icon else self.icon
    
    @property
    def full_path(self):
        """Return the full category path."""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name
    
    def get_all_products(self):
        """Get all products in this category and its subcategories."""
        from django.db.models import Q
        
        # Get subcategory IDs
        subcategory_ids = list(self.subcategories.values_list('id', flat=True))
        subcategory_ids.append(self.id)
        
        return Product.objects.filter(
            category_id__in=subcategory_ids,
            is_active=True
        )


class Product(models.Model):
    """
    Product model representing items for sale.
    Each product belongs to a vendor and category.
    """
    
    # Relationships
    vendor = models.ForeignKey(
        'vendors.Vendor',
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        related_name='products',
        null=True,
        blank=True
    )
    
    # Basic information
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    compare_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Original price before discount"
    )
    
    # Inventory
    stock = models.PositiveIntegerField(default=0)
    sku = models.CharField(max_length=50, blank=True, unique=True, null=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Metadata
    weight = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Weight in kg"
    )
    
    # Statistics
    view_count = models.PositiveIntegerField(default=0)
    sales_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        # Unique slug per vendor
        unique_together = ['vendor', 'slug']
    
    def __str__(self):
        return self.name
    
    @property
    def is_in_stock(self):
        """Check if the product is in stock."""
        return self.stock > 0
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if compare_price exists."""
        if self.compare_price and self.compare_price > self.price:
            discount = ((self.compare_price - self.price) / self.compare_price) * 100
            return round(discount, 0)
        return 0
    
    @property
    def primary_image(self):
        """Get the primary product image."""
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary
        return self.images.first()
    
    def increment_view_count(self):
        """Increment the view count."""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def update_stock(self, quantity):
        """Update stock after an order."""
        self.stock -= quantity
        if self.stock < 0:
            self.stock = 0
        self.sales_count += quantity
        self.save(update_fields=['stock', 'sales_count'])


class ProductImage(models.Model):
    """
    Product image model for storing multiple images per product.
    """
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['order', '-is_primary']
    
    def __str__(self):
        return f"{self.product.name} - Image {self.order}"
    
    def save(self, *args, **kwargs):
        """Ensure only one primary image per product."""
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product,
                is_primary=True
            ).update(is_primary=False)
        super().save(*args, **kwargs)


class Wishlist(models.Model):
    """
    Wishlist model for storing user's favorite products.
    """
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='wishlisted_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'
        unique_together = ['user', 'product']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name}"
