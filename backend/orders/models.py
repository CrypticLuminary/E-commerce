"""
Orders App - Models
Handles order processing and management
"""

from django.db import models
from django.conf import settings
from decimal import Decimal
import uuid


class Order(models.Model):
    """
    Order model representing a customer's purchase.
    Orders can be from authenticated users or guests.
    """
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    # Unique order number
    order_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # User (optional for guest checkout)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='orders',
        null=True,
        blank=True
    )
    
    # Guest information (for non-registered users)
    guest_email = models.EmailField(blank=True, null=True)
    
    # Order status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Shipping address
    shipping_full_name = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=20)
    shipping_address_line1 = models.CharField(max_length=255)
    shipping_address_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='United States')
    
    # Order totals
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Notes
    customer_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Order {self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_order_number():
        """Generate a unique order number."""
        return f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    @property
    def customer_email(self):
        """Get the customer email (from user or guest)."""
        if self.user:
            return self.user.email
        return self.guest_email
    
    @property
    def customer_name(self):
        """Get the customer name."""
        if self.user:
            return self.user.get_full_name()
        return self.shipping_full_name
    
    @property
    def shipping_address(self):
        """Get the formatted shipping address."""
        parts = [
            self.shipping_address_line1,
            self.shipping_address_line2,
            f"{self.shipping_city}, {self.shipping_state} {self.shipping_postal_code}",
            self.shipping_country
        ]
        return ', '.join(filter(None, parts))
    
    def calculate_totals(self):
        """Calculate order totals from items."""
        self.subtotal = sum(item.subtotal for item in self.items.all())
        # Simple tax calculation (10%)
        self.tax = self.subtotal * Decimal('0.10')
        # Simple shipping cost
        self.shipping_cost = Decimal('5.00') if self.subtotal < Decimal('50.00') else Decimal('0.00')
        self.total = self.subtotal + self.tax + self.shipping_cost
        self.save(update_fields=['subtotal', 'tax', 'shipping_cost', 'total'])


class OrderItem(models.Model):
    """
    Individual item in an order.
    Stores product snapshot at time of purchase.
    """
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        related_name='order_items',
        null=True
    )
    
    # Product snapshot (in case product is deleted/modified)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    product_sku = models.CharField(max_length=50, blank=True)
    
    # Vendor info snapshot
    vendor_name = models.CharField(max_length=100)
    
    # Quantity and subtotal
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Item-level status (for multi-vendor order splitting)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
    
    def save(self, *args, **kwargs):
        # Calculate subtotal
        if not self.subtotal:
            self.subtotal = self.product_price * self.quantity
        super().save(*args, **kwargs)
