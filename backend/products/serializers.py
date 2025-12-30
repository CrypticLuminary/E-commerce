"""
Products App - Serializers
"""

from rest_framework import serializers
from .models import Category, Product, ProductImage, Wishlist
from vendors.serializers import VendorPublicSerializer


class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for categories with subcategories.
    """
    
    subcategories = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    display_icon = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'icon', 'custom_icon', 'display_icon',
            'parent', 'order', 'is_active', 'subcategories',
            'product_count', 'full_path'
        ]
    
    def get_subcategories(self, obj):
        """Get active subcategories."""
        subcategories = obj.subcategories.filter(is_active=True)
        return CategorySerializer(subcategories, many=True).data
    
    def get_product_count(self, obj):
        """Get count of active products in this category."""
        return obj.products.filter(is_active=True).count()


class CategorySimpleSerializer(serializers.ModelSerializer):
    """
    Simple category serializer without nested subcategories.
    """
    display_icon = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'display_icon']


class ProductImageSerializer(serializers.ModelSerializer):
    """
    Serializer for product images.
    """
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductListSerializer(serializers.ModelSerializer):
    """
    Serializer for product list view (limited fields for performance).
    """
    
    category = CategorySimpleSerializer(read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description',
            'price', 'compare_price', 'discount_percentage',
            'stock', 'is_in_stock', 'is_featured', 'is_active',
            'category', 'vendor_name', 'primary_image', 'images',
            'created_at'
        ]
    
    def get_primary_image(self, obj):
        """Get the primary image URL."""
        primary = obj.primary_image
        if primary:
            return ProductImageSerializer(primary).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for product detail view (all fields).
    """
    
    category = CategorySimpleSerializer(read_only=True)
    vendor = VendorPublicSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_in_stock = serializers.ReadOnlyField()
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'compare_price', 'discount_percentage',
            'stock', 'sku', 'is_in_stock', 'is_active', 'is_featured',
            'weight', 'view_count', 'sales_count',
            'category', 'vendor', 'images',
            'created_at', 'updated_at'
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating products (vendor use).
    """
    
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    description = serializers.CharField(required=False, allow_blank=True, default='')
    slug = serializers.SlugField(required=False, allow_blank=True)
    
    class Meta:
        model = Product
        fields = [
            'name', 'slug', 'description', 'short_description',
            'price', 'compare_price', 'stock', 'sku',
            'category', 'is_active', 'is_featured', 'weight',
            'images'
        ]
    
    def validate_slug(self, value):
        """Ensure slug is unique for the vendor."""
        if not value:
            return value
        vendor = self.context['request'].user.vendor_profile
        if Product.objects.filter(vendor=vendor, slug=value).exists():
            raise serializers.ValidationError(
                "You already have a product with this slug."
            )
        return value
    
    def create(self, validated_data):
        """Create product with images."""
        images_data = validated_data.pop('images', [])
        vendor = self.context['request'].user.vendor_profile
        
        # Auto-generate slug from name if not provided
        if not validated_data.get('slug'):
            from django.utils.text import slugify
            import uuid
            base_slug = slugify(validated_data['name'])
            slug = base_slug
            # Ensure unique slug for this vendor
            counter = 1
            while Product.objects.filter(vendor=vendor, slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        
        # Ensure description has a value
        if not validated_data.get('description'):
            validated_data['description'] = validated_data.get('short_description', '') or validated_data['name']
        
        product = Product.objects.create(vendor=vendor, **validated_data)
        
        # Create product images
        for i, image in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=(i == 0),
                order=i
            )
        
        # Update vendor's product count
        vendor.update_product_count()
        
        return product


class ProductUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating products (vendor use).
    """
    
    class Meta:
        model = Product
        fields = [
            'name', 'slug', 'description', 'short_description',
            'price', 'compare_price', 'stock', 'sku',
            'category', 'is_active', 'is_featured', 'weight'
        ]
    
    def validate_slug(self, value):
        """Ensure slug is unique for the vendor (excluding current product)."""
        vendor = self.context['request'].user.vendor_profile
        instance = self.instance
        if Product.objects.filter(vendor=vendor, slug=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError(
                "You already have a product with this slug."
            )
        return value


class ProductImageUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading product images.
    """
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class WishlistSerializer(serializers.ModelSerializer):
    """
    Serializer for wishlist items.
    """
    
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_product_id(self, value):
        """Validate product exists and is active."""
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available.")
        return value
    
    def create(self, validated_data):
        """Create wishlist item."""
        user = self.context['request'].user
        product_id = validated_data['product_id']
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=user,
            product_id=product_id
        )
        
        return wishlist_item
