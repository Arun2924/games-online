import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { gamesRegistry, type GameCategory } from '@gamehub/shared';
import { GameCard } from '../components/GameCard';

export function Home() {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    const cats = new Set<GameCategory>();
    gamesRegistry.forEach(g => cats.add(g.category));
    return ['All', ...Array.from(cats).sort()];
  }, []);

  const filteredGames = useMemo(() => {
    return gamesRegistry.filter(g => {
      const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold">Game Collection</h2>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
              />
            </div>

            {/* Filter Categories */}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as GameCategory | 'All')}
                    className={`shrink-0 snap-start px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
