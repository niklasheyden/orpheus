import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AudioWaveform, Home, Compass, Sparkles, User, LogOut, Menu, X, ListMusic } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const linkClasses = (path: string) => `
    relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm transition-colors delay-150 hover:delay-[0ms]
    ${isActive(path)
      ? 'text-sky-400'
      : 'text-slate-400 hover:text-slate-100'
    }
  `;

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="relative z-50">
      <div className="relative z-50 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <AudioWaveform className="h-8 w-8 text-sky-400" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
                Orpheus
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link to="/" className={linkClasses('/')}>
                <Home className="mr-2 h-4 w-4 inline-block" />
                <span>Home</span>
              </Link>
              <Link to="/explore" className={linkClasses('/explore')}>
                <Compass className="mr-2 h-4 w-4 inline-block" />
                <span>Explore</span>
              </Link>
              {user && (
                <>
                  <Link to="/playlist" className={linkClasses('/playlist')}>
                    <ListMusic className="mr-2 h-4 w-4 inline-block" />
                    <span>Playlist</span>
                  </Link>
                  <Link to="/generate" className={linkClasses('/generate')}>
                    <Sparkles className="mr-2 h-4 w-4 inline-block" />
                    <span>Generate</span>
                  </Link>
                  <Link to="/profile" className={linkClasses('/profile')}>
                    <User className="mr-2 h-4 w-4 inline-block" />
                    <span>Profile</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {user ? (
              <button
                onClick={handleSignOut}
                className="relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors delay-150 hover:text-slate-100 hover:delay-[0ms]"
              >
                <LogOut className="mr-2 h-4 w-4 inline-block" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="group relative rounded-full px-4 py-2 text-[13px] text-slate-300 transition-colors hover:text-white bg-slate-800/50 border border-slate-700/50"
                >
                  Create Account
                </Link>
                <Link
                  to="/auth"
                  className="group relative rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-4 py-2 text-[13px] text-white transition-all hover:text-sm"
                >
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative">Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative -mx-2 p-2 text-slate-400 hover:text-slate-100"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur" onClick={() => setIsMobileMenuOpen(false)} />
        <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-slate-900 shadow-lg">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <span className="text-lg font-semibold text-sky-400">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className={linkClasses('/')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="mr-2 h-4 w-4 inline-block" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/explore"
                  className={linkClasses('/explore')}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Compass className="mr-2 h-4 w-4 inline-block" />
                  <span>Explore</span>
                </Link>
                {user ? (
                  <>
                    <Link
                      to="/playlist"
                      className={linkClasses('/playlist')}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ListMusic className="mr-2 h-4 w-4 inline-block" />
                      <span>Playlist</span>
                    </Link>
                    <Link
                      to="/generate"
                      className={linkClasses('/generate')}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Sparkles className="mr-2 h-4 w-4 inline-block" />
                      <span>Generate</span>
                    </Link>
                    <Link
                      to="/profile"
                      className={linkClasses('/profile')}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4 inline-block" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors delay-150 hover:text-slate-100 hover:delay-[0ms]"
                    >
                      <LogOut className="mr-2 h-4 w-4 inline-block" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="group relative rounded-full px-4 py-2 text-[13px] text-slate-300 transition-colors hover:text-white bg-slate-800/50 border border-slate-700/50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Create Account
                    </Link>
                    <Link
                      to="/auth"
                      className="group relative rounded-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 px-4 py-2 text-[13px] text-white transition-all hover:text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="relative">Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;