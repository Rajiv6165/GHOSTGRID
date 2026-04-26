'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CyberpunkCard } from '../components/CyberpunkCard';

export default function Home() {
  const router = useRouter();
  const [boardName, setBoardName] = useState('');

  const createNewBoard = async () => {
    try {
      // Create board via API
      const response = await fetch('http://localhost:8000/api/boards/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: boardName || 'New Board' }),
      });
      
      if (response.ok) {
        const board = await response.json();
        router.push(`/board/${board.id}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
      // Fallback: generate random UUID and navigate
      const fakeId = 'board-' + Date.now();
      router.push(`/board/${fakeId}`);
    }
  };

  const joinExistingBoard = () => {
    const boardId = prompt('Enter Board ID:');
    if (boardId) {
      router.push(`/board/${boardId}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <CyberpunkCard className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4 text-cyber-green glitch-text">
            GHOSTGRID
          </h1>
          <div className="text-cyber-blue mb-2">┌─ SYSTEM STATUS ─┐</div>
          <div className="text-cyber-green mb-8">│ ACTIVE & READY │</div>
          <div className="text-cyber-blue mb-2">└─────────────────┘</div>
          
          <p className="text-cyber-purple mb-8">
            Collaborative System Design Whiteboard with AI Ghost Agents
          </p>
          
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Board Name (optional)"
                className="terminal-input w-full mb-4"
              />
              <button 
                onClick={createNewBoard}
                className="w-full px-6 py-3 border border-cyber-green text-cyber-green hover:bg-cyber-green hover:text-cyber-dark transition-colors font-mono"
              >
                CREATE NEW BOARD
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyber-gray"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-cyber-dark text-cyber-gray">OR</span>
              </div>
            </div>
            
            <button 
              onClick={joinExistingBoard}
              className="w-full px-6 py-3 border border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-cyber-dark transition-colors font-mono"
            >
              JOIN EXISTING BOARD
            </button>
          </div>
          
          <div className="mt-8 text-xs text-cyber-gray">
            <p>Press Cmd+K for command palette when in a board</p>
            <p>Real-time collaboration enabled</p>
          </div>
        </div>
      </CyberpunkCard>
      
      {/* Terminal info panel */}
      <CyberpunkCard className="mt-8 w-full max-w-2xl">
        <h3 className="text-cyber-blue mb-4">SYSTEM INFO</h3>
        <div className="text-sm space-y-2 font-mono">
          <div className="flex justify-between">
            <span className="text-cyber-gray">Backend Status:</span>
            <span className="text-cyber-green">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-gray">WebSocket Server:</span>
            <span className="text-cyber-green">ws://localhost:8000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-gray">AI Integration:</span>
            <span className="text-cyber-blue">OpenAI GPT-4o</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyber-gray">Theme:</span>
            <span className="text-cyber-purple">Cyberpunk Terminal</span>
          </div>
        </div>
      </CyberpunkCard>
    </main>
  );
}