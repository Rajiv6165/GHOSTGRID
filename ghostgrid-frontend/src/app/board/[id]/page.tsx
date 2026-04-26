'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBoardStore } from '../../../lib/store';
import { useSocket } from '../../../hooks/useSocket';
import { CyberpunkCard } from '../../../components/CyberpunkCard';
import { TerminalInput } from '../../../components/TerminalInput';

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { nodes, edges, addNode, updateNodePosition, deleteNode } = useBoardStore();
  const { isConnected, drawNode, moveNode, deleteNodeMessage, generateAI } = useSocket(boardId);
  const [command, setCommand] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Handle keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandSubmit = (cmd: string) => {
    if (cmd.startsWith('design ')) {
      const prompt = cmd.replace('design ', '');
      generateAI(prompt);
    } else if (cmd.startsWith('add ')) {
      const nodeType = cmd.replace('add ', '');
      const newNode = {
        id: Date.now().toString(),
        type: nodeType,
        position: { x: Math.random() * 600, y: Math.random() * 400 },
        data: { label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1) }
      };
      addNode(newNode);
      drawNode(newNode);
    }
    setShowCommandPalette(false);
  };

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    updateNodePosition(nodeId, { x, y });
    moveNode(nodeId, { x, y });
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-green p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-cyber-green">
          GHOSTGRID - Board: {boardId}
        </h1>
        <div className="flex gap-4">
          <div className={`px-3 py-1 rounded ${isConnected ? 'bg-cyber-green text-cyber-dark' : 'bg-cyber-red text-white'}`}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="px-4 py-2 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-cyber-dark transition-colors"
          >
            Cmd+K
          </button>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CyberpunkCard className="mb-6">
          <h2 className="text-cyber-blue mb-4">Command Palette</h2>
          <TerminalInput
            value={command}
            onChange={setCommand}
            onEnter={handleCommandSubmit}
            placeholder="design a netflix clone"
          />
          <div className="mt-4 text-sm text-cyber-gray">
            <p>Commands:</p>
            <p>- design [prompt]: Generate architecture with AI</p>
            <p>- add [type]: Add node (service, database, etc.)</p>
          </div>
        </CyberpunkCard>
      )}

      {/* Board Canvas */}
      <CyberpunkCard className="h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute cyber-card p-3 cursor-move min-w-[120px] text-center"
            style={{
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
            }}
            draggable
            onDragEnd={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                handleNodeDrag(node.id, x, y);
              }
            }}
          >
            <div className="font-bold text-cyber-green">{node.data.label}</div>
            <div className="text-xs text-cyber-blue mt-1">{node.type}</div>
          </div>
        ))}

        {/* Edges (simplified lines) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (sourceNode && targetNode) {
              return (
                <line
                  key={edge.id}
                  x1={sourceNode.position.x + 60}
                  y1={sourceNode.position.y + 30}
                  x2={targetNode.position.x + 60}
                  y2={targetNode.position.y + 30}
                  stroke="#00ff41"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              );
            }
            return null;
          })}
        </svg>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">👻</div>
              <p className="text-cyber-blue mb-2">No nodes yet</p>
              <p className="text-sm text-cyber-gray">
                Press Cmd+K to open command palette
              </p>
            </div>
          </div>
        )}
      </CyberpunkCard>

      {/* Node list */}
      {nodes.length > 0 && (
        <CyberpunkCard className="mt-6">
          <h2 className="text-cyber-blue mb-4">Nodes ({nodes.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div key={node.id} className="cyber-card p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-cyber-green">{node.data.label}</div>
                    <div className="text-sm text-cyber-blue">{node.type}</div>
                    <div className="text-xs text-cyber-gray mt-1">
                      ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      deleteNode(node.id);
                      deleteNodeMessage(node.id);
                    }}
                    className="text-cyber-red hover:text-red-300"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CyberpunkCard>
      )}
    </div>
  );
}