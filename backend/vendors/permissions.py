"""
Vendors App - Custom Permissions
"""

from rest_framework import permissions


class IsVendor(permissions.BasePermission):
    """
    Permission class to check if the user is a vendor.
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role == 'vendor'):
            return False
        
        # Also verify the user has an actual vendor_profile
        try:
            return hasattr(request.user, 'vendor_profile') and request.user.vendor_profile is not None
        except:
            return False


class IsVendorOwner(permissions.BasePermission):
    """
    Permission class to check if the user is the owner of the vendor profile.
    """
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsApprovedVendor(permissions.BasePermission):
    """
    Permission class to check if the vendor is approved.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.role != 'vendor':
            return False
        
        try:
            return request.user.vendor_profile.is_approved
        except:
            return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows read-only access to everyone,
    but write access only to admins.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
