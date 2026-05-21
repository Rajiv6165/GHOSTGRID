import json
import logging
from django.core.serializers.json import DjangoJSONEncoder
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ValidationError
from .models import Board, Node, Edge
from .serializers import NodeSerializer, EdgeSerializer
from .ai_service import AIService

logger = logging.getLogger(__name__)

class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.board_group_name = f'board_{self.board_id}'
        
        logger.info(f"WebSocket connection attempt for board: {self.board_id}")
        
        # Join board group
        await self.channel_layer.group_add(
            self.board_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connection accepted for board: {self.board_id}")
        
        # Send current board state to the newly connected client
        await self.send_board_state()
    
    async def disconnect(self, close_code):
        # Leave board group
        await self.channel_layer.group_discard(
            self.board_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')
        
        if event_type == 'join_room':
            await self.handle_join_room(data)
        elif event_type == 'draw_node':
            await self.handle_draw_node(data)
        elif event_type == 'move_node':
            await self.handle_move_node(data)
        elif event_type == 'delete_node':
            await self.handle_delete_node(data)
        elif event_type == 'ai_generate':
            await self.handle_ai_generate(data)
        elif event_type == 'draw_edge':
            await self.handle_draw_edge(data)
    
    async def handle_join_room(self, data):
        # Client joined the room - send current state
        await self.send_board_state()
    
    async def handle_draw_node(self, data):
        # Create node in database
        node_data = data.get('node', {})
        node = await self.create_node(node_data)
        
        # Broadcast to all clients in the group
        await self.channel_layer.group_send(
            self.board_group_name,
            {
                'type': 'node_created',
                'node': self.to_primitives(NodeSerializer(node).data)
            }
        )
    
    async def handle_move_node(self, data):
        # Update node position in database
        node_id = data.get('node_id')
        position = data.get('position', {})
        
        await self.update_node_position(node_id, position.get('x', 0), position.get('y', 0))
        
        # Broadcast position update
        await self.channel_layer.group_send(
            self.board_group_name,
            {
                'type': 'node_moved',
                'node_id': node_id,
                'position': position
            }
        )
    
    async def handle_delete_node(self, data):
        # Delete node from database
        node_id = data.get('node_id')
        await self.delete_node(node_id)
        
        # Broadcast deletion
        await self.channel_layer.group_send(
            self.board_group_name,
            {
                'type': 'node_deleted',
                'node_id': node_id
            }
        )
    
    async def handle_draw_edge(self, data):
        # Create edge in database
        edge_data = data.get('edge', {})
        edge = await self.create_edge(edge_data)
        
        # Broadcast to all clients
        await self.channel_layer.group_send(
            self.board_group_name,
            {
                'type': 'edge_created',
                'edge': self.to_primitives(EdgeSerializer(edge).data)
            }
        )
    
    async def handle_ai_generate(self, data):
        # Generate architecture using AI
        prompt = data.get('prompt', '')
        ai_service = AIService()
        
        try:
            ai_result = ai_service.generate_system_architecture(prompt)
            
            # Create nodes and edges in database with mapped IDs
            created_nodes = []
            created_edges = []
            ai_id_to_db_id = {}
            
            for node_data in ai_result.get('nodes', []):
                orig_id = node_data.get('id')
                node = await self.create_ai_node(node_data)
                serialized_node = NodeSerializer(node).data
                created_nodes.append(serialized_node)
                if orig_id:
                    ai_id_to_db_id[str(orig_id)] = str(serialized_node.get('id'))
            
            for edge_data in ai_result.get('edges', []):
                orig_source = str(edge_data.get('source', ''))
                orig_target = str(edge_data.get('target', ''))
                
                db_source = ai_id_to_db_id.get(orig_source)
                db_target = ai_id_to_db_id.get(orig_target)
                
                if db_source and db_target:
                    edge_data['source'] = db_source
                    edge_data['target'] = db_target
                    edge = await self.create_ai_edge(edge_data)
                    created_edges.append(EdgeSerializer(edge).data)
                else:
                    logger.warning(f"Could not map AI edge source/target: {orig_source} -> {orig_target}")
            
            # Broadcast AI-generated content
            await self.channel_layer.group_send(
                self.board_group_name,
                {
                    'type': 'ai_generated',
                    'nodes': self.to_primitives(created_nodes),
                    'edges': self.to_primitives(created_edges)
                }
            )
            
        except Exception as e:
            # Handle AI generation errors
            logger.error(f"Error in handle_ai_generate: {e}", exc_info=True)
            await self.send_json({
                'type': 'ai_error',
                'error': str(e)
            })
            
    def to_primitives(self, data):
        return json.loads(json.dumps(data, cls=DjangoJSONEncoder))

    async def send_json(self, data):
        await self.send(text_data=json.dumps(data, cls=DjangoJSONEncoder))
    
    # Event handlers for broadcasting
    async def node_created(self, event):
        await self.send_json({
            'type': 'node_created',
            'node': event['node']
        })
    
    async def node_moved(self, event):
        await self.send_json({
            'type': 'node_moved',
            'node_id': event['node_id'],
            'position': event['position']
        })
    
    async def node_deleted(self, event):
        await self.send_json({
            'type': 'node_deleted',
            'node_id': event['node_id']
        })
    
    async def edge_created(self, event):
        await self.send_json({
            'type': 'edge_created',
            'edge': event['edge']
        })
    
    async def ai_generated(self, event):
        await self.send_json({
            'type': 'ai_generated',
            'nodes': event['nodes'],
            'edges': event['edges']
        })
    
    # Database operations (async)
    @database_sync_to_async
    def create_node(self, node_data):
        board = Board.objects.get(id=self.board_id)
        position = node_data.get('position', {})
        pos_x = node_data.get('position_x')
        pos_y = node_data.get('position_y')
        if pos_x is None:
            pos_x = position.get('x', 0)
        if pos_y is None:
            pos_y = position.get('y', 0)
        return Node.objects.create(
            board=board,
            type=node_data.get('type', 'service'),
            data=node_data.get('data', {}),
            position_x=pos_x,
            position_y=pos_y
        )
    
    @database_sync_to_async
    def create_ai_node(self, node_data):
        board = Board.objects.get(id=self.board_id)
        position = node_data.get('position', {'x': 0, 'y': 0})
        return Node.objects.create(
            board=board,
            type=node_data.get('type', 'service'),
            data=node_data.get('data', {}),
            position_x=position.get('x', 0),
            position_y=position.get('y', 0)
        )
    
    @database_sync_to_async
    def update_node_position(self, node_id, x, y):
        Node.objects.filter(id=node_id).update(position_x=x, position_y=y)
    
    @database_sync_to_async
    def delete_node(self, node_id):
        Node.objects.filter(id=node_id).delete()
    
    @database_sync_to_async
    def create_edge(self, edge_data):
        board = Board.objects.get(id=self.board_id)
        source_id = edge_data.get('source_node') or edge_data.get('source')
        target_id = edge_data.get('target_node') or edge_data.get('target')
        return Edge.objects.create(
            board=board,
            source_node_id=source_id,
            target_node_id=target_id,
            data=edge_data.get('data', {})
        )
    
    @database_sync_to_async
    def create_ai_edge(self, edge_data):
        board = Board.objects.get(id=self.board_id)
        return Edge.objects.create(
            board=board,
            source_node_id=edge_data.get('source'),
            target_node_id=edge_data.get('target'),
            data=edge_data.get('data', {})
        )
    
    @database_sync_to_async
    def get_board_data(self):
        board = Board.objects.get(id=self.board_id)
        nodes = Node.objects.filter(board=board)
        edges = Edge.objects.filter(board=board)
        logger.info(f"Found board {board.id} with {nodes.count()} nodes and {edges.count()} edges")
        return {
            'board': {
                'id': str(board.id),
                'name': board.name
            },
            'nodes': NodeSerializer(nodes, many=True).data,
            'edges': EdgeSerializer(edges, many=True).data
        }

    async def send_board_state(self):
        """Send current board state to the connected client"""
        logger.info(f"Attempting to send board state for board: {self.board_id}")
        try:
            board_data = await self.get_board_data()
            await self.send_json({
                'type': 'board_state',
                'board': board_data['board'],
                'nodes': board_data['nodes'],
                'edges': board_data['edges']
            })
        except Board.DoesNotExist:
            # Board doesn't exist yet, send empty state
            logger.info(f"Board {self.board_id} not found, sending empty state")
            await self.send_json({
                'type': 'board_state',
                'board': None,
                'nodes': [],
                'edges': [],
                'message': 'Board not found, starting with empty state'
            })
        except ValidationError as e:
            # Handle UUID validation errors for non-UUID board IDs
            logger.warning(f"Invalid board ID format: {self.board_id}, sending empty state")
            await self.send_json({
                'type': 'board_state',
                'board': None,
                'nodes': [],
                'edges': [],
                'message': 'Invalid board ID format, starting with empty state'
            })