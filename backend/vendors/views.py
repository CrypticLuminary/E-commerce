"""
Vendors App - Views
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count

from .models import Vendor
from .serializers import (
    VendorSerializer,
    VendorCreateSerializer,
    VendorUpdateSerializer,
    VendorPublicSerializer,
    VendorAdminSerializer
)
from .permissions import IsVendor, IsVendorOwner, IsApprovedVendor


class VendorRegisterView(generics.CreateAPIView):
    """
    View for vendor registration.
    Creates a vendor profile for the authenticated user.
    """
    serializer_class = VendorCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Check if user already has a vendor profile
        if hasattr(request.user, 'vendor_profile'):
            return Response(
                {'error': 'You already have a vendor profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = serializer.save()
        
        return Response({
            'message': 'Vendor registration submitted successfully. Awaiting approval.',
            'vendor': VendorSerializer(vendor).data
        }, status=status.HTTP_201_CREATED)


class VendorProfileView(generics.RetrieveUpdateAPIView):
    """
    View for retrieving and updating vendor's own profile.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return VendorUpdateSerializer
        return VendorSerializer
    
    def get_object(self):
        return self.request.user.vendor_profile


class VendorDashboardView(APIView):
    """
    View for vendor dashboard statistics.
    """
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    
    def get(self, request):
        vendor = request.user.vendor_profile
        
        # Import here to avoid circular imports
        from products.models import Product
        from orders.models import Order, OrderItem
        
        # Get product statistics
        products = Product.objects.filter(vendor=vendor)
        total_products = products.count()
        active_products = products.filter(is_active=True).count()
        out_of_stock = products.filter(stock=0).count()
        
        # Get order statistics
        order_items = OrderItem.objects.filter(product__vendor=vendor)
        total_orders = order_items.values('order').distinct().count()
        
        # Order status counts
        pending_orders = order_items.filter(status='pending').count()
        processing_orders = order_items.filter(status='processing').count()
        shipped_orders = order_items.filter(status='shipped').count()
        delivered_orders = order_items.filter(status='delivered').count()
        
        # Revenue calculation
        total_revenue = order_items.filter(
            order__status__in=['delivered', 'shipped']
        ).aggregate(
            total=Sum('subtotal')
        )['total'] or 0
        
        return Response({
            'vendor': VendorSerializer(vendor).data,
            'statistics': {
                'products': {
                    'total': total_products,
                    'active': active_products,
                    'out_of_stock': out_of_stock,
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'processing': processing_orders,
                    'shipped': shipped_orders,
                    'delivered': delivered_orders,
                },
                'revenue': {
                    'total': float(total_revenue),
                }
            }
        })


class VendorListView(generics.ListAPIView):
    """
    Public view for listing approved vendors.
    """
    serializer_class = VendorPublicSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['is_featured', 'city', 'state']
    search_fields = ['store_name', 'store_description']
    ordering_fields = ['store_name', 'rating', 'total_products', 'created_at']
    
    def get_queryset(self):
        return Vendor.objects.filter(status='approved')


class VendorDetailView(generics.RetrieveAPIView):
    """
    Public view for viewing a single vendor's profile.
    """
    serializer_class = VendorPublicSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Vendor.objects.filter(status='approved')


# Admin Views
class VendorAdminListView(generics.ListAPIView):
    """
    Admin view for listing all vendors.
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorAdminSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['status', 'is_featured']
    search_fields = ['store_name', 'user__email', 'business_email']
    ordering_fields = ['created_at', 'store_name', 'status']


class VendorAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view for managing individual vendors.
    """
    queryset = Vendor.objects.all()
    serializer_class = VendorAdminSerializer
    permission_classes = [permissions.IsAdminUser]


class VendorApprovalView(APIView):
    """
    Admin view for approving/rejecting vendor applications.
    """
    permission_classes = [permissions.IsAdminUser]
    
    def post(self, request, pk):
        try:
            vendor = Vendor.objects.get(pk=pk)
        except Vendor.DoesNotExist:
            return Response(
                {'error': 'Vendor not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')  # 'approve', 'reject', 'suspend'
        
        if action == 'approve':
            vendor.status = 'approved'
            message = 'Vendor approved successfully.'
        elif action == 'reject':
            vendor.status = 'rejected'
            message = 'Vendor rejected.'
        elif action == 'suspend':
            vendor.status = 'suspended'
            message = 'Vendor suspended.'
        else:
            return Response(
                {'error': 'Invalid action. Use: approve, reject, or suspend'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vendor.save()
        return Response({
            'message': message,
            'vendor': VendorAdminSerializer(vendor).data
        })
