'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useBoardStore } from '../../../lib/store';
import { useSocket } from '../../../hooks/useSocket';
import { CyberpunkCard } from '../../../components/CyberpunkCard';
import { TerminalInput } from '../../../components/TerminalInput';

const getAccentColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'service': return '#00ff41'; // green
    case 'database': return '#00bfff'; // blue
    case 'api': return '#ffff00'; // yellow
    case 'gateway': return '#9d00ff'; // purple
    case 'cache': return '#ff8c00'; // orange
    case 'queue': return '#ff00ff'; // pink
    default: return '#00ff41'; // default green
  }
};

const getIntersectionPoint = (source: {x: number, y: number}, target: {x: number, y: number}) => {
  const w = 200;
  const h = 80;
  const x1 = source.x + 100;
  const y1 = source.y + 40;
  const x2 = target.x + 100;
  const y2 = target.y + 40;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return { x: x2, y: y2 };
  }
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  let scale = 1;
  if (absDx * (h / 2) > absDy * (w / 2)) {
    // Intersects left/right side
    scale = (w / 2) / absDx;
  } else {
    // Intersects top/bottom side
    scale = (h / 2) / absDy;
  }
  
  const offsetScale = scale - (12 / Math.sqrt(dx * dx + dy * dy));
  const finalScale = Math.max(0, offsetScale);
  
  return {
    x: x2 - dx * finalScale,
    y: y2 - dy * finalScale
  };
};

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { boardName, nodes, edges, addNode, updateNodePosition, deleteNode } = useBoardStore();
  const { isConnected, isGenerating, drawNode, moveNode, deleteNodeMessage, generateAI } = useSocket(boardId);
  const [command, setCommand] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [waitingForAI, setWaitingForAI] = useState(false);

  // Panning & Zooming Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Close command palette when AI finishes generating
  useEffect(() => {
    if (waitingForAI && !isGenerating) {
      setWaitingForAI(false);
      setShowCommandPalette(false);
    }
  }, [isGenerating, waitingForAI]);

  const handleCommandSubmit = (cmd: string) => {
    if (cmd.startsWith('design ')) {
      const prompt = cmd.replace('design ', '');
      generateAI(prompt);
      setWaitingForAI(true);
    } else if (cmd.startsWith('add ')) {
      const nodeType = cmd.replace('add ', '');
      const newNode = {
        id: 'node-' + Date.now(),
        type: nodeType,
        position: { x: 50, y: 50 },
        data: { label: nodeType.charAt(0).toUpperCase() + nodeType.slice(1) }
      };
      addNode(newNode);
      drawNode(newNode);
      setShowCommandPalette(false);
    } else {
      setShowCommandPalette(false);
    }
  };

  const handleNodeDrag = (nodeId: string, x: number, y: number) => {
    updateNodePosition(nodeId, { x, y });
    moveNode(nodeId, { x, y });
  };

  const handleNodeDragEnd = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => {
    const viewport = document.getElementById('canvas-viewport');
    const rect = viewport?.getBoundingClientRect();
    if (rect && e.clientX !== 0 && e.clientY !== 0) {
      // Convert screen coordinates to canvas local coordinates taking pan/zoom into account
      const localX = (e.clientX - rect.left - pan.x) / zoom;
      const localY = (e.clientY - rect.top - pan.y) / zoom;
      
      // Center the node card (200px wide, 80px tall)
      handleNodeDrag(nodeId, Math.round(localX - 100), Math.round(localY - 40));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isBackground = 
      target.id === 'canvas-viewport' || 
      target.id === 'canvas-grid' || 
      target.tagName === 'svg' ||
      target.id === 'canvas-empty-state';
      
    if (!isBackground) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-cyber-green p-4">
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animated-edge {
          stroke-dasharray: 6, 4;
          animation: dash-flow 1.5s linear infinite;
        }
        .bg-grid-cyber {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(0, 255, 65, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 65, 0.04) 1px, transparent 1px);
        }
      `}} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-cyber-green/20 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-cyber-green uppercase tracking-wider font-mono">
            {boardName || 'GHOSTGRID BOARD'}
          </h1>
          <div className="text-xs text-gray-500 font-mono mt-1 flex flex-wrap items-center gap-2">
            <span>ID: <span className="text-cyber-blue select-all">{boardId}</span></span>
            <span className="hidden sm:inline">•</span>
            <span>NODES: <span className="text-cyber-green font-bold">{nodes.length}</span></span>
            <span className="hidden sm:inline">•</span>
            <span>EDGES: <span className="text-cyber-green font-bold">{edges.length}</span></span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className={`px-3 py-1 rounded text-xs font-bold tracking-widest font-mono flex items-center gap-1.5 ${isConnected ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/10 text-cyber-red border border-cyber-red/30'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-cyber-green animate-ping' : 'bg-cyber-red'}`}></span>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="px-4 py-2 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple hover:text-black hover:border-cyber-purple font-mono text-xs font-bold tracking-widest transition-all duration-300"
          >
            COMMAND PALETTE (CTRL+K)
          </button>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CyberpunkCard className="mb-6 relative overflow-hidden">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-cyber-green border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-cyber-green font-bold tracking-widest animate-pulse font-mono">
                AI GENERATING...
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-cyber-blue font-mono font-bold text-lg uppercase tracking-widest">AI ARCHITECT</h2>
                <p className="text-xs text-gray-500 font-mono">Describe your system and I will generate the architecture</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "Design a Netflix clone",
                  "Design an e-commerce platform",
                  "Design a chat application",
                  "Design a social media app",
                  "Design a food delivery app"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCommand(suggestion.toLowerCase())}
                    className="px-3 py-1.5 border border-cyber-blue/30 text-cyber-blue/80 hover:text-cyber-blue hover:border-cyber-blue hover:bg-cyber-blue/10 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <TerminalInput
                value={command}
                onChange={setCommand}
                onEnter={handleCommandSubmit}
                placeholder="What would you like to build today?"
              />
              <div className="mt-4 text-xs text-cyber-gray font-mono">
                <p className="text-gray-500 font-bold mb-1 uppercase tracking-wider">Command Protocols:</p>
                <p className="text-cyber-blue">- design [prompt] <span className="text-gray-600">-- Generate architecture with AI</span></p>
                <p className="text-cyber-blue">- add [type] <span className="text-gray-600">-- Add node (service, database, cache, api, queue, gateway)</span></p>
              </div>
            </>
          )}
        </CyberpunkCard>
      )}

      {/* Board Canvas */}
      <div 
        id="canvas-viewport"
        className="h-[70vh] relative overflow-hidden bg-[#050505] border border-cyber-green/20 rounded-xl cursor-grab active:cursor-grabbing backdrop-blur-md"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Workspace Canvas (Scales and Translates) */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Inner container with actual size */}
          <div className="w-[5000px] h-[5000px] relative pointer-events-auto">
            {/* Grid Background */}
            <div id="canvas-grid" className="absolute inset-0 bg-grid-cyber opacity-15"></div>
            
            {/* SVG Edges */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#00ff41" />
                </marker>
              </defs>
              
              {edges.map((edge) => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (sourceNode && targetNode) {
                  const startX = sourceNode.position.x + 100;
                  const startY = sourceNode.position.y + 40;
                  const endPoint = getIntersectionPoint(sourceNode.position, targetNode.position);
                  return (
                    <g key={edge.id}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endPoint.x}
                        y2={endPoint.y}
                        stroke="#00ff41"
                        strokeWidth="2"
                        markerEnd="url(#arrow)"
                        className="animated-edge"
                      />
                      {edge.data?.label && (
                        <text
                          x={(startX + endPoint.x) / 2}
                          y={(startY + endPoint.y) / 2 - 8}
                          fill="#00ff41"
                          fontSize="9"
                          textAnchor="middle"
                          className="bg-black/80 px-1 font-mono font-bold select-none"
                        >
                          {edge.data.label}
                        </text>
                      )}
                    </g>
                  );
                }
                return null;
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => {
              const accentColor = getAccentColor(node.type);
              return (
                <div
                  key={node.id}
                  className="absolute bg-[#080808]/95 border-2 rounded-lg p-4 cursor-move w-[200px] h-auto text-left shadow-lg select-none pointer-events-auto"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    borderColor: accentColor,
                    boxShadow: `0 0 12px ${accentColor}25, inset 0 0 4px ${accentColor}15`,
                  }}
                  draggable
                  onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-black/40" style={{ color: accentColor }}>
                      {node.type}
                    </span>
                    <button
                      onClick={() => {
                        deleteNode(node.id);
                        deleteNodeMessage(node.id);
                      }}
                      className="text-gray-500 hover:text-cyber-red text-sm leading-none transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <div className="font-bold text-white text-sm break-words">{node.data.label}</div>
                  {node.data.description && (
                    <div className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                      {node.data.description}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {nodes.length === 0 && (
              <div id="canvas-empty-state" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-black/50 p-8 border border-cyber-green/10 rounded-xl backdrop-blur-sm pointer-events-auto">
                  <div className="text-6xl mb-4 animate-bounce">👻</div>
                  <p className="text-cyber-blue mb-2 font-mono uppercase font-bold tracking-widest">No nodes in database</p>
                  <p className="text-xs text-cyber-gray font-mono">
                    Press <kbd className="px-1.5 py-0.5 bg-cyber-gray text-black rounded text-[10px] font-bold">CTRL+K</kbd> to open Command Palette
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls (Static HUD element) */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-20 pointer-events-auto">
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="w-10 h-10 rounded bg-[#080808]/90 border border-cyber-green/50 text-cyber-green text-xl font-bold flex items-center justify-center hover:bg-cyber-green hover:text-black transition-colors shadow-lg font-mono"
            title="Zoom Out"
          >
            -
          </button>
          <div className="w-16 h-10 rounded bg-[#080808]/90 border border-cyber-green/30 text-cyber-green text-xs font-mono font-bold flex items-center justify-center shadow-lg">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="w-10 h-10 rounded bg-[#080808]/90 border border-cyber-green/50 text-cyber-green text-xl font-bold flex items-center justify-center hover:bg-cyber-green hover:text-black transition-colors shadow-lg font-mono"
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Node list panel */}
      {nodes.length > 0 && (
        <CyberpunkCard className="mt-6">
          <h2 className="text-cyber-blue mb-4 font-mono font-bold uppercase tracking-wider">Active Workspace Nodes ({nodes.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nodes.map((node) => {
              const accentColor = getAccentColor(node.type);
              return (
                <div 
                  key={node.id} 
                  className="bg-[#080808]/90 border rounded-lg p-3 flex flex-col justify-between"
                  style={{ borderColor: `${accentColor}40` }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-bold text-white text-sm break-all">{node.data.label}</div>
                      <span className="text-[9px] uppercase font-bold tracking-widest" style={{ color: accentColor }}>
                        {node.type}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        deleteNode(node.id);
                        deleteNodeMessage(node.id);
                      }}
                      className="text-gray-500 hover:text-cyber-red transition-colors text-sm font-mono font-bold"
                    >
                      REMOVE
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-2">
                    COORDS: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                  </div>
                </div>
              );
            })}
          </div>
        </CyberpunkCard>
      )}
    </div>
  );
}