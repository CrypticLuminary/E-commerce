"""
Products App - Views
"""

from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    CategorySimpleSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
    ProductImageSerializer,
    ProductImageUploadSerializer
)
from vendors.permissions import IsVendor, IsApprovedVendor


# ==================== Category Views ====================

class CategoryListView(generics.ListAPIView):
    """
    Public view for listing all active categories.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Disable pagination for categories
    
    def get_queryset(self):
        # Return only root categories (those without parent)
        return Category.objects.filter(is_active=True, parent=None)


class CategoryDetailView(generics.RetrieveAPIView):
    """
    Public view for category details.
    """
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        return Category.objects.filter(is_active=True)


class CategoryAdminView(generics.ListCreateAPIView):
    """
    Admin view for managing categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]


class CategoryAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view for managing individual categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]


# ==================== Product Views ====================

class ProductListView(generics.ListAPIView):
    """
    Public view for listing all active products.
    Supports filtering, searching, and ordering.
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'vendor', 'is_featured']
    search_fields = ['name', 'description', 'short_description']
    ordering_fields = ['price', 'created_at', 'sales_count', 'view_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Product.objects.filter(
            is_active=True,
            vendor__status='approved'
        ).select_related('category', 'vendor').prefetch_related('images')
        
        # Filter by category slug
        category_slug = self.request.query_params.get('category_slug')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        
        # Filter by in-stock
        in_stock = self.request.query_params.get('in_stock')
        if in_stock and in_stock.lower() == 'true':
            queryset = queryset.filter(stock__gt=0)
        
        return queryset


class ProductDetailView(generics.RetrieveAPIView):
    """
    Public view for product details by slug.
    Increments view count on each request.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            vendor__status='approved'
        ).select_related('category', 'vendor').prefetch_related('images')
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.increment_view_count()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductByIdView(generics.RetrieveAPIView):
    """
    Public view for product details by ID.
    Used for cart functionality.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'
    
    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            vendor__status='approved'
        ).select_related('category', 'vendor').prefetch_related('images')


class FeaturedProductsView(generics.ListAPIView):
    """
    Public view for listing featured products.
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None  # Return a simple array, not paginated
    
    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_featured=True,
            vendor__status='approved'
        ).select_related('category', 'vendor').prefetch_related('images')[:12]


class ProductSearchView(generics.ListAPIView):
    """
    View for searching products.
    """
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return Product.objects.none()
        
        return Product.objects.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(short_description__icontains=query) |
            Q(category__name__icontains=query),
            is_active=True,
            vendor__status='approved'
        ).select_related('category', 'vendor').prefetch_related('images')


# ==================== Vendor Product Views ====================

class VendorProductListView(generics.ListCreateAPIView):
    """
    Vendor view for listing and creating their products.
    Requires vendor to be approved to create products.
    """
    permission_classes = [permissions.IsAuthenticated, IsApprovedVendor]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'sku']
    ordering_fields = ['created_at', 'price', 'stock', 'sales_count']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductListSerializer
    
    def get_queryset(self):
        return Product.objects.filter(
            vendor=self.request.user.vendor_profile
        ).select_related('category').prefetch_related('images')


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vendor view for managing individual products.
    Requires vendor to be approved.
    """
    permission_classes = [permissions.IsAuthenticated, IsApprovedVendor]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductUpdateSerializer
        return ProductDetailSerializer
    
    def get_queryset(self):
        return Product.objects.filter(
            vendor=self.request.user.vendor_profile
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vendor = instance.vendor
        self.perform_destroy(instance)
        # Update vendor's product count
        vendor.update_product_count()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VendorProductImageView(generics.CreateAPIView):
    """
    Vendor view for uploading product images.
    Requires vendor to be approved.
    """
    serializer_class = ProductImageUploadSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprovedVendor]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, product_id):
        # Verify product belongs to vendor
        try:
            product = Product.objects.get(
                pk=product_id,
                vendor=request.user.vendor_profile
            )
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VendorProductImageDeleteView(generics.DestroyAPIView):
    """
    Vendor view for deleting product images.
    Requires vendor to be approved.
    """
    permission_classes = [permissions.IsAuthenticated, IsApprovedVendor]
    
    def get_queryset(self):
        return ProductImage.objects.filter(
            product__vendor=self.request.user.vendor_profile
        )


# ==================== Admin Product Views ====================

class AdminProductListView(generics.ListAPIView):
    """
    Admin view for listing all products.
    """
    queryset = Product.objects.all().select_related('category', 'vendor')
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['vendor', 'category', 'is_active', 'is_featured']
    search_fields = ['name', 'sku', 'vendor__store_name']


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin view for managing individual products.
    """
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.IsAdminUser]


# ==================== Wishlist Views ====================

from .serializers import WishlistSerializer
from .models import Wishlist


class WishlistListView(generics.ListCreateAPIView):
    """
    List and add items to wishlist.
    """
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related(
            'product__category', 'product__vendor'
        ).prefetch_related('product__images')


class WishlistDeleteView(generics.DestroyAPIView):
    """
    Remove item from wishlist.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)


class WishlistToggleView(APIView):
    """
    Toggle product in wishlist (add if not exists, remove if exists).
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )
        
        if not created:
            # Item already exists, remove it
            wishlist_item.delete()
            return Response({
                'status': 'removed',
                'message': 'Product removed from wishlist.'
            })
        
        return Response({
            'status': 'added',
            'message': 'Product added to wishlist.'
        }, status=status.HTTP_201_CREATED)


class WishlistCheckView(APIView):
    """
    Check if a product is in the user's wishlist.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, product_id):
        is_in_wishlist = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()
        
        return Response({'is_in_wishlist': is_in_wishlist})
