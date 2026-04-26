import { useState, useEffect, useRef } from 'react';
import { useBoardStore } from '../lib/store';

export function useSocket(boardId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { 
    setBoardId, 
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
    const wsUrl = `ws://localhost:8000/ws/board/${boardId}/`;
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
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        break;
      
      case 'node_created':
        addNode(data.node);
        break;
      
      case 'node_moved':
        updateNodePosition(data.node_id, data.position);
        break;
      
      case 'node_deleted':
        deleteNode(data.node_id);
        break;
      
      case 'edge_created':
        addEdge(data.edge);
        break;
      
      case 'ai_generated':
        // Handle AI-generated content
        if (data.nodes) {
          data.nodes.forEach((node: any) => addNode(node));
        }
        if (data.edges) {
          data.edges.forEach((edge: any) => addEdge(edge));
        }
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
    sendMessage({
      type: 'ai_generate',
      prompt: prompt
    });
  };

  return {
    isConnected,
    sendMessage,
    drawNode,
    moveNode,
    deleteNodeMessage,
    drawEdge,
    generateAI
  };
}