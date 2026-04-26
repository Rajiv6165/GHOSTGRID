from django.core.management.base import BaseCommand
from django.conf import settings
import os

class Command(BaseCommand):
    help = 'Run Daphne server for WebSocket support'

    def handle(self, *args, **options):
        # Ensure Django settings are configured
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ghostgrid.settings')
        
        # Import here to ensure Django is properly configured
        from daphne.server import Server
        from ghostgrid.asgi import application
        
        self.stdout.write(
            self.style.SUCCESS('Starting Daphne server with WebSocket support...')
        )
        self.stdout.write(
            self.style.NOTICE('Server will be available at: http://127.0.0.1:8000')
        )
        self.stdout.write(
            self.style.NOTICE('WebSocket endpoint: ws://127.0.0.1:8000/ws/')
        )
        self.stdout.write(
            self.style.NOTICE('Press CTRL+C to stop the server')
        )
        self.stdout.write('=' * 40)
        
        server = Server(
            application=application,
            endpoints=['tcp:port=8000:interface=127.0.0.1'],
            signal_handlers=True,
            http_timeout=60,
            websocket_timeout=86400,
            websocket_connect_timeout=20,
            ping_interval=20,
            ping_timeout=30,
            root_path='',
            verbosity=1,
        )
        
        try:
            server.run()
        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING('Server stopped by user')
            )