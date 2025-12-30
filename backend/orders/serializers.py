"""
Orders App - Serializers
"""

from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product
from accounts.models import Address


class OrderItemSerializer(serializers.ModelSerializer):
    """
    Serializer for order items.
    """
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_price', 'product_sku',
            'vendor_name', 'quantity', 'subtotal', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for orders (list view).
    """
    
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.ReadOnlyField()
    customer_name = serializers.ReadOnlyField()
    shipping_address = serializers.ReadOnlyField()
    item_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'guest_email',
            'customer_email', 'customer_name',
            'status', 'shipping_full_name', 'shipping_phone',
            'shipping_address_line1', 'shipping_address_line2',
            'shipping_city', 'shipping_state', 'shipping_postal_code',
            'shipping_country', 'shipping_address',
            'subtotal', 'shipping_cost', 'tax', 'total',
            'customer_notes', 'items', 'item_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'user', 'subtotal', 'shipping_cost',
            'tax', 'total', 'created_at', 'updated_at'
        ]
    
    def get_item_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class CheckoutItemSerializer(serializers.Serializer):
    """
    Serializer for checkout cart items.
    """
    
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    """
    Serializer for checkout process (authenticated users).
    """
    
    # Shipping address - required only if address_id is not provided
    shipping_full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_address_line1 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    shipping_address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_country = serializers.CharField(max_length=100, default='United States', required=False)
    
    # Optional notes
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    
    # Optional: use saved address
    address_id = serializers.IntegerField(required=False)
    
    # Optional: save address for future use
    save_address = serializers.BooleanField(default=False)
    
    def validate(self, data):
        """Validate that either address_id or shipping fields are provided."""
        address_id = data.get('address_id')
        
        if not address_id:
            # If no address_id, require shipping fields (phone is optional)
            required_fields = [
                'shipping_full_name', 'shipping_address_line1',
                'shipping_city', 'shipping_state', 'shipping_postal_code'
            ]
            missing = [f for f in required_fields if not data.get(f)]
            if missing:
                raise serializers.ValidationError(
                    f"Missing required shipping fields: {', '.join(missing)}"
                )
        
        return data


class GuestCheckoutSerializer(serializers.Serializer):
    """
    Serializer for guest checkout process.
    """
    
    # Guest email
    guest_email = serializers.EmailField()
    
    # Shipping address
    shipping_full_name = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_address_line1 = serializers.CharField(max_length=255)
    shipping_address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100, default='United States')
    
    # Cart items (from localStorage)
    items = CheckoutItemSerializer(many=True)
    
    # Optional notes
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_items(self, value):
        """Validate cart items."""
        if not value:
            raise serializers.ValidationError("Cart is empty.")
        
        for item in value:
            try:
                product = Product.objects.get(pk=item['product_id'])
                if not product.is_active:
                    raise serializers.ValidationError(
                        f"{product.name} is no longer available."
                    )
                if product.stock < item['quantity']:
                    raise serializers.ValidationError(
                        f"Only {product.stock} of {product.name} available."
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    f"Product with ID {item['product_id']} not found."
                )
        
        return value


class OrderStatusUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating order status.
    """
    
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)


class VendorOrderItemStatusSerializer(serializers.Serializer):
    """
    Serializer for vendor updating order item status.
    """
    
    status = serializers.ChoiceField(choices=OrderItem.STATUS_CHOICES)
