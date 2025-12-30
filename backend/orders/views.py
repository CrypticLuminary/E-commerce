"""
Orders App - Views
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from decimal import Decimal

from .models import Order, OrderItem
from .serializers import (
    OrderSerializer,
    OrderItemSerializer,
    CheckoutSerializer,
    GuestCheckoutSerializer,
    OrderStatusUpdateSerializer,
    VendorOrderItemStatusSerializer
)
from cart.models import Cart, CartItem
from products.models import Product
from accounts.models import Address
from vendors.permissions import IsVendor


class CheckoutView(APIView):
    """
    View for processing checkout (authenticated users).
    Creates order from user's cart.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Get user's cart
        try:
            cart = Cart.objects.get(user=request.user)
            if cart.items.count() == 0:
                return Response(
                    {'error': 'Your cart is empty.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Cart.DoesNotExist:
            return Response(
                {'error': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate stock availability
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                return Response(
                    {'error': f'Only {item.product.stock} of {item.product.name} available.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Use saved address if provided
        if data.get('address_id'):
            try:
                address = Address.objects.get(pk=data['address_id'], user=request.user)
                shipping_data = {
                    'shipping_full_name': address.full_name,
                    'shipping_phone': address.phone,
                    'shipping_address_line1': address.address_line1,
                    'shipping_address_line2': address.address_line2,
                    'shipping_city': address.city,
                    'shipping_state': address.state,
                    'shipping_postal_code': address.postal_code,
                    'shipping_country': address.country,
                }
            except Address.DoesNotExist:
                return Response(
                    {'error': 'Address not found.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            shipping_data = {
                'shipping_full_name': data['shipping_full_name'],
                'shipping_phone': data['shipping_phone'],
                'shipping_address_line1': data['shipping_address_line1'],
                'shipping_address_line2': data.get('shipping_address_line2', ''),
                'shipping_city': data['shipping_city'],
                'shipping_state': data['shipping_state'],
                'shipping_postal_code': data['shipping_postal_code'],
                'shipping_country': data.get('shipping_country', 'United States'),
            }
        
        # Save address for future use if requested
        if data.get('save_address') and not data.get('address_id'):
            Address.objects.create(
                user=request.user,
                full_name=shipping_data['shipping_full_name'],
                phone=shipping_data['shipping_phone'],
                address_line1=shipping_data['shipping_address_line1'],
                address_line2=shipping_data['shipping_address_line2'],
                city=shipping_data['shipping_city'],
                state=shipping_data['shipping_state'],
                postal_code=shipping_data['shipping_postal_code'],
                country=shipping_data['shipping_country'],
            )
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            customer_notes=data.get('customer_notes', ''),
            **shipping_data
        )
        
        # Create order items and update stock
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.price,
                product_sku=cart_item.product.sku or '',
                vendor_name=cart_item.product.vendor.store_name,
                quantity=cart_item.quantity,
                subtotal=cart_item.subtotal
            )
            
            # Update product stock
            cart_item.product.update_stock(cart_item.quantity)
        
        # Calculate order totals
        order.calculate_totals()
        
        # Clear cart
        cart.clear()
        
        return Response({
            'message': 'Order placed successfully!',
            'order': OrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)


class GuestCheckoutView(APIView):
    """
    View for processing guest checkout.
    Creates order from localStorage cart.
    """
    permission_classes = [permissions.AllowAny]
    
    @transaction.atomic
    def post(self, request):
        serializer = GuestCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Validate and get products
        order_items_data = []
        for item in data['items']:
            product = Product.objects.get(pk=item['product_id'])
            order_items_data.append({
                'product': product,
                'quantity': item['quantity'],
                'subtotal': product.price * item['quantity']
            })
        
        # Create order
        order = Order.objects.create(
            guest_email=data['guest_email'],
            shipping_full_name=data['shipping_full_name'],
            shipping_phone=data['shipping_phone'],
            shipping_address_line1=data['shipping_address_line1'],
            shipping_address_line2=data.get('shipping_address_line2', ''),
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_postal_code=data['shipping_postal_code'],
            shipping_country=data.get('shipping_country', 'United States'),
            customer_notes=data.get('customer_notes', '')
        )
        
        # Create order items and update stock
        for item_data in order_items_data:
            product = item_data['product']
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_price=product.price,
                product_sku=product.sku or '',
                vendor_name=product.vendor.store_name,
                quantity=item_data['quantity'],
                subtotal=item_data['subtotal']
            )
            
            # Update product stock
            product.update_stock(item_data['quantity'])
        
        # Calculate order totals
        order.calculate_totals()
        
        return Response({
            'message': 'Order placed successfully!',
            'order': OrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    """
    View for listing user's orders.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    """
    View for viewing order details.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'order_number'
    
    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).prefetch_related('items')


class GuestOrderDetailView(APIView):
    """
    View for guest to view their order by order number and email.
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, order_number):
        email = request.query_params.get('email')
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order = Order.objects.get(
                order_number=order_number,
                guest_email=email
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(OrderSerializer(order).data)


class CancelOrderView(APIView):
    """
    View for cancelling an order.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_number):
        try:
            order = Order.objects.get(
                order_number=order_number,
                user=request.user
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Only pending orders can be cancelled
        if order.status != 'pending':
            return Response(
                {'error': 'Only pending orders can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel order
        order.status = 'cancelled'
        order.save()
        
        # Update order item statuses
        order.items.update(status='cancelled')
        
        # Restore stock
        for item in order.items.all():
            if item.product:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])
        
        return Response({
            'message': 'Order cancelled successfully.',
            'order': OrderSerializer(order).data
        })


# ==================== Vendor Order Views ====================

class VendorOrderListView(generics.ListAPIView):
    """
    View for vendors to see orders containing their products.
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    
    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        # Get orders that contain items from this vendor
        order_ids = OrderItem.objects.filter(
            product__vendor=vendor
        ).values_list('order_id', flat=True).distinct()
        
        return Order.objects.filter(id__in=order_ids).prefetch_related('items')


class VendorOrderItemsView(APIView):
    """
    View for vendors to see their items in a specific order.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    
    def get(self, request, order_number):
        vendor = request.user.vendor_profile
        
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get only items belonging to this vendor
        items = order.items.filter(product__vendor=vendor)
        
        if not items.exists():
            return Response(
                {'error': 'No items from your store in this order.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'order_number': order.order_number,
            'order_status': order.status,
            'customer_name': order.customer_name,
            'shipping_address': order.shipping_address,
            'items': OrderItemSerializer(items, many=True).data,
            'created_at': order.created_at
        })


class VendorUpdateOrderItemStatusView(APIView):
    """
    View for vendors to update the status of their order items.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    
    def patch(self, request, item_id):
        vendor = request.user.vendor_profile
        
        try:
            item = OrderItem.objects.get(pk=item_id, product__vendor=vendor)
        except OrderItem.DoesNotExist:
            return Response(
                {'error': 'Order item not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = VendorOrderItemStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        item.status = serializer.validated_data['status']
        item.save()
        
        # Update vendor sales count if delivered
        if item.status == 'delivered':
            vendor.update_sales_count()
        
        return Response({
            'message': 'Order item status updated.',
            'item': OrderItemSerializer(item).data
        })


# ==================== Admin Order Views ====================

class AdminOrderListView(generics.ListAPIView):
    """
    Admin view for listing all orders.
    """
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['status', 'user']
    search_fields = ['order_number', 'guest_email', 'user__email']
    ordering_fields = ['created_at', 'total']


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    """
    Admin view for managing individual orders.
    """
    queryset = Order.objects.all().prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = 'order_number'


class AdminUpdateOrderStatusView(APIView):
    """
    Admin view for updating order status.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def patch(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        old_status = order.status
        new_status = serializer.validated_data['status']
        
        order.status = new_status
        order.save()
        
        # Update all order items to match
        order.items.update(status=new_status)
        
        return Response({
            'message': f'Order status updated from {old_status} to {new_status}.',
            'order': OrderSerializer(order).data
        })


class AdminStatisticsView(APIView):
    """
    Admin view for platform statistics.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def get(self, request):
        from django.contrib.auth import get_user_model
        from vendors.models import Vendor
        from products.models import Product
        from django.db.models import Sum, Count
        
        User = get_user_model()
        
        # User statistics
        total_users = User.objects.count()
        total_customers = User.objects.filter(role='customer').count()
        total_vendors = Vendor.objects.count()
        approved_vendors = Vendor.objects.filter(status='approved').count()
        pending_vendors = Vendor.objects.filter(status='pending').count()
        
        # Product statistics
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()
        
        # Order statistics
        total_orders = Order.objects.count()
        orders_by_status = Order.objects.values('status').annotate(count=Count('id'))
        
        # Revenue
        total_revenue = Order.objects.filter(
            status__in=['delivered', 'shipped']
        ).aggregate(total=Sum('total'))['total'] or 0
        
        return Response({
            'users': {
                'total': total_users,
                'customers': total_customers,
                'vendors': total_vendors,
            },
            'vendors': {
                'total': total_vendors,
                'approved': approved_vendors,
                'pending': pending_vendors,
            },
            'products': {
                'total': total_products,
                'active': active_products,
            },
            'orders': {
                'total': total_orders,
                'by_status': {item['status']: item['count'] for item in orders_by_status},
            },
            'revenue': {
                'total': float(total_revenue),
            }
        })
