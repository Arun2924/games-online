import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gamesRegistry, type GameCategory } from '@gamehub/shared';
import { GameCard } from '../components/GameCard';

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'All'>('All');

  const categories = useMemo(() => {
    const cats = new Set<GameCategory>();
    gamesRegistry.forEach(g => cats.add(g.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredGames = useMemo(() => {
    if (selectedCategory === 'All') return gamesRegistry;
    return gamesRegistry.filter(g => g.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 px-4 text-center max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-balance leading-[1.1]">
          Play Games. <span className="text-emerald-400">Together.</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-[40ch] mb-10 leading-relaxed text-balance">
          Simple, fast browser mini-games you can play instantly with friends. No accounts, no downloads.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/create-room" className="bg-emerald-500 text-slate-950 px-8 py-4 rounded-full font-semibold hover:bg-emerald-400 transition-all active:scale-95 text-lg">
            Create Room
          </Link>
          <Link to="/join-room" className="bg-slate-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-slate-700 transition-all active:scale-95 text-lg border border-slate-700">
            Join Room
          </Link>
        </div>
      </section>

      {/* Games Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold">Game Collection</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as GameCategory | 'All')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
