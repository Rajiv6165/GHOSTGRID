from rest_framework import serializers
from .models import Board, Node, Edge


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = ['id', 'board', 'type', 'data', 'position_x', 'position_y', 'created_at']
        read_only_fields = ['id', 'created_at']


class EdgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edge
        fields = ['id', 'board', 'source_node', 'target_node', 'data', 'created_at']
        read_only_fields = ['id', 'created_at']