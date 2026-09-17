import { useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, GameController, Plus } from '@phosphor-icons/react';

export function Layout() {
  const { pathname } = useLocation();
  const inRoom = pathname.startsWith('/room/');

  useEffect(() => {
    const title = pathname === '/' ? 'Your next good time' : pathname === '/create-room' ? 'Create a room' : pathname === '/join-room' ? 'Join your friends' : 'Game room';
    document.title = `${title} · GameHub`;
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="page-container header-inner">
          {inRoom ? <span className="brand"><span className="brand-mark"><GameController size={24} weight="fill" aria-hidden="true" /></span>GameHub<span className="brand-dot">.</span></span> : <Link to="/" className="brand" aria-label="GameHub home"><span className="brand-mark"><GameController size={24} weight="fill" aria-hidden="true" /></span>GameHub<span className="brand-dot">.</span></Link>}
          {!inRoom && <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end className="nav-link">The arcade</NavLink>
            <NavLink to="/join-room" className="nav-link">Join room<ArrowUpRight size={15} aria-hidden="true" /></NavLink>
            <NavLink to="/create-room" className="btn btn-primary nav-create"><Plus size={17} weight="bold" aria-hidden="true" />Create room</NavLink>
          </nav>}
          {inRoom && <span className="header-caption">A little friendly competition.</span>}
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content"><Outlet /></main>
      {!inRoom && <footer className="site-footer page-container">
        <div><Link to="/" className="footer-brand">GameHub.</Link><p>Less scrolling. More playing.</p></div>
        <span>Free to play. Better together.</span>
        <Link to="/join-room" className="footer-link">Your friends are one code away<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </footer>}
    </div>
  );
}
