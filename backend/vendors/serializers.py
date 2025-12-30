"""
Vendors App - Serializers
"""

from rest_framework import serializers
from .models import Vendor
from accounts.serializers import UserSerializer


class VendorSerializer(serializers.ModelSerializer):
    """
    Serializer for vendor profile display.
    """
    
    owner_name = serializers.ReadOnlyField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'user_email', 'owner_name',
            'store_name', 'store_description', 'store_logo', 'store_banner',
            'business_email', 'business_phone',
            'address', 'city', 'state', 'postal_code', 'country',
            'status', 'is_featured', 'total_products', 'total_sales', 'rating',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'is_featured', 
            'total_products', 'total_sales', 'rating',
            'created_at', 'updated_at'
        ]


class VendorCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for vendor registration/creation.
    """
    
    class Meta:
        model = Vendor
        fields = [
            'store_name', 'store_description', 'store_logo', 'store_banner',
            'business_email', 'business_phone',
            'address', 'city', 'state', 'postal_code', 'country'
        ]
    
    def validate_store_name(self, value):
        """Ensure store name is unique."""
        if Vendor.objects.filter(store_name__iexact=value).exists():
            raise serializers.ValidationError(
                "A store with this name already exists."
            )
        return value
    
    def create(self, validated_data):
        """Create vendor profile for the current user."""
        user = self.context['request'].user
        
        # Update user role to vendor
        user.role = 'vendor'
        user.save(update_fields=['role'])
        
        # Create vendor profile
        vendor = Vendor.objects.create(user=user, **validated_data)
        return vendor


class VendorUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating vendor profile.
    """
    
    class Meta:
        model = Vendor
        fields = [
            'store_name', 'store_description', 'store_logo', 'store_banner',
            'business_email', 'business_phone',
            'address', 'city', 'state', 'postal_code', 'country'
        ]
    
    def validate_store_name(self, value):
        """Ensure store name is unique (excluding current vendor)."""
        instance = self.instance
        if Vendor.objects.filter(store_name__iexact=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError(
                "A store with this name already exists."
            )
        return value


class VendorPublicSerializer(serializers.ModelSerializer):
    """
    Serializer for public vendor information (limited fields).
    """
    
    owner_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'store_name', 'store_description', 
            'store_logo', 'store_banner',
            'city', 'state', 'country',
            'total_products', 'rating', 'is_featured',
            'owner_name'
        ]


class VendorAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for admin management of vendors.
    """
    
    user = UserSerializer(read_only=True)
    owner_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
