import { useState, useEffect, useRef } from 'react';
import { useBoardStore, Node, Edge } from '../lib/store';

const mapBackendNode = (node: any): Node => {
  if (node.position && typeof node.position.x === 'number') {
    return node;
  }
  return {
    id: String(node.id),
    type: node.type,
    position: {
      x: node.position_x ?? 0,
      y: node.position_y ?? 0
    },
    data: node.data || {}
  };
};

const mapBackendEdge = (edge: any): Edge => {
  if (edge.source && edge.target) {
    return edge;
  }
  return {
    id: String(edge.id),
    source: String(edge.source_node || edge.source),
    target: String(edge.target_node || edge.target),
    data: edge.data || {}
  };
};

export function useSocket(boardId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { 
    setBoardId, 
    setBoardName,
    setNodes, 
    setEdges, 
    addNode, 
    updateNodePosition, 
    deleteNode,
    addEdge
  } = useBoardStore();

  useEffect(() => {
    if (!boardId) {
      console.log("No boardId provided, skipping WebSocket connection");
      return;
    }
    console.log("Initializing WebSocket connection for boardId:", boardId);
    
    // Connect to WebSocket
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/board/${boardId}/`;
    console.log("Connecting to WebSocket URL:", wsUrl);
    
    try {
      socketRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setIsConnected(false);
      return;
    }

    socketRef.current.onopen = () => {
      console.log('✅ WebSocket connection established successfully');
      setIsConnected(true);
      setBoardId(boardId);
      
      // Send join room message
      if (socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'join_room'
        }));
      }
    };

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSocketMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socketRef.current.onclose = (event) => {
      console.log('❌ WebSocket connection closed:', event.code, event.reason);
      setIsConnected(false);
    };

    socketRef.current.onerror = (error) => {
      console.error('💥 WebSocket error occurred:', error);
      console.log('Current socket state:', socketRef.current?.readyState);
      console.log('WebSocket URL that failed:', wsUrl);
      console.log('Make sure you are running the server with Daphne for WebSocket support');
      setIsConnected(false);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [boardId, setBoardId]);

  const handleSocketMessage = (data: any) => {
    switch (data.type) {
      case 'board_state':
        // Set initial board state
        setNodes((data.nodes || []).map(mapBackendNode));
        setEdges((data.edges || []).map(mapBackendEdge));
        if (data.board && data.board.name) {
          setBoardName(data.board.name);
        } else {
          setBoardName(null);
        }
        break;
      
      case 'node_created':
        addNode(mapBackendNode(data.node));
        break;
      
      case 'node_moved':
        updateNodePosition(data.node_id, data.position);
        break;
      
      case 'node_deleted':
        deleteNode(data.node_id);
        break;
      
      case 'edge_created':
        addEdge(mapBackendEdge(data.edge));
        break;
      
      case 'ai_generated':
        // Handle AI-generated content
        if (data.nodes) {
          data.nodes.forEach((node: any, index: number) => {
            const mappedNode = mapBackendNode(node);
            // Space nodes 250px apart horizontally and 150px vertically in a flow pattern
            const columns = 3;
            const col = index % columns;
            const row = Math.floor(index / columns);
            
            const newPos = {
              x: 50 + col * 250,
              y: 50 + row * 150
            };
            
            mappedNode.position = newPos;
            addNode(mappedNode);
            // Sync with backend
            moveNode(mappedNode.id, newPos);
          });
        }
        if (data.edges) {
          data.edges.forEach((edge: any) => addEdge(mapBackendEdge(edge)));
        }
        setIsGenerating(false);
        break;

      case 'ai_error':
        console.error('AI Generation Error:', data.error);
        setIsGenerating(false);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const drawNode = (nodeData: any) => {
    sendMessage({
      type: 'draw_node',
      node: nodeData
    });
  };

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    sendMessage({
      type: 'move_node',
      node_id: nodeId,
      position: position
    });
  };

  const deleteNodeMessage = (nodeId: string) => {
    sendMessage({
      type: 'delete_node',
      node_id: nodeId
    });
  };

  const drawEdge = (edgeData: any) => {
    sendMessage({
      type: 'draw_edge',
      edge: edgeData
    });
  };

  const generateAI = (prompt: string) => {
    setIsGenerating(true);
    sendMessage({
      type: 'ai_generate',
      prompt: prompt
    });
  };

  return {
    isConnected,
    isGenerating,
    sendMessage,
    drawNode,
    moveNode,
    deleteNodeMessage,
    drawEdge,
    generateAI
  };
}