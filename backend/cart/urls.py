"""
Cart App - URL Configuration
"""

from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveFromCartView,
    MergeCartView,
    CartCountView
)

urlpatterns = [
    path('', CartView.as_view(), name='cart'),
    path('add/', AddToCartView.as_view(), name='add_to_cart'),
    path('update/<int:item_id>/', UpdateCartItemView.as_view(), name='update_cart_item'),
    path('remove/<int:item_id>/', RemoveFromCartView.as_view(), name='remove_from_cart'),
    path('merge/', MergeCartView.as_view(), name='merge_cart'),
    path('count/', CartCountView.as_view(), name='cart_count'),
]
