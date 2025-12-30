"""
Management command to approve pending vendors.
Usage: python manage.py approve_vendors [--all] [--email EMAIL]
"""

from django.core.management.base import BaseCommand
from vendors.models import Vendor


class Command(BaseCommand):
    help = 'Approve pending vendor applications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Approve all pending vendors',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Approve vendor by user email',
        )
        parser.add_argument(
            '--list',
            action='store_true',
            help='List all vendors and their status',
        )

    def handle(self, *args, **options):
        if options['list']:
            vendors = Vendor.objects.all()
            if not vendors.exists():
                self.stdout.write(self.style.WARNING('No vendors found.'))
                return
            
            self.stdout.write('\nVendor List:')
            self.stdout.write('-' * 60)
            for v in vendors:
                status_style = self.style.SUCCESS if v.status == 'approved' else self.style.WARNING
                self.stdout.write(
                    f"ID: {v.id} | {v.store_name} | {status_style(v.status)} | {v.user.email}"
                )
            return
        
        if options['all']:
            pending_vendors = Vendor.objects.filter(status='pending')
            count = pending_vendors.count()
            
            if count == 0:
                self.stdout.write(self.style.WARNING('No pending vendors to approve.'))
                return
            
            pending_vendors.update(status='approved')
            self.stdout.write(self.style.SUCCESS(f'Successfully approved {count} vendor(s).'))
            return
        
        if options['email']:
            try:
                vendor = Vendor.objects.get(user__email=options['email'])
                if vendor.status == 'approved':
                    self.stdout.write(self.style.WARNING(f"Vendor '{vendor.store_name}' is already approved."))
                    return
                
                vendor.status = 'approved'
                vendor.save(update_fields=['status'])
                self.stdout.write(self.style.SUCCESS(f"Successfully approved vendor '{vendor.store_name}'."))
            except Vendor.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"No vendor found with email '{options['email']}'."))
            return
        
        # Default: show help
        self.stdout.write('Usage:')
        self.stdout.write('  python manage.py approve_vendors --list')
        self.stdout.write('  python manage.py approve_vendors --all')
        self.stdout.write('  python manage.py approve_vendors --email user@example.com')
