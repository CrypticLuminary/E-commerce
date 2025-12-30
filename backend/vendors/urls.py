"""
Vendors App - URL Configuration
"""

from django.urls import path
from .views import (
    VendorRegisterView,
    VendorProfileView,
    VendorDashboardView,
    VendorListView,
    VendorDetailView,
    VendorAdminListView,
    VendorAdminDetailView,
    VendorApprovalView
)

urlpatterns = [
    # Public endpoints
    path('', VendorListView.as_view(), name='vendor_list'),
    path('<int:pk>/', VendorDetailView.as_view(), name='vendor_detail'),
    
    # Vendor endpoints
    path('register/', VendorRegisterView.as_view(), name='vendor_register'),
    path('profile/', VendorProfileView.as_view(), name='vendor_profile'),
    path('dashboard/', VendorDashboardView.as_view(), name='vendor_dashboard'),
    
    # Admin endpoints
    path('admin/list/', VendorAdminListView.as_view(), name='vendor_admin_list'),
    path('admin/<int:pk>/', VendorAdminDetailView.as_view(), name='vendor_admin_detail'),
    path('admin/<int:pk>/approval/', VendorApprovalView.as_view(), name='vendor_approval'),
]
