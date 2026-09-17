import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MagnifyingGlass, Plus, Lightning, Users, GameController, X, Check } from '@phosphor-icons/react';
import { gamesRegistry } from '@gamehub/shared';
import { GameCard, GameArtwork } from '../components/GameCard';

const filters = ['All games', 'Just me', 'With friends', 'Quick rounds'] as const;

export function Home() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All games');
  const [query, setQuery] = useState('');
  const [showUpcoming, setShowUpcoming] = useState(false);
  const available = gamesRegistry.filter(game => !game.isComingSoon);
  const filtered = available.filter(game => {
    const matchesSearch = `${game.name} ${game.description} ${game.category}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'All games' || (filter === 'Just me' && game.supportedModes.includes('Solo')) || (filter === 'With friends' && game.supportedModes.includes('Online')) || (filter === 'Quick rounds' && ['reaction', 'rps', 'tictactoe'].includes(game.id));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="page-container home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow hero-eyebrow"><span className="status-dot" />YOUR NEXT GOOD TIME STARTS HERE</p>
          <h1>Small games.<br />Big <span className="hero-highlight">rivalries.<svg viewBox="0 0 340 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 10Q160-3 335 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span></h1>
          <p className="hero-description">Turn “what should we do?” into one more round.<br className="desktop-break" /> Free browser games for you and your favorite people.</p>
          <div className="hero-actions"><Link className="btn btn-primary" to="/create-room"><Plus size={19} weight="bold" aria-hidden="true" />Create a room</Link><Link className="hero-join" to="/join-room">Got a room code?<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
          <div className="hero-reassurance"><span><Check size={14} aria-hidden="true" />No downloads</span><span><Check size={14} aria-hidden="true" />No sign-ups</span><span><Check size={14} aria-hidden="true" />Just play</span></div>
        </div>
        <Link to="/create-room" state={{ gameId: 'tictactoe' }} className="hero-feature" aria-label="Play featured game Tic Tac Toe">
          <div className="feature-topline"><span className="feature-label">THE FRIENDSHIP TEST</span><span className="feature-number">01 / 05</span></div>
          <GameArtwork id="tictactoe" hero />
          <span className="hero-art-note">Your move, genius.</span>
          <div className="feature-bottom"><div><span className="feature-kicker">A CLASSIC FOR A REASON</span><h2>Tic Tac Toe</h2><p>Three in a row. Infinite rematches.</p></div><span className="feature-arrow"><ArrowUpRight size={25} aria-hidden="true" /></span></div>
        </Link>
      </section>

      <div className="how-strip" aria-label="How to play"><p><span className="strip-icon"><GameController size={21} aria-hidden="true" /></span>A good time, minus the setup.</p><ol><li><span>01</span>Pick a game</li><li><span>02</span>Invite your people</li><li><span>03</span>Settle the score</li></ol></div>

      <section id="games" className="catalog">
        <div className="catalog-heading"><div><p className="eyebrow">THE ARCADE</p><h2>What are we playing?</h2></div><p>{available.length} games. All free. All yours.</p></div>
        <div className="catalog-tools"><div className="filter-list" aria-label="Filter games">{filters.map((item, index) => { const Icon = index === 1 ? GameController : index === 2 ? Users : index === 3 ? Lightning : null; return <button key={item} className={`filter-btn ${filter === item ? 'selected' : ''}`} aria-pressed={filter === item} onClick={() => setFilter(item)}>{Icon && <Icon size={16} aria-hidden="true" />}{item}{index === 0 && <span className="filter-count">{available.length}</span>}</button>; })}</div><div className="catalog-search"><MagnifyingGlass size={18} aria-hidden="true" /><label htmlFor="game-search" className="sr-only">Search games</label><input id="game-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find your next favorite" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</div></div>
        <p className="sr-only" role="status">{filtered.length} games found</p>
        {filtered.length ? <div className="games-grid">{filtered.map(game => <GameCard key={game.id} game={game} />)}</div> : <div className="empty-state"><MagnifyingGlass size={36} aria-hidden="true" /><h3>No games found</h3><p>Try another name or make room for all the games.</p><button className="btn btn-secondary" onClick={() => { setQuery(''); setFilter('All games'); }}>Clear filters</button></div>}
      </section>

      <section className="invite-banner"><span className="invite-art" aria-hidden="true"><Users size={52} weight="duotone" /></span><div><p className="eyebrow">THE GROUP CHAT CAN WAIT</p><h2>Make it a game night.</h2><p>One room. One link. Everyone’s invited.</p></div><Link className="btn btn-primary" to="/create-room">Get the gang together<ArrowRight size={18} aria-hidden="true" /></Link></section>
      <section className="upcoming-section"><button className="upcoming-toggle" onClick={() => setShowUpcoming(value => !value)} aria-expanded={showUpcoming} aria-controls="upcoming-games"><span>Good things are on the way<span className="upcoming-count">{gamesRegistry.filter(game => game.isComingSoon).length} games in the works</span></span><Plus size={21} className={showUpcoming ? 'rotate-45' : ''} aria-hidden="true" /></button><div id="upcoming-games" hidden={!showUpcoming}><div className="upcoming-grid">{gamesRegistry.filter(game => game.isComingSoon).map(game => <GameCard key={game.id} game={game} />)}</div></div></section>
    </div>
  );
}
