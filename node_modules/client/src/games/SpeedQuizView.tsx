import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import type { Room } from '@gamehub/shared';

export function SpeedQuizView({ room, socket }: { room: Room, socket: Socket }) {
  const state = room.gameState?.state;
  const phase = state?.phase;
  const isHost = room.hostId === socket.id;

  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Timer logic for client-side countdown
  useEffect(() => {
    if ((phase !== 'playing' && phase !== 'countdown') || !state?.questionEndTime) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, state.questionEndTime - now);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, state?.questionEndTime]);

  const handleAnswer = (index: number) => {
    if (phase !== 'playing') return;
    if (state.playerAnswers?.[socket.id]) return; // Already answered
    socket.emit('game_action', { type: 'submit_answer', payload: { answerIndex: index } });
  };

  if (!state || phase === 'waiting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold mb-4">Speed Quiz</h2>
          <p className="text-slate-400 mb-8">Get ready to test your knowledge! Answer fast for more points.</p>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-300">Players ({room.players.length})</h3>
            <ul className="flex flex-wrap justify-center gap-2">
              {room.players.map(p => (
                <li key={p.id} className="bg-slate-800 px-3 py-1 rounded-full text-sm">
                  {p.nickname}
                </li>
              ))}
            </ul>
          </div>

          {isHost && (
            <p className="mt-8 text-slate-500 animate-pulse">Wait for players to ready up in the lobby to start the game.</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'game_over') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg w-full text-center">
          <h2 className="text-4xl font-bold text-amber-400 mb-2">Quiz Complete!</h2>
          <p className="text-slate-400 mb-8">Final Results</p>
          
          <div className="space-y-3 mb-8">
            {state.leaderboard.map((p: any, index: number) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between p-4 rounded-xl ${
                  index === 0 ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400' : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{index + 1}.</span>
                  <span className="font-medium">{p.nickname}</span>
                </div>
                <span className="font-bold">{p.score} pts</span>
              </div>
            ))}
          </div>

          {isHost && (
            <p className="w-full text-slate-500 py-3 text-center">Return to lobby to play again.</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'countdown') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <h2 className="text-4xl font-bold mb-4">Get Ready!</h2>
        <div className="text-6xl font-bold text-amber-500 font-mono">
          {Math.ceil(timeLeft / 1000)}
        </div>
      </div>
    );
  }

  const currentQuestion = state.currentQuestion;
  const myAnswer = state.playerAnswers?.[socket.id];
  const hasAnswered = !!myAnswer;
  
  // Calculate progress bar percentage
  const totalTime = 15000;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 gap-6">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <span className="text-slate-400 text-sm">Round</span>
          <p className="font-bold text-xl">{state.currentRound} / {state.totalRounds}</p>
        </div>
        
        {phase === 'playing' && (
          <div className="flex flex-col items-end w-32">
            <span className={`text-2xl font-bold font-mono ${timeLeft < 5000 ? 'text-rose-500' : 'text-emerald-400'}`}>
              {(timeLeft / 1000).toFixed(1)}s
            </span>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div 
                className={`h-full ${timeLeft < 5000 ? 'bg-rose-500' : 'bg-emerald-400'} transition-all ease-linear`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
        
        {phase === 'round_result' && (
          <div className="text-amber-400 font-bold text-xl">Round Over!</div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-6">
          {currentQuestion && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex-1 flex flex-col">
              <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider mb-2">
                {currentQuestion.category}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mb-8 leading-relaxed">
                {currentQuestion.question}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                {currentQuestion.choices.map((choice: string, index: number) => {
                  const isSelected = myAnswer?.answerIndex === index;
                  
                  let buttonStyle = 'bg-slate-800 hover:bg-slate-700 text-slate-300';
                  
                  if (phase === 'playing' && isSelected) {
                    buttonStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 border-2';
                  } else if (phase === 'playing' && hasAnswered) {
                    buttonStyle = 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-50';
                  } else if (phase === 'playing') {
                    buttonStyle = 'bg-slate-800 hover:bg-slate-700 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border-2 border-transparent';
                  }

                  if (phase === 'round_result') {
                    const isCorrectChoice = currentQuestion.correctIndex === index;
                    if (isCorrectChoice) {
                      buttonStyle = 'bg-emerald-500 text-slate-950 font-bold border-2 border-emerald-500';
                    } else if (isSelected && !isCorrectChoice) {
                      buttonStyle = 'bg-rose-500 text-white font-bold border-2 border-rose-500';
                    } else {
                      buttonStyle = 'bg-slate-800/50 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={hasAnswered || phase !== 'playing'}
                      className={`p-4 rounded-xl text-left font-medium text-lg min-h-[80px] ${buttonStyle}`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-80 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-slate-300 mb-4 uppercase text-sm tracking-wider">Leaderboard</h3>
            <div className="space-y-3">
              {state.leaderboard.length > 0 
                ? state.leaderboard.map((p: any, idx: number) => {
                  const pAnswer = state.playerAnswers?.[p.id];
                  
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs w-4">{idx + 1}.</span>
                        <span className="font-medium truncate max-w-[100px]">{p.nickname}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {phase === 'playing' && pAnswer && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Answered" />
                        )}
                        {phase === 'round_result' && pAnswer && (
                          <span className={`text-xs font-bold ${pAnswer.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {pAnswer.isCorrect ? `+${pAnswer.pointsEarned}` : '0'}
                          </span>
                        )}
                        <span className="font-bold text-sm w-10 text-right">{p.score}</span>
                      </div>
                    </div>
                  );
                })
                : room.players.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                    <span className="font-medium truncate">{p.nickname}</span>
                    <span className="font-bold text-sm">0</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
