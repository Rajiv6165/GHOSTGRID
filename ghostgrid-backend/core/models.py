import uuid
from django.db import models


class Board(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Node(models.Model):
    NODE_TYPES = [
        ('service', 'Service'),
        ('database', 'Database'),
        ('queue', 'Queue'),
        ('cache', 'Cache'),
        ('api', 'API'),
        ('frontend', 'Frontend'),
        ('load_balancer', 'Load Balancer'),
        ('cdn', 'CDN'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='nodes')
    type = models.CharField(max_length=50, choices=NODE_TYPES)
    data = models.JSONField(default=dict)  # Flexible data storage for node properties
    position_x = models.FloatField(default=0.0)
    position_y = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.type} node on {self.board.name}"


class Edge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='edges')
    source_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='incoming_edges')
    data = models.JSONField(default=dict)  # Edge properties like labels, styles
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Edge from {self.source_node.type} to {self.target_node.type} on {self.board.name}"
