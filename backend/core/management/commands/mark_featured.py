"""
Management command to mark products as featured.
"""

from django.core.management.base import BaseCommand
from products.models import Product


class Command(BaseCommand):
    help = 'Mark products as featured'

    def add_arguments(self, parser):
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all products with their featured status',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Mark all active products as featured',
        )
        parser.add_argument(
            '--id',
            type=int,
            help='Mark a specific product by ID as featured',
        )
        parser.add_argument(
            '--unfeature',
            action='store_true',
            help='Remove featured status instead of adding',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=8,
            help='Number of products to feature (default: 8)',
        )

    def handle(self, *args, **options):
        if options['list']:
            self.list_products()
        elif options['all']:
            self.feature_all(options['unfeature'])
        elif options['id']:
            self.feature_by_id(options['id'], options['unfeature'])
        else:
            self.feature_random(options['count'])

    def list_products(self):
        products = Product.objects.all().select_related('vendor')
        self.stdout.write(f"\n{'ID':<5} {'Name':<30} {'Active':<8} {'Featured':<10} {'Vendor Status':<15}")
        self.stdout.write("-" * 75)
        
        for p in products:
            vendor_status = p.vendor.status if p.vendor else 'No vendor'
            self.stdout.write(
                f"{p.id:<5} {p.name[:28]:<30} {str(p.is_active):<8} {str(p.is_featured):<10} {vendor_status:<15}"
            )
        
        # Summary
        total = products.count()
        active = products.filter(is_active=True).count()
        featured = products.filter(is_featured=True).count()
        approved = products.filter(vendor__status='approved').count()
        visible = products.filter(is_active=True, is_featured=True, vendor__status='approved').count()
        
        self.stdout.write(f"\nTotal: {total} | Active: {active} | Featured: {featured} | Approved Vendor: {approved} | Visible Featured: {visible}")

    def feature_all(self, unfeature=False):
        products = Product.objects.filter(is_active=True, vendor__status='approved')
        value = not unfeature
        updated = products.update(is_featured=value)
        action = "unfeatured" if unfeature else "featured"
        self.stdout.write(self.style.SUCCESS(f"Successfully {action} {updated} products"))

    def feature_by_id(self, product_id, unfeature=False):
        try:
            product = Product.objects.get(pk=product_id)
            product.is_featured = not unfeature
            product.save()
            action = "unfeatured" if unfeature else "featured"
            self.stdout.write(self.style.SUCCESS(f"Product '{product.name}' {action}"))
        except Product.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Product with ID {product_id} not found"))

    def feature_random(self, count):
        # First, unfeature all
        Product.objects.update(is_featured=False)
        
        # Feature random active products from approved vendors
        products = Product.objects.filter(
            is_active=True,
            vendor__status='approved'
        ).order_by('?')[:count]
        
        featured_ids = list(products.values_list('id', flat=True))
        updated = Product.objects.filter(id__in=featured_ids).update(is_featured=True)
        
        self.stdout.write(self.style.SUCCESS(f"Featured {updated} random products"))
        for p in Product.objects.filter(id__in=featured_ids):
            self.stdout.write(f"  - {p.name}")
