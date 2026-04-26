import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  data?: {
    label?: string;
    description?: string;
  };
}

export interface BoardState {
  boardId: string | null;
  nodes: Node[];
  edges: Edge[];
  // Actions
  setBoardId: (id: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (id: string) => void;
  resetBoard: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  nodes: [],
  edges: [],
  
  setBoardId: (id) => set({ boardId: id }),
  
  setNodes: (nodes) => set({ nodes }),
  
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  
  updateNodePosition: (id, position) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, position } : node
    )
  })),
  
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    edges: state.edges.filter(edge => edge.source !== id && edge.target !== id)
  })),
  
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),
  
  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter(edge => edge.id !== id)
  })),
  
  resetBoard: () => set({
    boardId: null,
    nodes: [],
    edges: []
  })
}));