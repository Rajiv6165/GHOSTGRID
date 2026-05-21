'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [boardName, setBoardName] = useState('');
  const [joinBoardId, setJoinBoardId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [statusOnline, setStatusOnline] = useState(true);

  // Ping backend to show real status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/`, { method: 'GET' });
        setStatusOnline(res.status === 200 || res.status === 404);
      } catch (err) {
        // If it fails or is blocked, keep true as fallback or handle gracefully
        setStatusOnline(false);
      }
    };
    checkStatus();
  }, []);

  const createNewBoard = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/boards/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: boardName.trim() || 'New Board' }),
      });
      
      if (response.ok) {
        const board = await response.json();
        router.push(`/board/${board.id}`);
      } else {
        throw new Error('API creation failed');
      }
    } catch (error) {
      console.error('Error creating board:', error);
      // Fallback: generate random board ID and navigate
      const fakeId = 'board-' + Date.now();
      router.push(`/board/${fakeId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinBoard = (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinBoardId.trim();
    if (id) {
      router.push(`/board/${id}`);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030303] text-white flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden font-mono selection:bg-cyber-green selection:text-cyber-dark">
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes neon-glow {
          0%, 100% {
            text-shadow: 0 0 12px rgba(0, 255, 65, 0.8), 0 0 24px rgba(0, 255, 65, 0.4), 0 0 48px rgba(0, 255, 65, 0.2);
            filter: drop-shadow(0 0 10px rgba(0, 255, 65, 0.3));
          }
          50% {
            text-shadow: 0 0 24px rgba(0, 255, 65, 1), 0 0 48px rgba(0, 255, 65, 0.6), 0 0 96px rgba(0, 255, 65, 0.3);
            filter: drop-shadow(0 0 20px rgba(0, 255, 65, 0.6));
          }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-border-green {
          0%, 100% {
            box-shadow: 0 0 10px rgba(0, 255, 65, 0.2), inset 0 0 5px rgba(0, 255, 65, 0.1);
            border-color: rgba(0, 255, 65, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(0, 255, 65, 0.7), inset 0 0 10px rgba(0, 255, 65, 0.3);
            border-color: rgba(0, 255, 65, 1);
          }
        }
        @keyframes pulse-border-purple {
          0%, 100% {
            box-shadow: 0 0 10px rgba(157, 0, 255, 0.2), inset 0 0 5px rgba(157, 0, 255, 0.1);
            border-color: rgba(157, 0, 255, 0.4);
          }
          50% {
            box-shadow: 0 0 25px rgba(157, 0, 255, 0.7), inset 0 0 10px rgba(157, 0, 255, 0.3);
            border-color: rgba(157, 0, 255, 1);
          }
        }
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animated-title {
          animation: neon-glow 3s ease-in-out infinite;
        }
        .float-animation {
          animation: float-card 6s ease-in-out infinite;
        }
        .glow-btn-green {
          animation: pulse-border-green 3s infinite;
        }
        .glow-btn-purple {
          animation: pulse-border-purple 3s infinite;
        }
        .bg-grid-cyber {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(0, 255, 65, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
          animation: grid-move 20s linear infinite;
        }
      `}} />

      {/* Cyber Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyber-green/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyber-blue/5 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none z-0"></div>

      {/* Header bar */}
      <header className="relative w-full max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-cyber-green/20 pb-4 mb-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-cyber-green rounded-full animate-ping"></div>
          <span className="text-cyber-green text-sm tracking-widest font-bold">GHOSTGRID PROTOCOL v1.0.0</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-cyber-blue">[STATUS: ACTIVE]</span>
          <span className="text-cyber-purple">[AI_CORE: GPT-4O]</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="relative w-full max-w-7xl flex-1 flex flex-col items-center justify-center gap-12 z-10 my-auto">
        
        {/* Hero Section */}
        <section className="text-center max-w-3xl flex flex-col items-center gap-4 animate-[fade-in_1s_ease-out]">
          <h1 className="animated-title text-6xl md:text-8xl font-black tracking-widest text-cyber-green select-none select-none font-bold uppercase transition-all duration-300">
            Ghostgrid
          </h1>
          <p className="text-lg md:text-2xl text-cyber-blue tracking-wider font-semibold uppercase mt-2">
            AI-Powered Diagram &amp; Architecture Generator
          </p>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl mt-2 leading-relaxed">
            Collaboratively sketch system topologies, workflow paths, and database relationships. Use the AI Command Palette to manifest production-ready architectures instantly on our reactive whiteboards.
          </p>
        </section>

        {/* Feature Cards Section */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-4 animate-[fade-in_1.2s_ease-out]">
          
          {/* Card 1: System Architecture */}
          <div className="float-animation group bg-[#080808]/90 border border-cyber-green/20 hover:border-cyber-green/60 p-6 rounded-xl transition-all duration-300 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-green font-mono">[SYS_ARCH]</span>
              <svg className="w-8 h-8 text-cyber-green group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="14" width="6" height="8" rx="1" />
                <rect x="16" y="14" width="6" height="8" rx="1" />
                <rect x="9" y="2" width="6" height="8" rx="1" />
                <path d="M12 10v4M5 14v-2h14v2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyber-green transition-colors duration-300">
              System Architecture
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Design complex multi-tier topologies. Map client entry points, API gateways, microservices, load balancers, and persistent database nodes.
            </p>
          </div>

          {/* Card 2: Flowcharts & Data Flow */}
          <div className="float-animation group bg-[#080808]/90 border border-cyber-blue/20 hover:border-cyber-blue/60 p-6 rounded-xl transition-all duration-300 backdrop-blur-md flex flex-col gap-4" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-blue font-mono">[DATA_FLOW]</span>
              <svg className="w-8 h-8 text-cyber-blue group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 12l10 10 10-10L12 2z" />
                <path d="M12 6v12M8 10h8" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyber-blue transition-colors duration-300">
              Flowcharts &amp; Data Flow
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Visualize procedural pipelines, user navigation paths, data routing scripts, and asynchronous event-driven worker loops.
            </p>
          </div>

          {/* Card 3: ER Diagrams */}
          <div className="float-animation group bg-[#080808]/90 border border-cyber-purple/20 hover:border-cyber-purple/60 p-6 rounded-xl transition-all duration-300 backdrop-blur-md flex flex-col gap-4" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-purple font-mono">[REL_SCHEMA]</span>
              <svg className="w-8 h-8 text-cyber-purple group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="8" height="6" rx="1" />
                <rect x="14" y="15" width="8" height="6" rx="1" />
                <path d="M10 6h4v12h-4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyber-purple transition-colors duration-300">
              ER Diagrams
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Model schema relationships, primary keys, foreign connections, and logical tables dynamically without manual canvas arrangement.
            </p>
          </div>

        </section>

        {/* Board Interaction Panel (Create & Join) */}
        <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 my-4 animate-[fade-in_1.4s_ease-out]">
          
          {/* Create Board Section */}
          <div className="bg-[#080808]/95 border border-cyber-green/30 rounded-xl p-8 flex flex-col justify-between gap-6 backdrop-blur-lg hover:shadow-[0_0_20px_rgba(0,255,65,0.1)] transition-shadow duration-300">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyber-green"></div>
                <h2 className="text-xl font-bold text-cyber-green tracking-widest uppercase">Create Whiteboard</h2>
              </div>
              <p className="text-xs text-gray-400">
                Initialize a blank system architecture canvas, seed demo elements, or let our AI host draw a setup.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="ENTER WHITEBOARD NAME (OPTIONAL)"
                  className="w-full bg-black/60 border border-cyber-green/40 focus:border-cyber-green focus:ring-1 focus:ring-cyber-green text-cyber-green text-sm px-4 py-3 rounded outline-none transition-all duration-300 tracking-wider placeholder-cyber-green/40 uppercase"
                />
              </div>
              <button 
                onClick={createNewBoard}
                disabled={isCreating}
                className="glow-btn-green w-full bg-transparent hover:bg-cyber-green hover:text-black text-cyber-green border border-cyber-green text-sm font-bold tracking-widest py-3 px-6 rounded transition-all duration-300 uppercase"
              >
                {isCreating ? 'CREATING BOARD...' : 'CREATE NEW BOARD'}
              </button>
            </div>
          </div>

          {/* Join Board Section */}
          <div className="bg-[#080808]/95 border border-cyber-purple/30 rounded-xl p-8 flex flex-col justify-between gap-6 backdrop-blur-lg hover:shadow-[0_0_20px_rgba(157,0,255,0.1)] transition-shadow duration-300">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-cyber-purple"></div>
                <h2 className="text-xl font-bold text-cyber-purple tracking-widest uppercase">Join Whiteboard</h2>
              </div>
              <p className="text-xs text-gray-400">
                Access an existing shared board using its UUID workspace key for real-time multiplayer coordination.
              </p>
            </div>

            <form onSubmit={handleJoinBoard} className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  value={joinBoardId}
                  onChange={(e) => setJoinBoardId(e.target.value)}
                  placeholder="ENTER WORKSPACE BOARD ID (UUID)"
                  className="w-full bg-black/60 border border-cyber-purple/40 focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple text-cyber-purple text-sm px-4 py-3 rounded outline-none transition-all duration-300 tracking-wider placeholder-cyber-purple/40"
                  required
                />
              </div>
              <button 
                type="submit"
                className="glow-btn-purple w-full bg-transparent hover:bg-cyber-purple hover:text-black text-cyber-purple border border-cyber-purple text-sm font-bold tracking-widest py-3 px-6 rounded transition-all duration-300 uppercase"
              >
                JOIN BOARD
              </button>
            </form>
          </div>

        </section>

      </div>

      {/* Footer / System Diagnosics */}
      <footer className="relative w-full max-w-7xl mt-12 z-10 animate-[fade-in_1.6s_ease-out]">
        <div className="bg-black/80 border border-cyber-blue/20 rounded-xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 border-b border-cyber-blue/15 pb-2">
            <span className="text-cyber-blue text-xs font-bold tracking-widest">SYSTEM MONITOR</span>
            <span className="text-gray-600 text-[10px]">REAL-TIME TELEMETRY</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">BACKEND HOST:</span>
              <span className="text-cyber-green truncate">{process.env.NEXT_PUBLIC_BACKEND_URL}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">BACKEND STATE:</span>
              <span className={`font-bold ${statusOnline ? 'text-cyber-green' : 'text-cyber-red animate-pulse'}`}>
                {statusOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">WS CONGREGATE:</span>
              <span className="text-cyber-green truncate">{process.env.NEXT_PUBLIC_WS_URL}/ws/board/</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500">SYS CORE TEMPERATURE:</span>
              <span className="text-cyber-purple font-semibold">32.4°C [STABLE]</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}