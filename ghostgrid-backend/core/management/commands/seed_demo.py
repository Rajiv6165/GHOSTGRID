from django.core.management.base import BaseCommand
from core.models import Board, Node, Edge
import uuid


class Command(BaseCommand):
    help = 'Seed the database with demo board and architecture diagram'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if demo board exists',
        )

    def handle(self, *args, **options):
        # Check if demo board already exists
        demo_board, created = Board.objects.get_or_create(
            name='Welcome to GhostGrid!',
            defaults={'name': 'Welcome to GhostGrid!'}
        )
        
        if not created and not options['force']:
            self.stdout.write(
                self.style.WARNING(
                    'Demo board already exists. Use --force to recreate.'
                )
            )
            return
        
        # Clear existing nodes and edges if board already existed
        if not created:
            Node.objects.filter(board=demo_board).delete()
            Edge.objects.filter(board=demo_board).delete()
        
        # Create demo nodes for Microservices Architecture
        nodes_data = [
            {
                'type': 'frontend',
                'position_x': 150,
                'position_y': 100,
                'data': {
                    'label': 'Client App',
                    'description': 'React/Vue frontend application'
                }
            },
            {
                'type': 'api',
                'position_x': 400,
                'position_y': 100,
                'data': {
                    'label': 'API Gateway',
                    'description': 'Traffic routing and authentication'
                }
            },
            {
                'type': 'service',
                'position_x': 400,
                'position_y': 250,
                'data': {
                    'label': 'User Service',
                    'description': 'Handles user authentication and profiles'
                }
            },
            {
                'type': 'service',
                'position_x': 650,
                'position_y': 100,
                'data': {
                    'label': 'Order Service',
                    'description': 'Manages orders and transactions'
                }
            },
            {
                'type': 'database',
                'position_x': 650,
                'position_y': 250,
                'data': {
                    'label': 'User DB',
                    'description': 'Stores user information'
                }
            },
            {
                'type': 'database',
                'position_x': 900,
                'position_y': 100,
                'data': {
                    'label': 'Order DB',
                    'description': 'Stores order information'
                }
            },
            {
                'type': 'cache',
                'position_x': 400,
                'position_y': 400,
                'data': {
                    'label': 'Redis Cache',
                    'description': 'Session and temporary data cache'
                }
            },
            {
                'type': 'queue',
                'position_x': 650,
                'position_y': 400,
                'data': {
                    'label': 'Message Queue',
                    'description': 'Handles async tasks and events'
                }
            }
        ]

        # Create nodes
        nodes = []
        for node_data in nodes_data:
            node = Node.objects.create(
                board=demo_board,
                type=node_data['type'],
                position_x=node_data['position_x'],
                position_y=node_data['position_y'],
                data=node_data['data']
            )
            nodes.append(node)

        # Create edges representing connections
        edges_data = [
            {
                'source_node': nodes[0],  # Client App
                'target_node': nodes[1],  # API Gateway
                'data': {
                    'label': 'HTTP Requests',
                    'description': 'API calls from client to gateway'
                }
            },
            {
                'source_node': nodes[1],  # API Gateway
                'target_node': nodes[2],  # User Service
                'data': {
                    'label': 'Service Call',
                    'description': 'Authentication requests'
                }
            },
            {
                'source_node': nodes[1],  # API Gateway
                'target_node': nodes[3],  # Order Service
                'data': {
                    'label': 'Service Call',
                    'description': 'Order processing requests'
                }
            },
            {
                'source_node': nodes[2],  # User Service
                'target_node': nodes[4],  # User DB
                'data': {
                    'label': 'DB Query',
                    'description': 'Database operations for users'
                }
            },
            {
                'source_node': nodes[3],  # Order Service
                'target_node': nodes[5],  # Order DB
                'data': {
                    'label': 'DB Query',
                    'description': 'Database operations for orders'
                }
            },
            {
                'source_node': nodes[2],  # User Service
                'target_node': nodes[6],  # Redis Cache
                'data': {
                    'label': 'Cache Ops',
                    'description': 'Session and user data caching'
                }
            },
            {
                'source_node': nodes[3],  # Order Service
                'target_node': nodes[7],  # Message Queue
                'data': {
                    'label': 'Async Task',
                    'description': 'Process orders asynchronously'
                }
            }
        ]

        # Create edges
        for edge_data in edges_data:
            Edge.objects.create(
                board=demo_board,
                source_node=edge_data['source_node'],
                target_node=edge_data['target_node'],
                data=edge_data['data']
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created demo board "{demo_board.name}" with '
                f'{len(nodes)} nodes and {len(edges_data)} edges!'
            )
        )
        
        self.stdout.write(
            self.style.NOTICE(
                f'Board ID: {demo_board.id}\n'
                f'You can access this board at: http://localhost:3000/board/{demo_board.id}'
            )
        )