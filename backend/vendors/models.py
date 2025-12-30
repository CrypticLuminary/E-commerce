"""
Vendors App - Models
Handles vendor profiles and business information
"""

from django.db import models
from django.conf import settings


class Vendor(models.Model):
    """
    Vendor model representing sellers on the platform.
    Each vendor is associated with a user account with 'vendor' role.
    """
    
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('suspended', 'Suspended'),
        ('rejected', 'Rejected'),
    )
    
    # Link to user account
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vendor_profile'
    )
    
    # Business information
    store_name = models.CharField(max_length=100, unique=True)
    store_description = models.TextField(blank=True)
    store_logo = models.ImageField(
        upload_to='vendors/logos/', 
        blank=True, 
        null=True
    )
    store_banner = models.ImageField(
        upload_to='vendors/banners/', 
        blank=True, 
        null=True
    )
    
    # Contact information
    business_email = models.EmailField(blank=True)
    business_phone = models.CharField(max_length=20, blank=True)
    
    # Address
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='United States')
    
    # Status and verification
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    is_featured = models.BooleanField(default=False)
    
    # Statistics (denormalized for performance)
    total_products = models.PositiveIntegerField(default=0)
    total_sales = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.store_name
    
    @property
    def is_approved(self):
        return self.status == 'approved'
    
    @property
    def owner_name(self):
        return self.user.get_full_name()
    
    def update_product_count(self):
        """Update the total product count for this vendor."""
        from products.models import Product
        self.total_products = Product.objects.filter(
            vendor=self, 
            is_active=True
        ).count()
        self.save(update_fields=['total_products'])
    
    def update_sales_count(self):
        """Update the total sales count for this vendor."""
        from orders.models import OrderItem
        self.total_sales = OrderItem.objects.filter(
            product__vendor=self,
            order__status__in=['delivered', 'shipped']
        ).count()
        self.save(update_fields=['total_sales'])
