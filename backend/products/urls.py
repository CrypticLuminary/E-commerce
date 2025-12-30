"""
Products App - URL Configuration
"""

from django.urls import path
from .views import (
    # Public views
    CategoryListView,
    CategoryDetailView,
    ProductListView,
    ProductDetailView,
    ProductByIdView,
    FeaturedProductsView,
    ProductSearchView,
    
    # Vendor views
    VendorProductListView,
    VendorProductDetailView,
    VendorProductImageView,
    VendorProductImageDeleteView,
    
    # Admin views
    CategoryAdminView,
    CategoryAdminDetailView,
    AdminProductListView,
    AdminProductDetailView,
    
    # Wishlist views
    WishlistListView,
    WishlistDeleteView,
    WishlistToggleView,
    WishlistCheckView,
)

urlpatterns = [
    # Public category endpoints
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category_detail'),
    
    # Public product endpoints
    path('', ProductListView.as_view(), name='product_list'),
    path('featured/', FeaturedProductsView.as_view(), name='featured_products'),
    path('search/', ProductSearchView.as_view(), name='product_search'),
    path('detail/<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    path('<int:pk>/', ProductByIdView.as_view(), name='product_by_id'),
    
    # Wishlist endpoints
    path('wishlist/', WishlistListView.as_view(), name='wishlist_list'),
    path('wishlist/<int:pk>/', WishlistDeleteView.as_view(), name='wishlist_delete'),
    path('wishlist/toggle/<int:product_id>/', WishlistToggleView.as_view(), name='wishlist_toggle'),
    path('wishlist/check/<int:product_id>/', WishlistCheckView.as_view(), name='wishlist_check'),
    
    # Vendor product endpoints
    path('vendor/', VendorProductListView.as_view(), name='vendor_products'),
    path('vendor/<int:pk>/', VendorProductDetailView.as_view(), name='vendor_product_detail'),
    path('vendor/<int:product_id>/images/', VendorProductImageView.as_view(), name='vendor_product_images'),
    path('vendor/images/<int:pk>/', VendorProductImageDeleteView.as_view(), name='vendor_product_image_delete'),
    
    # Admin endpoints
    path('admin/categories/', CategoryAdminView.as_view(), name='admin_categories'),
    path('admin/categories/<int:pk>/', CategoryAdminDetailView.as_view(), name='admin_category_detail'),
    path('admin/', AdminProductListView.as_view(), name='admin_products'),
    path('admin/<int:pk>/', AdminProductDetailView.as_view(), name='admin_product_detail'),
]
