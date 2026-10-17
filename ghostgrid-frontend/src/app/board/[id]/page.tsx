'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

const getIntersectionPoint = (source: {x: number, y: number}, target: {x: number, y: number}, isMobile = false) => {
  const w = isMobile ? 140 : 200;
  const h = isMobile ? 60 : 80;
  const halfW = w / 2;
  const halfH = h / 2;
  const x1 = source.x + halfW;
  const y1 = source.y + halfH;
  const x2 = target.x + halfW;
  const y2 = target.y + halfH;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
    return { x: x2, y: y2 };
  }
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  let scale = 1;
  if (absDx * halfH > absDy * halfW) {
    // Intersects left/right side
    scale = halfW / absDx;
  } else {
    // Intersects top/bottom side
    scale = halfH / absDy;
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

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);

  // Panning & Zooming Canvas State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Active Workspace Nodes Panel scroll & hidden count tracking
  const nodesGridRef = useRef<HTMLDivElement>(null);
  const [hiddenNodesCount, setHiddenNodesCount] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const prevIsGenerating = useRef(isGenerating);
  const initialFitDone = useRef(false);

  // Touch state references for pan and pinch-to-zoom
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    touchStartPos: { x: number; y: number };
  }>({
    initialDist: 0,
    initialZoom: 1,
    touchStartPos: { x: 0, y: 0 },
  });

  // Touch drag tracking for individual nodes
  const nodeTouchRef = useRef<{
    startX: number;
    startY: number;
    nodeOrigX: number;
    nodeOrigY: number;
    nodeId: string | null;
  }>({
    startX: 0,
    startY: 0,
    nodeOrigX: 0,
    nodeOrigY: 0,
    nodeId: null,
  });

  // Fit to screen: automatically calculates the correct zoom level and pan position to fit all nodes within visible canvas area
  const fitToScreen = useCallback((customNodes?: typeof nodes) => {
    const targetNodes = customNodes || useBoardStore.getState().nodes;
    if (!targetNodes || targetNodes.length === 0) return;

    const viewport = document.getElementById('canvas-viewport');
    if (!viewport) return;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    if (viewportWidth <= 0 || viewportHeight <= 0) return;

    const cardW = isMobile ? 140 : 200;
    const cardH = isMobile ? 70 : 100;
    const padding = isMobile ? 24 : 50;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    targetNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + cardW);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + cardH);
    });

    const contentWidth = Math.max(maxX - minX, cardW);
    const contentHeight = Math.max(maxY - minY, cardH);

    const availableWidth = Math.max(viewportWidth - padding * 2, 100);
    const availableHeight = Math.max(viewportHeight - padding * 2, 100);

    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    const calculatedZoom = Math.min(scaleX, scaleY);

    // Clamp zoom to reasonable limits (0.2x min, 1.0x max)
    const newZoom = Number(Math.max(0.2, Math.min(1.0, calculatedZoom)).toFixed(2));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newPanX = Math.round(viewportWidth / 2 - centerX * newZoom);
    const newPanY = Math.round(viewportHeight / 2 - centerY * newZoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [isMobile]);

  // Automatically set initial zoom to 60% on mobile screens (< 768px)
  useEffect(() => {
    const isMobileScreen = window.innerWidth < 768;
    setIsMobile(isMobileScreen);
    if (isMobileScreen) {
      setZoom(0.6);
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Close command palette and automatically fit all nodes to screen when AI generates nodes
  useEffect(() => {
    if (waitingForAI && !isGenerating) {
      setWaitingForAI(false);
      setShowCommandPalette(false);
      const timer = setTimeout(() => {
        fitToScreen();
      }, 150);
      return () => clearTimeout(timer);
    } else if (prevIsGenerating.current && !isGenerating) {
      const timer = setTimeout(() => {
        fitToScreen();
      }, 150);
      return () => clearTimeout(timer);
    }
    prevIsGenerating.current = isGenerating;
  }, [isGenerating, waitingForAI, fitToScreen]);

  // Initial fit to screen when board state loads with nodes
  useEffect(() => {
    if (!initialFitDone.current && nodes.length > 0) {
      initialFitDone.current = true;
      const timer = setTimeout(() => {
        fitToScreen();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitToScreen]);

  // Update nodes panel scrolling states and hidden node count
  const updateScrollState = useCallback(() => {
    const container = nodesGridRef.current;
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;

    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);

    if (scrollHeight <= clientHeight + 4) {
      setHiddenNodesCount(0);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const children = Array.from(container.children) as HTMLElement[];

    let hidden = 0;
    children.forEach((child) => {
      const rect = child.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);

      // If less than half the card is visible in the container, count it as hidden
      if (visibleHeight < rect.height * 0.5) {
        hidden++;
      }
    });

    setHiddenNodesCount(hidden);
  }, []);

  const handleScrollUp = () => {
    if (nodesGridRef.current) {
      nodesGridRef.current.scrollBy({ top: -140, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  const handleScrollDown = () => {
    if (nodesGridRef.current) {
      nodesGridRef.current.scrollBy({ top: 140, behavior: 'smooth' });
      setTimeout(updateScrollState, 350);
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateScrollState, 50);
    return () => clearTimeout(timer);
  }, [nodes, updateScrollState]);

  useEffect(() => {
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

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
      const localX = (e.clientX - rect.left - pan.x) / zoom;
      const localY = (e.clientY - rect.top - pan.y) / zoom;
      
      const cardW = isMobile ? 140 : 200;
      const cardH = isMobile ? 60 : 80;
      handleNodeDrag(nodeId, Math.round(localX - cardW / 2), Math.round(localY - cardH / 2));
    }
  };

  // Node touch drag handlers for mobile devices
  const handleNodeTouchStart = (e: React.TouchEvent, node: { id: string; position: { x: number; y: number } }) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    nodeTouchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      nodeOrigX: node.position.x,
      nodeOrigY: node.position.y,
      nodeId: node.id,
    };
  };

  const handleNodeTouchMove = (e: React.TouchEvent, nodeId: string) => {
    if (nodeTouchRef.current.nodeId !== nodeId || e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const dx = (touch.clientX - nodeTouchRef.current.startX) / zoom;
    const dy = (touch.clientY - nodeTouchRef.current.startY) / zoom;
    const newX = Math.round(nodeTouchRef.current.nodeOrigX + dx);
    const newY = Math.round(nodeTouchRef.current.nodeOrigY + dy);
    updateNodePosition(nodeId, { x: newX, y: newY });
  };

  const handleNodeTouchEnd = (e: React.TouchEvent, nodeId: string) => {
    if (nodeTouchRef.current.nodeId === nodeId) {
      e.stopPropagation();
      nodeTouchRef.current.nodeId = null;
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        moveNode(nodeId, { x: node.position.x, y: node.position.y });
      }
    }
  };

  // Canvas Mouse Pan Handlers
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

  // Canvas Touch Handlers (1-finger Pan & 2-finger Pinch to Zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStateRef.current.touchStartPos = {
        x: touch.clientX - pan.x,
        y: touch.clientY - pan.y,
      };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStateRef.current.initialDist = dist;
      touchStateRef.current.initialZoom = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - touchStateRef.current.touchStartPos.x,
        y: touch.clientY - touchStateRef.current.touchStartPos.y,
      });
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      if (touchStateRef.current.initialDist > 0) {
        const factor = currentDist / touchStateRef.current.initialDist;
        const newZoom = Math.min(2.5, Math.max(0.3, touchStateRef.current.initialZoom * factor));
        setZoom(Number(newZoom.toFixed(2)));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchStateRef.current.initialDist = 0;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStateRef.current.touchStartPos = {
        x: touch.clientX - pan.x,
        y: touch.clientY - pan.y,
      };
      setIsDragging(true);
      touchStateRef.current.initialDist = 0;
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] md:h-auto bg-cyber-dark text-cyber-green p-2 md:p-4 flex flex-col overflow-hidden md:overflow-visible">
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

      {/* Header / Responsive Top Bar */}
      <div className="flex justify-between items-center gap-2 mb-2 md:mb-6 border-b border-cyber-green/20 pb-2 md:pb-4 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-2xl md:text-3xl font-black text-cyber-green uppercase tracking-wider font-mono truncate">
            {boardName || 'GHOSTGRID BOARD'}
          </h1>
          <div className="text-[10px] md:text-xs text-gray-500 font-mono mt-0.5 md:mt-1 flex flex-wrap items-center gap-1.5 md:gap-2">
            <span>ID: <span className="text-cyber-blue select-all font-mono">
              <span className="md:hidden">{boardId ? `${boardId.slice(0, 8)}…` : ''}</span>
              <span className="hidden md:inline">{boardId}</span>
            </span></span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">NODES: <span className="text-cyber-green font-bold">{nodes.length}</span></span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">EDGES: <span className="text-cyber-green font-bold">{edges.length}</span></span>
          </div>
        </div>
        <div className="flex gap-2 md:gap-4 items-center shrink-0">
          <div className={`px-2 md:px-3 py-1 rounded text-[10px] md:text-xs font-bold tracking-wider md:tracking-widest font-mono flex items-center gap-1.5 ${isConnected ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/10 text-cyber-red border border-cyber-red/30'}`}>
            <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isConnected ? 'bg-cyber-green animate-ping' : 'bg-cyber-red'}`}></span>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
          <button 
            onClick={() => setShowCommandPalette(true)}
            className="px-2.5 py-1.5 md:px-4 md:py-2 border border-cyber-purple/50 text-cyber-purple hover:bg-cyber-purple hover:text-black hover:border-cyber-purple font-mono text-[10px] md:text-xs font-bold tracking-wider md:tracking-widest transition-all duration-300 rounded"
          >
            <span className="hidden md:inline">COMMAND PALETTE (CTRL+K)</span>
            <span className="md:hidden">CMD+K</span>
          </button>
        </div>
      </div>

      {/* Command Palette */}
      {showCommandPalette && (
        <CyberpunkCard className="mb-2 md:mb-6 relative overflow-hidden shrink-0">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-6 md:py-8">
              <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-cyber-green border-t-transparent rounded-full animate-spin mb-3 md:mb-4"></div>
              <div className="text-cyber-green text-xs md:text-base font-bold tracking-widest animate-pulse font-mono">
                AI GENERATING...
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 md:mb-4">
                <h2 className="text-cyber-blue font-mono font-bold text-sm md:text-lg uppercase tracking-widest">AI ARCHITECT</h2>
                <p className="text-[10px] md:text-xs text-gray-500 font-mono">Describe your system and I will generate the architecture</p>
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
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
                    className="px-2.5 py-1 md:px-3 md:py-1.5 border border-cyber-blue/30 text-cyber-blue/80 hover:text-cyber-blue hover:border-cyber-blue hover:bg-cyber-blue/10 rounded-full font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
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
              <div className="mt-3 md:mt-4 text-[10px] md:text-xs text-cyber-gray font-mono hidden sm:block">
                <p className="text-gray-500 font-bold mb-1 uppercase tracking-wider">Command Protocols:</p>
                <p className="text-cyber-blue">- design [prompt] <span className="text-gray-600">-- Generate architecture with AI</span></p>
                <p className="text-cyber-blue">- add [type] <span className="text-gray-600">-- Add node (service, database, cache, api, queue, gateway)</span></p>
              </div>
            </>
          )}
        </CyberpunkCard>
      )}

      {/* Board Canvas - Fits full mobile viewport height */}
      <div 
        id="canvas-viewport"
        className="flex-1 h-full min-h-[350px] md:h-[75vh] md:min-h-0 relative overflow-hidden bg-[#050505] border border-cyber-green/20 rounded-xl cursor-grab active:cursor-grabbing backdrop-blur-md touch-none select-none"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
                  const cardW = isMobile ? 140 : 200;
                  const cardH = isMobile ? 60 : 80;
                  const startX = sourceNode.position.x + cardW / 2;
                  const startY = sourceNode.position.y + cardH / 2;
                  const endPoint = getIntersectionPoint(sourceNode.position, targetNode.position, isMobile);
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

            {/* Nodes - Responsive: 140px on mobile, 200px on desktop, smaller font (11px) and padding (8px) on mobile */}
            {nodes.map((node) => {
              const accentColor = getAccentColor(node.type);
              return (
                <div
                  key={node.id}
                  className="absolute bg-[#080808]/95 border-2 rounded-lg cursor-move text-left shadow-lg select-none pointer-events-auto touch-none w-[140px] md:w-[200px] p-2 md:p-4"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    borderColor: accentColor,
                    boxShadow: `0 0 12px ${accentColor}25, inset 0 0 4px ${accentColor}15`,
                  }}
                  draggable
                  onDragEnd={(e) => handleNodeDragEnd(e, node.id)}
                  onTouchStart={(e) => handleNodeTouchStart(e, node)}
                  onTouchMove={(e) => handleNodeTouchMove(e, node.id)}
                  onTouchEnd={(e) => handleNodeTouchEnd(e, node.id)}
                >
                  <div className="flex justify-between items-start gap-1 md:gap-2 mb-1 md:mb-1.5">
                    <span 
                      className="text-[8px] md:text-[9px] uppercase font-bold tracking-wider md:tracking-widest px-1 md:px-1.5 py-0.5 rounded bg-black/40" 
                      style={{ color: accentColor }}
                    >
                      {node.type}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(node.id);
                        deleteNodeMessage(node.id);
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="text-gray-500 hover:text-cyber-red text-xs md:text-sm leading-none transition-colors p-0.5"
                    >
                      ×
                    </button>
                  </div>
                  <div className="font-bold text-white text-[11px] md:text-sm break-words leading-tight">{node.data.label}</div>
                  {node.data.description && (
                    <div className="text-[9px] md:text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                      {node.data.description}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {nodes.length === 0 && (
              <div id="canvas-empty-state" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-black/50 p-6 md:p-8 border border-cyber-green/10 rounded-xl backdrop-blur-sm pointer-events-auto">
                  <div className="text-4xl md:text-6xl mb-3 md:mb-4 animate-bounce">👻</div>
                  <p className="text-cyber-blue mb-1 md:mb-2 font-mono uppercase font-bold tracking-widest text-xs md:text-base">No nodes in database</p>
                  <p className="text-[10px] md:text-xs text-cyber-gray font-mono">
                    Tap <button onClick={() => setShowCommandPalette(true)} className="px-1.5 py-0.5 bg-cyber-gray text-black rounded text-[10px] font-bold">CMD+K</button> to open Command Palette
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls & Fit to Screen */}
        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-1.5 md:gap-2 z-20 pointer-events-auto">
          <button 
            onClick={() => fitToScreen()}
            className="h-11 md:h-10 px-2.5 md:px-3 rounded bg-[#080808]/90 border border-cyber-green/50 text-cyber-green text-[10px] md:text-xs font-bold font-mono flex items-center gap-1.5 hover:bg-cyber-green hover:text-black active:bg-cyber-green active:text-black transition-colors shadow-lg touch-manipulation cursor-pointer whitespace-nowrap"
            title="Fit to Screen"
            aria-label="Fit to Screen"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <span>FIT TO SCREEN</span>
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))))}
            className="w-11 h-11 md:w-10 md:h-10 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded bg-[#080808]/90 border border-cyber-green/50 text-cyber-green text-xl font-bold flex items-center justify-center hover:bg-cyber-green hover:text-black active:bg-cyber-green active:text-black transition-colors shadow-lg font-mono touch-manipulation cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            -
          </button>
          <div className="min-w-[50px] h-11 md:w-16 md:h-10 md:min-w-0 px-2 rounded bg-[#080808]/90 border border-cyber-green/30 text-cyber-green text-xs font-mono font-bold flex items-center justify-center shadow-lg select-none">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => setZoom(z => Math.min(2.5, Number((z + 0.1).toFixed(2))))}
            className="w-11 h-11 md:w-10 md:h-10 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 rounded bg-[#080808]/90 border border-cyber-green/50 text-cyber-green text-xl font-bold flex items-center justify-center hover:bg-cyber-green hover:text-black active:bg-cyber-green active:text-black transition-colors shadow-lg font-mono touch-manipulation cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Active Workspace Nodes Panel - Hidden on mobile (< 768px) to save screen space */}
      {nodes.length > 0 && (
        <div className="hidden md:block shrink-0">
          <CyberpunkCard className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-cyber-blue font-mono font-bold uppercase tracking-wider text-sm md:text-base">
                  Active Workspace Nodes ({nodes.length})
                </h2>
                {hiddenNodesCount > 0 && (
                  <span 
                    className="text-[10px] md:text-xs font-mono text-cyber-blue/90 bg-cyber-blue/10 border border-cyber-blue/30 px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse"
                    title={`${hiddenNodesCount} nodes currently hidden outside the scroll view`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue"></span>
                    <span>{hiddenNodesCount} {hiddenNodesCount === 1 ? 'node' : 'nodes'} hidden</span>
                  </span>
                )}
              </div>

              {/* Up / Down Arrow Scroll Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleScrollUp}
                  disabled={!canScrollUp}
                  className={`p-1.5 rounded border font-mono text-xs transition-colors flex items-center justify-center ${
                    canScrollUp
                      ? 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-black cursor-pointer shadow-sm'
                      : 'border-gray-800 text-gray-600 cursor-not-allowed opacity-30'
                  }`}
                  title="Scroll Up"
                  aria-label="Scroll Up"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </button>
                <button
                  onClick={handleScrollDown}
                  disabled={!canScrollDown}
                  className={`p-1.5 rounded border font-mono text-xs transition-colors flex items-center justify-center ${
                    canScrollDown
                      ? 'border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-black cursor-pointer shadow-sm'
                      : 'border-gray-800 text-gray-600 cursor-not-allowed opacity-30'
                  }`}
                  title="Scroll Down"
                  aria-label="Scroll Down"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable nodes grid container with fixed height 200px and overflow-y: auto */}
            <div 
              ref={nodesGridRef}
              onScroll={updateScrollState}
              className="h-[200px] overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start"
              style={{ height: '200px', overflowY: 'auto' }}
            >
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

            {/* Subtle bottom scroll indicator */}
            {hiddenNodesCount > 0 && canScrollDown && (
              <div className="mt-2 pt-1 border-t border-cyber-green/10 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>Scroll down or use arrows for more nodes</span>
                <span className="text-cyber-blue font-bold">↓ {hiddenNodesCount} {hiddenNodesCount === 1 ? 'node' : 'nodes'} hidden</span>
              </div>
            )}
          </CyberpunkCard>
        </div>
      )}
    </div>
  );
}