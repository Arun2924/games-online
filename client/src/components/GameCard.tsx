import { Link } from 'react-router-dom';
import type { GameDefinition } from '@gamehub/shared';

interface GameCardProps {
  game: GameDefinition;
}

export function GameCard({ game }: GameCardProps) {
  const isComingSoon = !!game.isComingSoon;

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col group ${isComingSoon ? 'opacity-80' : 'hover:border-emerald-500/50 transition-colors'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="bg-slate-800 text-3xl w-14 h-14 flex items-center justify-center rounded-xl relative">
          {game.icon}
          {isComingSoon && (
            <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg transform rotate-12">
              Soon
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
            {game.category}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {game.minPlayers === game.maxPlayers ? game.maxPlayers : `${game.minPlayers}–${game.maxPlayers}`}
          </span>
          <span className="text-xs text-slate-500">{game.estimatedDuration}</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        {game.name}
      </h3>
      <p className="text-slate-400 text-sm mb-6 flex-1">{game.description || (isComingSoon ? 'This game is currently under development.' : '')}</p>
      
      <div className="flex gap-2">
        {game.supportedModes.includes('Solo') && (
          isComingSoon ? (
            <button disabled className="flex-1 bg-slate-800/50 text-slate-500 text-center py-3 rounded-xl font-medium text-sm border border-slate-700/50 cursor-not-allowed">
              Solo
            </button>
          ) : (
            <Link 
              to="/create-room" 
              state={{ gameId: game.id, solo: true }} 
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-3 rounded-xl font-medium transition-colors text-sm border border-slate-700"
            >
              Solo
            </Link>
          )
        )}
        
        {game.supportedModes.includes('Online') && (
          isComingSoon ? (
            <button disabled className="flex-1 bg-emerald-500/5 text-emerald-500/50 text-center py-3 rounded-xl font-medium text-sm border border-emerald-500/10 cursor-not-allowed">
              Multiplayer
            </button>
          ) : (
            <Link 
              to="/create-room" 
              state={{ gameId: game.id }} 
              className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-center py-3 rounded-xl font-medium transition-colors text-sm border border-emerald-500/20"
            >
              Multiplayer
            </Link>
          )
        )}
      </div>
    </div>
  );
}
