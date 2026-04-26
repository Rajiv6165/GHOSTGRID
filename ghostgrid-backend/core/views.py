from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Board, Node, Edge
from .serializers import BoardSerializer, NodeSerializer, EdgeSerializer


class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    
    @action(detail=True, methods=['get'])
    def full_state(self, request, pk=None):
        """Get complete board state including nodes and edges"""
        board = self.get_object()
        nodes = Node.objects.filter(board=board)
        edges = Edge.objects.filter(board=board)
        
        return Response({
            'board': BoardSerializer(board).data,
            'nodes': NodeSerializer(nodes, many=True).data,
            'edges': EdgeSerializer(edges, many=True).data
        })


class NodeViewSet(viewsets.ModelViewSet):
    queryset = Node.objects.all()
    serializer_class = NodeSerializer
    
    def get_queryset(self):
        board_id = self.request.query_params.get('board_id')
        if board_id:
            return Node.objects.filter(board_id=board_id)
        return Node.objects.all()


class EdgeViewSet(viewsets.ModelViewSet):
    queryset = Edge.objects.all()
    serializer_class = EdgeSerializer
    
    def get_queryset(self):
        board_id = self.request.query_params.get('board_id')
        if board_id:
            return Edge.objects.filter(board_id=board_id)
        return Edge.objects.all()