"""
Accounts App - Serializers
Handles serialization/deserialization of User and Address models
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, Address


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user info in the response.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims to the token
        token['email'] = user.email
        token['role'] = user.role
        token['name'] = user.get_full_name()
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user data to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'phone': self.user.phone,
        }
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'password', 'password2', 
            'first_name', 'last_name', 'phone', 'role'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # Only allow customer and vendor registration
        if attrs.get('role') not in ['customer', 'vendor']:
            attrs['role'] = 'customer'
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile display and updates.
    """
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'is_active', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'date_joined']
    
    def get_full_name(self, obj):
        return obj.get_full_name()


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "New password fields didn't match."
            })
        return attrs


class AddressSerializer(serializers.ModelSerializer):
    """
    Serializer for user addresses.
    """
    
    full_address = serializers.ReadOnlyField()
    
    class Meta:
        model = Address
        fields = [
            'id', 'full_name', 'phone', 'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country', 
            'address_type', 'is_default', 'full_address',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Automatically assign the current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class GuestAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for guest checkout addresses.
    """
    
    guest_email = serializers.EmailField(required=True)
    
    class Meta:
        model = Address
        fields = [
            'id', 'guest_email', 'full_name', 'phone', 
            'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'address_type'
        ]
        read_only_fields = ['id']
