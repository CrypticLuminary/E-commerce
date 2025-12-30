"""
Cart App - Serializers
"""

from rest_framework import serializers
from .models import Cart, CartItem
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    """
    Serializer for cart items.
    """
    
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'quantity',
            'subtotal', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CartSerializer(serializers.ModelSerializer):
    """
    Serializer for shopping cart.
    """
    
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()
    
    class Meta:
        model = Cart
        fields = [
            'id', 'items', 'total_items', 'subtotal', 'total',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """
    Serializer for adding items to cart.
    """
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate_product_id(self, value):
        """Validate that the product exists and is available."""
        from products.models import Product
        
        try:
            product = Product.objects.get(pk=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        
        if not product.is_active:
            raise serializers.ValidationError("Product is not available.")
        
        if not product.vendor.is_approved:
            raise serializers.ValidationError("Vendor is not approved.")
        
        return value
    
    def validate(self, attrs):
        """Validate stock availability."""
        from products.models import Product
        
        product = Product.objects.get(pk=attrs['product_id'])
        if product.stock < attrs['quantity']:
            raise serializers.ValidationError({
                "quantity": f"Only {product.stock} items available in stock."
            })
        
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """
    Serializer for updating cart item quantity.
    """
    
    quantity = serializers.IntegerField(min_value=1)


class GuestCartItemSerializer(serializers.Serializer):
    """
    Serializer for guest cart items (stored in localStorage).
    Used to merge guest cart into user cart on login.
    """
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class MergeCartSerializer(serializers.Serializer):
    """
    Serializer for merging guest cart into authenticated cart.
    """
    
    items = GuestCartItemSerializer(many=True)
