"""
Orders App - URL Configuration
"""

from django.urls import path
from .views import (
    # Customer views
    CheckoutView,
    GuestCheckoutView,
    OrderListView,
    OrderDetailView,
    GuestOrderDetailView,
    CancelOrderView,
    
    # Vendor views
    VendorOrderListView,
    VendorOrderItemsView,
    VendorUpdateOrderItemStatusView,
    
    # Admin views
    AdminOrderListView,
    AdminOrderDetailView,
    AdminUpdateOrderStatusView,
    AdminStatisticsView
)

urlpatterns = [
    # Customer endpoints
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('guest-checkout/', GuestCheckoutView.as_view(), name='guest_checkout'),
    path('', OrderListView.as_view(), name='order_list'),
    path('<str:order_number>/', OrderDetailView.as_view(), name='order_detail'),
    path('guest/<str:order_number>/', GuestOrderDetailView.as_view(), name='guest_order_detail'),
    path('<str:order_number>/cancel/', CancelOrderView.as_view(), name='cancel_order'),
    
    # Vendor endpoints
    path('vendor/list/', VendorOrderListView.as_view(), name='vendor_orders'),
    path('vendor/<str:order_number>/', VendorOrderItemsView.as_view(), name='vendor_order_items'),
    path('vendor/item/<int:item_id>/status/', VendorUpdateOrderItemStatusView.as_view(), name='vendor_update_item_status'),
    
    # Admin endpoints
    path('admin/list/', AdminOrderListView.as_view(), name='admin_orders'),
    path('admin/<str:order_number>/', AdminOrderDetailView.as_view(), name='admin_order_detail'),
    path('admin/<str:order_number>/status/', AdminUpdateOrderStatusView.as_view(), name='admin_update_status'),
    path('admin/statistics/', AdminStatisticsView.as_view(), name='admin_statistics'),
]
