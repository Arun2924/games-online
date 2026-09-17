import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Users, Lightning, HandPeace, PencilSimple, Question, GameController } from '@phosphor-icons/react';
import type { GameDefinition } from '@gamehub/shared';

export function GameArtwork({ id, hero = false }: { id: string; hero?: boolean }) {
  return (
    <div className={`game-art art-${id} ${hero ? 'art-hero' : ''}`} aria-hidden="true">
      <div className="art-grid" />
      {id === 'tictactoe' ? <svg className="tic-art" viewBox="0 0 400 280" fill="none">
        <g transform="translate(200 140) rotate(-12) translate(-200 -140)">
          <rect x="95" y="35" width="220" height="220" rx="23" fill="#142e26" stroke="#709687" strokeWidth="2" />
          <path d="M168 47v196M241 47v196M107 108h196M107 181h196" stroke="#456858" strokeWidth="2" />
          <g stroke="#9fe3ba" strokeWidth="12" strokeLinecap="round"><path d="m120 60 26 26m0-26-26 26m119 48 26 26m0-26-26 26m-172 46 26 26m0-26-26 26" /></g>
          <g stroke="#eee3c3" strokeWidth="11"><circle cx="205" cy="72" r="18" /><circle cx="205" cy="145" r="18" /><circle cx="205" cy="218" r="18" /></g>
          <path d="M205 51v188" stroke="#eee3c3" strokeWidth="3" opacity=".5" />
        </g>
        <path d="m65 76 4-14 4 14 14 4-14 4-4 14-4-14-14-4zM335 203l3-10 3 10 10 3-10 3-3 10-3-10-10-3z" fill="#a3ddb7" />
      </svg> : id === 'rps' ? <div className="rps-art"><span className="hand-tile"><HandPeace weight="duotone" /></span><span className="versus-label">VS</span><span className="hand-tile hand-tile-back"><HandPeace weight="duotone" /></span></div> : id === 'speed-quiz' ? <div className="quiz-art"><span className="quiz-sheet"><span>A</span><span>B</span><span>C</span></span><Question weight="fill" className="quiz-question" /></div> : id === 'draw-guess' ? <div className="draw-art"><svg viewBox="0 0 200 140" fill="none"><path d="M25 100c25-100 26 35 54-37s20 72 45 5 12 51 51 0" stroke="currentColor" strokeWidth="9" strokeLinecap="round" /></svg><PencilSimple weight="duotone" /></div> : <div className="bolt-art"><span className="bolt-orbit" /><span className="bolt-orbit second-orbit" /><Lightning weight="fill" /></div>}
    </div>
  );
}

export function GameCard({ game }: { game: GameDefinition }) {
  if (game.isComingSoon) return <article className="upcoming-game"><span className="upcoming-icon"><GameController size={22} aria-hidden="true" /></span><div><h3>{game.name}</h3><p>{game.category}</p></div><span className="soon-label">In the works</span></article>;

  return (
    <article className="game-card">
      <Link className="game-art-link" to="/create-room" state={{ gameId: game.id }} aria-label={`Play ${game.name}`}><GameArtwork id={game.id} /><span className="art-category">{game.category === 'Reaction / Skill' ? 'Quick reflexes' : game.category === 'Drawing / Creativity' ? 'Creative' : game.category}</span><span className="art-open"><ArrowUpRight size={20} aria-hidden="true" /></span></Link>
      <div className="game-card-body">
        <div className="game-meta"><span><Users size={14} aria-hidden="true" />{game.maxPlayers === 2 ? '1–2' : `${game.minPlayers}–${game.maxPlayers}`} players</span><span><Clock size={14} aria-hidden="true" />{game.estimatedDuration}</span></div>
        <h3>{game.name}</h3>
        <p className="game-description">{game.description}</p>
        <div className="game-actions"><Link className="card-play" to="/create-room" state={{ gameId: game.id }}>Play with friends<ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only"> — {game.name}</span></Link>{game.supportedModes.includes('Solo') && <Link className="card-solo" to="/create-room" state={{ gameId: game.id, solo: true }}>Go solo<span className="sr-only"> — {game.name}</span></Link>}</div>
      </div>
    </article>
  );
}
