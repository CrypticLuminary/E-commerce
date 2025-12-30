"""
Cart App - Views
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
    MergeCartSerializer
)
from products.models import Product


def get_or_create_cart(user):
    """Get or create a cart for the user."""
    cart, created = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    """
    View for retrieving and managing the user's cart.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get the user's cart."""
        cart = get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    def delete(self, request):
        """Clear the cart."""
        cart = get_or_create_cart(request.user)
        cart.clear()
        return Response({'message': 'Cart cleared successfully.'})


class AddToCartView(APIView):
    """
    View for adding items to the cart.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        product_id = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        
        cart = get_or_create_cart(request.user)
        product = Product.objects.get(pk=product_id)
        
        # Check if item already in cart
        try:
            cart_item = CartItem.objects.get(cart=cart, product=product)
            # Update quantity
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response(
                    {'error': f'Only {product.stock} items available. You have {cart_item.quantity} in cart.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            cart_item.quantity = new_quantity
            cart_item.save()
            message = 'Cart updated successfully.'
        except CartItem.DoesNotExist:
            # Create new cart item
            cart_item = CartItem.objects.create(
                cart=cart,
                product=product,
                quantity=quantity
            )
            message = 'Item added to cart.'
        
        return Response({
            'message': message,
            'cart_item': CartItemSerializer(cart_item).data,
            'cart': CartSerializer(cart).data
        })


class UpdateCartItemView(APIView):
    """
    View for updating cart item quantity.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            cart = get_or_create_cart(request.user)
            cart_item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        quantity = serializer.validated_data['quantity']
        
        # Validate stock
        if quantity > cart_item.product.stock:
            return Response(
                {'error': f'Only {cart_item.product.stock} items available.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cart_item.quantity = quantity
        cart_item.save()
        
        return Response({
            'message': 'Cart updated successfully.',
            'cart_item': CartItemSerializer(cart_item).data,
            'cart': CartSerializer(cart).data
        })


class RemoveFromCartView(APIView):
    """
    View for removing items from the cart.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request, item_id):
        try:
            cart = get_or_create_cart(request.user)
            cart_item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response(
                {'error': 'Cart item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        cart_item.delete()
        
        return Response({
            'message': 'Item removed from cart.',
            'cart': CartSerializer(cart).data
        })


class MergeCartView(APIView):
    """
    View for merging guest cart into authenticated cart.
    Called after user logs in with items in localStorage.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = MergeCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        cart = get_or_create_cart(request.user)
        merged_count = 0
        errors = []
        
        for item_data in serializer.validated_data['items']:
            try:
                product = Product.objects.get(pk=item_data['product_id'])
                
                # Skip if product is not available
                if not product.is_active or not product.vendor.is_approved:
                    errors.append(f"{product.name} is no longer available.")
                    continue
                
                quantity = min(item_data['quantity'], product.stock)
                if quantity <= 0:
                    errors.append(f"{product.name} is out of stock.")
                    continue
                
                # Check if item already in cart
                try:
                    cart_item = CartItem.objects.get(cart=cart, product=product)
                    # Update quantity (don't exceed stock)
                    new_quantity = min(cart_item.quantity + quantity, product.stock)
                    cart_item.quantity = new_quantity
                    cart_item.save()
                except CartItem.DoesNotExist:
                    # Create new cart item
                    CartItem.objects.create(
                        cart=cart,
                        product=product,
                        quantity=quantity
                    )
                
                merged_count += 1
                
            except Product.DoesNotExist:
                errors.append(f"Product with ID {item_data['product_id']} not found.")
        
        return Response({
            'message': f'Merged {merged_count} items into your cart.',
            'errors': errors,
            'cart': CartSerializer(cart).data
        })


class CartCountView(APIView):
    """
    View for getting cart item count (for header badge).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response({
            'count': cart.total_items,
            'subtotal': str(cart.subtotal)
        })
