import React, { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export const DrawAndGuessView: React.FC<{ room: any, socket: Socket }> = ({ room, socket }) => {
  const gameState = room.gameState;
  const players: any[] = room.players;
  const playerId = socket.id;
  const onAction = (action: any) => socket.emit('game_action', action);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [guessInput, setGuessInput] = useState('');
  
  const currentStrokeId = useRef<string | null>(null);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const { state, status, winnerId } = gameState;
  const isDrawer = state.drawerId === playerId;
  const drawerPlayer = players.find(p => p.id === state.drawerId);
  const [timeLeft, setTimeLeft] = useState(0);

  // Local timer update for smoothness
  useEffect(() => {
    if (!state.endTime) return;
    const interval = setInterval(() => {
       const left = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
       setTimeLeft(left);
    }, 200);
    return () => clearInterval(interval);
  }, [state.endTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const history = state.drawHistory || [];
    history.forEach((ev: any) => {
        if (ev.type === 'draw') {
             ctx.beginPath();
             ctx.moveTo(ev.x0, ev.y0);
             ctx.lineTo(ev.x1, ev.y1);
             ctx.strokeStyle = ev.color;
             ctx.lineWidth = ev.size;
             ctx.stroke();
             ctx.closePath();
        }
    });
  }, [state.drawHistory]);

  useEffect(() => {
    const handleCustomEvent = (ev: any) => {
       if (ev.type === 'draw') {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.beginPath();
          ctx.moveTo(ev.x0, ev.y0);
          ctx.lineTo(ev.x1, ev.y1);
          ctx.strokeStyle = ev.color;
          ctx.lineWidth = ev.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          ctx.closePath();
       } else if (ev.type === 'clear') {
          const canvas = canvasRef.current;
          if (canvas) {
             const ctx = canvas.getContext('2d');
             ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
       }
    };
    socket.on('game_custom_event', handleCustomEvent);
    return () => {
       socket.off('game_custom_event', handleCustomEvent);
    };
  }, [socket]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
       x: (e.clientX - rect.left) * (canvas.width / rect.width),
       y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || state.phase !== 'playing') return;
    setIsDrawing(true);
    lastPos.current = getPos(e);
    currentStrokeId.current = Math.random().toString(36).substring(2, 9);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || state.phase !== 'playing' || !lastPos.current) return;
    const newPos = getPos(e);
    
    const ev = {
      type: 'draw',
      strokeId: currentStrokeId.current,
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: newPos.x,
      y1: newPos.y,
      color,
      size: lineWidth
    };

    socket.emit('game_custom_event', ev);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
       ctx.beginPath();
       ctx.moveTo(ev.x0, ev.y0);
       ctx.lineTo(ev.x1, ev.y1);
       ctx.strokeStyle = color;
       ctx.lineWidth = lineWidth;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       ctx.stroke();
       ctx.closePath();
    }
    
    lastPos.current = newPos;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    lastPos.current = null;
    currentStrokeId.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    socket.emit('game_custom_event', { type: 'clear' });
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('submitGuess called, input:', guessInput, 'isDrawer:', isDrawer, 'phase:', state.phase);
    if (!guessInput.trim() || isDrawer || state.phase !== 'playing') {
      console.log('submitGuess early return. Conditions:', !guessInput.trim(), isDrawer, state.phase !== 'playing');
      return;
    }
    console.log('Emitting game_action guess');
    onAction({ type: 'guess', payload: { text: guessInput } });
    setGuessInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 20px', borderRadius: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>
            {state.phase === 'countdown' ? 'Get Ready!' : 
             state.phase === 'playing' ? (isDrawer ? 'You are drawing!' : `${drawerPlayer?.nickname || 'Someone'} is drawing!`) :
             state.phase === 'result' ? 'Round Over!' : 'Game Over!'}
          </h2>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>Round {state.round} of {state.maxRounds}</div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* Secret Word Display */}
      {state.phase === 'playing' && (
        <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#e0f2fe', borderRadius: '8px', color: '#0369a1', fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px' }}>
          {isDrawer ? `Word: ${state.word.toUpperCase()}` : `Word: ${Array(state.wordLength).fill('_').join(' ')}`}
        </div>
      )}

      {/* Result Display */}
      {state.phase === 'result' && state.roundResults && (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#dcfce7', borderRadius: '8px', color: '#166534', fontSize: '1.2rem', fontWeight: 'bold' }}>
          The word was: {state.roundResults.word.toUpperCase()}
        </div>
      )}

      {/* Winner Display */}
      {status === 'finished' && (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fef08a', borderRadius: '8px', color: '#854d0e', fontSize: '1.5rem', fontWeight: 'bold' }}>
          🏆 Winner: {players.find(p => p.id === winnerId)?.nickname}
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Main Canvas Area */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', backgroundColor: '#ffffff', borderRadius: '12px', border: '2px solid #e2e8f0', overflow: 'hidden', touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              style={{ width: '100%', height: '100%', display: 'block', cursor: isDrawer ? 'crosshair' : 'default' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {state.phase !== 'playing' && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#475569' }}>
                    {state.phase === 'countdown' ? 'Starting soon...' : 'Waiting...'}
                 </span>
              </div>
            )}
          </div>
          
          {/* Drawing Tools (Drawer Only) */}
          {isDrawer && state.phase === 'playing' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', cursor: 'pointer' }} />
              
              <button 
                onClick={() => { setColor('#ffffff'); setLineWidth(20); }} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: color === '#ffffff' ? '#e2e8f0' : 'white' }}>
                🧹 Eraser
              </button>
              
              <button 
                onClick={() => { setColor('#000000'); setLineWidth(5); }} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: color === '#000000' && lineWidth === 5 ? '#e2e8f0' : 'white' }}>
                ✏️ Pen
              </button>

              <button 
                onClick={clearCanvas} 
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#ef4444', marginLeft: 'auto' }}>
                🗑 Clear
              </button>
            </div>
          )}
        </div>

        {/* Sidebar (Guesses & Leaderboard) */}
        <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Leaderboard */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Scores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...players].sort((a, b) => b.score - a.score).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: p.id === state.drawerId ? '#3b82f6' : '#64748b' }}>
                       {p.id === state.drawerId ? '🎨' : '🤔'}
                    </span>
                    <span style={{ fontWeight: p.id === playerId ? 'bold' : 'normal' }}>
                      {p.nickname}
                    </span>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guesses */}
          <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Guesses</h3>
            
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '200px', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {state.guesses && state.guesses.map((g: any, i: number) => {
                const guesser = players.find(p => p.id === g.playerId);
                return (
                  <div key={i} style={{ fontSize: '0.9rem', backgroundColor: g.isCorrect ? '#dcfce7' : 'transparent', padding: '2px 4px', borderRadius: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>{guesser?.nickname}: </span>
                    {g.isCorrect ? <span style={{ color: '#166534', fontWeight: 'bold' }}>Guessed the word! 🎉</span> : <span>{g.text}</span>}
                  </div>
                );
              })}
            </div>

            {!isDrawer && state.phase === 'playing' ? (
              <form onSubmit={submitGuess} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={guessInput}
                  onChange={e => setGuessInput(e.target.value)}
                  placeholder={state.correctGuessers.includes(playerId) ? "You got it!" : "Type guess..."}
                  disabled={state.correctGuessers.includes(playerId)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
                <button type="submit" disabled={state.correctGuessers.includes(playerId)} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Send
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '8px' }}>
                 {isDrawer ? 'Your friends are guessing!' : 'Wait for the next round.'}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
