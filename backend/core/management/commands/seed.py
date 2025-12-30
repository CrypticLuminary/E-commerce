"""
Database Seeder Command
Populates the database with sample data for development and testing.

Usage:
    python manage.py seed              # Seed all data
    python manage.py seed --clear      # Clear existing data first
    python manage.py seed --users      # Seed only users
    python manage.py seed --products   # Seed only products
"""

import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.db import transaction

from accounts.models import User
from vendors.models import Vendor
from products.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )
        parser.add_argument(
            '--users',
            action='store_true',
            help='Seed only users and vendors',
        )
        parser.add_argument(
            '--products',
            action='store_true',
            help='Seed only categories and products',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('🌱 Starting database seeding...'))

        if options['clear']:
            self.clear_data()

        seed_all = not options['users'] and not options['products']

        with transaction.atomic():
            if seed_all or options['users']:
                self.seed_users()
                self.seed_vendors()

            if seed_all or options['products']:
                self.seed_categories()
                self.seed_products()

        self.stdout.write(self.style.SUCCESS('✅ Database seeding completed!'))

    def clear_data(self):
        """Clear existing data from the database."""
        self.stdout.write('🗑️  Clearing existing data...')
        
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Vendor.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write(self.style.SUCCESS('   Data cleared!'))

    def seed_users(self):
        """Create sample users."""
        self.stdout.write('👥 Creating users...')

        # Create admin user
        admin, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('password123')
            admin.save()
            self.stdout.write(f'   Created admin: {admin.email}')

        # Create vendor users
        vendors_data = [
            {'email': 'vendor@example.com', 'first_name': 'John', 'last_name': 'Vendor'},
            {'email': 'techstore@example.com', 'first_name': 'Tech', 'last_name': 'Store'},
            {'email': 'fashionhub@example.com', 'first_name': 'Fashion', 'last_name': 'Hub'},
            {'email': 'homestyle@example.com', 'first_name': 'Home', 'last_name': 'Style'},
            {'email': 'sportsgear@example.com', 'first_name': 'Sports', 'last_name': 'Gear'},
        ]

        self.vendor_users = []
        for data in vendors_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'vendor',
                    'phone': f'+1555{random.randint(1000000, 9999999)}',
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created vendor user: {user.email}')
            self.vendor_users.append(user)

        # Create customer users
        customers_data = [
            {'email': 'customer@example.com', 'first_name': 'Jane', 'last_name': 'Customer'},
            {'email': 'buyer1@example.com', 'first_name': 'Mike', 'last_name': 'Johnson'},
            {'email': 'buyer2@example.com', 'first_name': 'Sarah', 'last_name': 'Williams'},
            {'email': 'shopper@example.com', 'first_name': 'David', 'last_name': 'Brown'},
        ]

        for data in customers_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'customer',
                    'phone': f'+1555{random.randint(1000000, 9999999)}',
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'   Created customer: {user.email}')

        self.stdout.write(self.style.SUCCESS(f'   Users created!'))

    def seed_vendors(self):
        """Create vendor profiles."""
        self.stdout.write('🏪 Creating vendors...')

        if not hasattr(self, 'vendor_users'):
            self.vendor_users = User.objects.filter(role='vendor')

        vendors_data = [
            {
                'store_name': 'TechZone Electronics',
                'store_description': 'Your one-stop shop for the latest electronics and gadgets. We offer premium quality products at competitive prices with fast shipping.',
                'business_email': 'support@techzone.com',
                'city': 'San Francisco',
                'state': 'California',
                'country': 'United States',
                'is_featured': True,
                'rating': Decimal('4.8'),
            },
            {
                'store_name': 'Fashion Forward',
                'store_description': 'Trendy and stylish clothing for modern fashionistas. Discover the latest trends in fashion with our curated collection.',
                'business_email': 'hello@fashionforward.com',
                'city': 'New York',
                'state': 'New York',
                'country': 'United States',
                'is_featured': True,
                'rating': Decimal('4.6'),
            },
            {
                'store_name': 'Home & Living',
                'store_description': 'Transform your living space with our beautiful home decor and furniture. Quality pieces for every room.',
                'business_email': 'info@homeliving.com',
                'city': 'Los Angeles',
                'state': 'California',
                'country': 'United States',
                'is_featured': False,
                'rating': Decimal('4.5'),
            },
            {
                'store_name': 'Sports Elite',
                'store_description': 'Premium sports equipment and athletic wear for champions. From beginners to pros, we have everything you need.',
                'business_email': 'team@sportselite.com',
                'city': 'Chicago',
                'state': 'Illinois',
                'country': 'United States',
                'is_featured': True,
                'rating': Decimal('4.7'),
            },
            {
                'store_name': 'Book Haven',
                'store_description': 'Discover your next favorite read. Wide selection of books across all genres from bestsellers to hidden gems.',
                'business_email': 'books@bookhaven.com',
                'city': 'Seattle',
                'state': 'Washington',
                'country': 'United States',
                'is_featured': False,
                'rating': Decimal('4.4'),
            },
        ]

        self.vendors = []
        for i, data in enumerate(vendors_data):
            if i < len(self.vendor_users):
                vendor, created = Vendor.objects.get_or_create(
                    user=self.vendor_users[i],
                    defaults={
                        **data,
                        'status': 'approved',
                        'business_phone': f'+1555{random.randint(1000000, 9999999)}',
                        'postal_code': f'{random.randint(10000, 99999)}',
                    }
                )
                if created:
                    self.stdout.write(f'   Created vendor: {vendor.store_name}')
                self.vendors.append(vendor)

        self.stdout.write(self.style.SUCCESS(f'   Vendors created!'))

    def seed_categories(self):
        """Create product categories."""
        self.stdout.write('📁 Creating categories...')

        categories_data = [
            {
                'name': 'Electronics',
                'slug': 'electronics',
                'description': 'Smartphones, laptops, tablets, and other electronic devices',
                'order': 1,
                'subcategories': [
                    {'name': 'Smartphones', 'slug': 'smartphones', 'description': 'Mobile phones and accessories'},
                    {'name': 'Laptops', 'slug': 'laptops', 'description': 'Notebooks and laptops'},
                    {'name': 'Audio', 'slug': 'audio', 'description': 'Headphones, speakers, and audio equipment'},
                    {'name': 'Accessories', 'slug': 'electronics-accessories', 'description': 'Cables, chargers, and more'},
                ]
            },
            {
                'name': 'Fashion',
                'slug': 'fashion',
                'description': 'Clothing, shoes, and accessories for all styles',
                'order': 2,
                'subcategories': [
                    {'name': 'Men\'s Clothing', 'slug': 'mens-clothing', 'description': 'Shirts, pants, suits, and more'},
                    {'name': 'Women\'s Clothing', 'slug': 'womens-clothing', 'description': 'Dresses, tops, and more'},
                    {'name': 'Shoes', 'slug': 'shoes', 'description': 'Footwear for all occasions'},
                    {'name': 'Bags & Accessories', 'slug': 'bags-accessories', 'description': 'Handbags, watches, jewelry'},
                ]
            },
            {
                'name': 'Home & Garden',
                'slug': 'home-garden',
                'description': 'Furniture, decor, and outdoor living essentials',
                'order': 3,
                'subcategories': [
                    {'name': 'Furniture', 'slug': 'furniture', 'description': 'Living room, bedroom, and office furniture'},
                    {'name': 'Kitchen', 'slug': 'kitchen', 'description': 'Cookware and kitchen appliances'},
                    {'name': 'Decor', 'slug': 'decor', 'description': 'Wall art, lighting, and decorative items'},
                    {'name': 'Garden', 'slug': 'garden', 'description': 'Outdoor furniture and gardening tools'},
                ]
            },
            {
                'name': 'Sports & Outdoors',
                'slug': 'sports-outdoors',
                'description': 'Equipment and gear for active lifestyles',
                'order': 4,
                'subcategories': [
                    {'name': 'Fitness', 'slug': 'fitness', 'description': 'Gym equipment and workout gear'},
                    {'name': 'Outdoor Recreation', 'slug': 'outdoor-recreation', 'description': 'Camping and hiking gear'},
                    {'name': 'Team Sports', 'slug': 'team-sports', 'description': 'Equipment for team sports'},
                    {'name': 'Sportswear', 'slug': 'sportswear', 'description': 'Athletic clothing and footwear'},
                ]
            },
            {
                'name': 'Books & Media',
                'slug': 'books-media',
                'description': 'Books, music, movies, and games',
                'order': 5,
                'subcategories': [
                    {'name': 'Fiction', 'slug': 'fiction', 'description': 'Novels and literary fiction'},
                    {'name': 'Non-Fiction', 'slug': 'non-fiction', 'description': 'Biography, history, and more'},
                    {'name': 'Educational', 'slug': 'educational', 'description': 'Textbooks and learning materials'},
                ]
            },
            {
                'name': 'Beauty & Health',
                'slug': 'beauty-health',
                'description': 'Skincare, makeup, and wellness products',
                'order': 6,
                'subcategories': [
                    {'name': 'Skincare', 'slug': 'skincare', 'description': 'Face and body care products'},
                    {'name': 'Makeup', 'slug': 'makeup', 'description': 'Cosmetics and beauty tools'},
                    {'name': 'Wellness', 'slug': 'wellness', 'description': 'Vitamins and supplements'},
                ]
            },
        ]

        self.categories = {}
        for cat_data in categories_data:
            subcats = cat_data.pop('subcategories', [])
            
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults=cat_data
            )
            if created:
                self.stdout.write(f'   Created category: {category.name}')
            
            self.categories[category.slug] = category

            for subcat_data in subcats:
                subcat, created = Category.objects.get_or_create(
                    slug=subcat_data['slug'],
                    defaults={
                        **subcat_data,
                        'parent': category,
                    }
                )
                if created:
                    self.stdout.write(f'   Created subcategory: {subcat.name}')
                self.categories[subcat.slug] = subcat

        self.stdout.write(self.style.SUCCESS(f'   Categories created!'))

    def seed_products(self):
        """Create sample products."""
        self.stdout.write('📦 Creating products...')

        if not hasattr(self, 'vendors') or not self.vendors:
            self.vendors = list(Vendor.objects.filter(status='approved'))
        
        if not hasattr(self, 'categories') or not self.categories:
            self.categories = {cat.slug: cat for cat in Category.objects.all()}

        if not self.vendors:
            self.stdout.write(self.style.ERROR('   No vendors found! Run with --users first.'))
            return

        products_data = [
            # Electronics - TechZone
            {
                'name': 'iPhone 15 Pro Max',
                'category_slug': 'smartphones',
                'vendor_index': 0,
                'price': Decimal('1199.99'),
                'compare_price': Decimal('1299.99'),
                'stock': 50,
                'description': 'The most powerful iPhone ever. Features the A17 Pro chip, titanium design, and the most advanced camera system on iPhone.',
                'short_description': 'Latest iPhone with A17 Pro chip and titanium design',
                'is_featured': True,
            },
            {
                'name': 'Samsung Galaxy S24 Ultra',
                'category_slug': 'smartphones',
                'vendor_index': 0,
                'price': Decimal('1099.99'),
                'compare_price': Decimal('1199.99'),
                'stock': 45,
                'description': 'Galaxy AI is here. Search like never before, icons effortlessly translate, connect easily, create stunning edits, and Icons.',
                'short_description': 'Samsung flagship with Galaxy AI features',
                'is_featured': True,
            },
            {
                'name': 'MacBook Pro 16" M3 Max',
                'category_slug': 'laptops',
                'vendor_index': 0,
                'price': Decimal('3499.99'),
                'compare_price': Decimal('3699.99'),
                'stock': 25,
                'description': 'The most powerful MacBook Pro ever. With M3 Max chip, up to 128GB unified memory, and stunning Liquid Retina XDR display.',
                'short_description': 'Professional laptop with M3 Max chip',
                'is_featured': True,
            },
            {
                'name': 'Sony WH-1000XM5 Headphones',
                'category_slug': 'audio',
                'vendor_index': 0,
                'price': Decimal('349.99'),
                'compare_price': Decimal('399.99'),
                'stock': 100,
                'description': 'Industry-leading noise cancellation with Auto NC Optimizer. Exceptional sound quality with LDAC. 30-hour battery life.',
                'short_description': 'Premium wireless noise-canceling headphones',
                'is_featured': False,
            },
            {
                'name': 'Apple AirPods Pro 2',
                'category_slug': 'audio',
                'vendor_index': 0,
                'price': Decimal('249.99'),
                'stock': 150,
                'description': 'Rebuilt from the sound up. Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio.',
                'short_description': 'Apple earbuds with adaptive audio',
                'is_featured': False,
            },
            {
                'name': 'USB-C Fast Charger 100W',
                'category_slug': 'electronics-accessories',
                'vendor_index': 0,
                'price': Decimal('49.99'),
                'compare_price': Decimal('69.99'),
                'stock': 200,
                'description': 'Universal 100W USB-C charger compatible with laptops, tablets, and phones. GaN technology for compact design.',
                'short_description': 'Compact 100W GaN charger',
                'is_featured': False,
            },

            # Fashion - Fashion Forward
            {
                'name': 'Classic Fit Oxford Shirt',
                'category_slug': 'mens-clothing',
                'vendor_index': 1,
                'price': Decimal('79.99'),
                'compare_price': Decimal('99.99'),
                'stock': 80,
                'description': 'Timeless oxford shirt crafted from premium cotton. Perfect for office or casual wear. Available in multiple colors.',
                'short_description': 'Premium cotton oxford shirt',
                'is_featured': True,
            },
            {
                'name': 'Slim Fit Chino Pants',
                'category_slug': 'mens-clothing',
                'vendor_index': 1,
                'price': Decimal('69.99'),
                'stock': 120,
                'description': 'Modern slim fit chinos in stretch cotton twill. Comfortable all-day wear with a polished look.',
                'short_description': 'Comfortable stretch chinos',
                'is_featured': False,
            },
            {
                'name': 'Floral Midi Dress',
                'category_slug': 'womens-clothing',
                'vendor_index': 1,
                'price': Decimal('129.99'),
                'compare_price': Decimal('159.99'),
                'stock': 60,
                'description': 'Beautiful floral print midi dress with flattering A-line silhouette. Perfect for spring and summer occasions.',
                'short_description': 'Elegant floral midi dress',
                'is_featured': True,
            },
            {
                'name': 'Cashmere Blend Sweater',
                'category_slug': 'womens-clothing',
                'vendor_index': 1,
                'price': Decimal('149.99'),
                'stock': 45,
                'description': 'Luxuriously soft cashmere blend sweater. Classic crew neck style with ribbed trim. Machine washable.',
                'short_description': 'Soft cashmere blend sweater',
                'is_featured': False,
            },
            {
                'name': 'Leather Chelsea Boots',
                'category_slug': 'shoes',
                'vendor_index': 1,
                'price': Decimal('199.99'),
                'compare_price': Decimal('249.99'),
                'stock': 40,
                'description': 'Handcrafted leather Chelsea boots with elastic side panels. Durable rubber sole for all-day comfort.',
                'short_description': 'Classic leather Chelsea boots',
                'is_featured': True,
            },
            {
                'name': 'Designer Leather Handbag',
                'category_slug': 'bags-accessories',
                'vendor_index': 1,
                'price': Decimal('299.99'),
                'compare_price': Decimal('399.99'),
                'stock': 30,
                'description': 'Sophisticated leather handbag with multiple compartments. Gold-tone hardware and adjustable strap.',
                'short_description': 'Elegant leather handbag',
                'is_featured': True,
            },

            # Home & Living
            {
                'name': 'Modern Sectional Sofa',
                'category_slug': 'furniture',
                'vendor_index': 2,
                'price': Decimal('1499.99'),
                'compare_price': Decimal('1899.99'),
                'stock': 10,
                'description': 'Contemporary L-shaped sectional sofa with premium fabric upholstery. Includes reversible chaise and throw pillows.',
                'short_description': 'L-shaped sectional sofa',
                'is_featured': True,
            },
            {
                'name': 'Ergonomic Office Chair',
                'category_slug': 'furniture',
                'vendor_index': 2,
                'price': Decimal('449.99'),
                'compare_price': Decimal('549.99'),
                'stock': 35,
                'description': 'Fully adjustable ergonomic chair with lumbar support, breathable mesh back, and 4D armrests.',
                'short_description': 'Ergonomic mesh office chair',
                'is_featured': True,
            },
            {
                'name': 'Cast Iron Dutch Oven',
                'category_slug': 'kitchen',
                'vendor_index': 2,
                'price': Decimal('89.99'),
                'stock': 75,
                'description': 'Classic 6-quart enameled cast iron Dutch oven. Perfect for braising, baking, and slow cooking.',
                'short_description': 'Enameled cast iron cookware',
                'is_featured': False,
            },
            {
                'name': 'Minimalist Wall Clock',
                'category_slug': 'decor',
                'vendor_index': 2,
                'price': Decimal('59.99'),
                'stock': 100,
                'description': 'Scandinavian-inspired wall clock with silent quartz movement. 12-inch diameter with natural wood frame.',
                'short_description': 'Silent wooden wall clock',
                'is_featured': False,
            },

            # Sports Elite
            {
                'name': 'Premium Yoga Mat',
                'category_slug': 'fitness',
                'vendor_index': 3,
                'price': Decimal('79.99'),
                'compare_price': Decimal('99.99'),
                'stock': 150,
                'description': 'Extra thick eco-friendly yoga mat with alignment lines. Non-slip surface and carrying strap included.',
                'short_description': 'Eco-friendly non-slip yoga mat',
                'is_featured': True,
            },
            {
                'name': 'Adjustable Dumbbell Set',
                'category_slug': 'fitness',
                'vendor_index': 3,
                'price': Decimal('399.99'),
                'compare_price': Decimal('499.99'),
                'stock': 25,
                'description': 'Space-saving adjustable dumbbells. Quick-change weight from 5 to 52.5 lbs. Replaces 15 sets of weights.',
                'short_description': 'Adjustable 5-52.5 lb dumbbells',
                'is_featured': True,
            },
            {
                'name': '4-Person Camping Tent',
                'category_slug': 'outdoor-recreation',
                'vendor_index': 3,
                'price': Decimal('249.99'),
                'compare_price': Decimal('299.99'),
                'stock': 40,
                'description': 'Waterproof dome tent with easy setup. Features vestibule for gear storage and mesh windows for ventilation.',
                'short_description': 'Waterproof 4-person dome tent',
                'is_featured': False,
            },
            {
                'name': 'Professional Basketball',
                'category_slug': 'team-sports',
                'vendor_index': 3,
                'price': Decimal('49.99'),
                'stock': 200,
                'description': 'Official size and weight composite leather basketball. Superior grip and durability for indoor/outdoor play.',
                'short_description': 'Official size composite basketball',
                'is_featured': False,
            },
            {
                'name': 'Running Shoes Pro',
                'category_slug': 'sportswear',
                'vendor_index': 3,
                'price': Decimal('159.99'),
                'compare_price': Decimal('189.99'),
                'stock': 75,
                'description': 'Lightweight performance running shoes with responsive cushioning. Breathable mesh upper and durable rubber outsole.',
                'short_description': 'Lightweight performance runners',
                'is_featured': True,
            },

            # Books - Book Haven
            {
                'name': 'The Art of Programming',
                'category_slug': 'educational',
                'vendor_index': 4,
                'price': Decimal('49.99'),
                'stock': 100,
                'description': 'Comprehensive guide to software development best practices. Covers algorithms, design patterns, and clean code principles.',
                'short_description': 'Software development guide',
                'is_featured': True,
            },
            {
                'name': 'Mystery at Midnight',
                'category_slug': 'fiction',
                'vendor_index': 4,
                'price': Decimal('16.99'),
                'compare_price': Decimal('24.99'),
                'stock': 150,
                'description': 'Gripping mystery thriller that keeps you guessing until the last page. A bestseller in 15 countries.',
                'short_description': 'Bestselling mystery thriller',
                'is_featured': False,
            },
            {
                'name': 'History of Innovation',
                'category_slug': 'non-fiction',
                'vendor_index': 4,
                'price': Decimal('34.99'),
                'stock': 80,
                'description': 'Fascinating exploration of how innovation shaped our world. From the printing press to artificial intelligence.',
                'short_description': 'Story of human innovation',
                'is_featured': True,
            },
        ]

        for product_data in products_data:
            vendor_index = product_data.pop('vendor_index')
            category_slug = product_data.pop('category_slug')
            
            if vendor_index >= len(self.vendors):
                continue
                
            vendor = self.vendors[vendor_index]
            category = self.categories.get(category_slug)
            
            slug = slugify(product_data['name'])
            
            product, created = Product.objects.get_or_create(
                vendor=vendor,
                slug=slug,
                defaults={
                    **product_data,
                    'category': category,
                    'sku': f'SKU-{vendor.id}-{random.randint(10000, 99999)}',
                }
            )
            
            if created:
                self.stdout.write(f'   Created product: {product.name}')
                
                # Update vendor product count
                vendor.total_products = vendor.products.count()
                vendor.save(update_fields=['total_products'])

        self.stdout.write(self.style.SUCCESS(f'   Products created!'))
        self.stdout.write(self.style.WARNING(
            '\n📝 Note: Product images need to be added manually or through admin panel.'
        ))
        self.stdout.write(self.style.SUCCESS(
            '\n🔑 Login Credentials:'
            '\n   Admin:    admin@example.com / password123'
            '\n   Vendor:   vendor@example.com / password123'
            '\n   Customer: customer@example.com / password123'
        ))
