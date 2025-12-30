"""
Cart App - Models
Handles shopping cart functionality for authenticated users
"""

from django.db import models
from django.conf import settings
from decimal import Decimal


class Cart(models.Model):
    """
    Shopping cart model for authenticated users.
    Each user has one cart that persists until checkout.
    """
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
    @property
    def total_items(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items.all())
    
    @property
    def subtotal(self):
        """Calculate cart subtotal."""
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def total(self):
        """Calculate cart total (subtotal + tax + shipping)."""
        # For simplicity, we'll just return subtotal
        # In a real app, you'd add tax and shipping calculations
        return self.subtotal
    
    def clear(self):
        """Clear all items from the cart."""
        self.items.all().delete()
    
    def get_items_by_vendor(self):
        """Group cart items by vendor."""
        items_by_vendor = {}
        for item in self.items.select_related('product__vendor').all():
            vendor = item.product.vendor
            if vendor.id not in items_by_vendor:
                items_by_vendor[vendor.id] = {
                    'vendor': vendor,
                    'items': [],
                    'subtotal': Decimal('0.00')
                }
            items_by_vendor[vendor.id]['items'].append(item)
            items_by_vendor[vendor.id]['subtotal'] += item.subtotal
        return items_by_vendor


class CartItem(models.Model):
    """
    Individual item in a shopping cart.
    """
    
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='cart_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ['cart', 'product']
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    @property
    def subtotal(self):
        """Calculate item subtotal."""
        return self.product.price * self.quantity
    
    @property
    def is_available(self):
        """Check if the product is still available."""
        return (
            self.product.is_active and
            self.product.stock >= self.quantity and
            self.product.vendor.is_approved
        )
    
    def save(self, *args, **kwargs):
        """Validate quantity before saving."""
        if self.quantity < 1:
            self.quantity = 1
        if self.quantity > self.product.stock:
            self.quantity = self.product.stock
        super().save(*args, **kwargs)
