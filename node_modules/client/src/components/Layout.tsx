import { Outlet, Link } from 'react-router-dom';
export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-emerald-500 p-1.5 rounded-lg text-slate-950 group-hover:bg-emerald-400 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 12h4" />
                <path d="M8 10v4" />
                <path d="M15 13h.01" />
                <path d="M18 11h.01" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">GameHub</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Games</Link>
            <Link to="/join-room" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Join Room</Link>
            <Link to="/create-room" className="text-sm font-medium bg-emerald-500 text-slate-950 px-4 py-2 rounded-full hover:bg-emerald-400 transition-colors transform active:scale-95">
              Create Room
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      
      <footer className="border-t border-white/10 py-8 text-center text-slate-500 text-sm mt-auto">
        <p>Play games instantly. No accounts required.</p>
      </footer>
    </div>
  );
}
