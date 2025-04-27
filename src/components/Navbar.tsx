import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AudioWaveform, Home, Compass, Sparkles, User, LogOut, Menu, X, ListMusic, CreditCard, Settings } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  session: Session | null;
}

const Navbar = ({ session }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/profile' && location.pathname.startsWith('/user/')) {
      return true;
    }
    return location.pathname === path;
  };

  const linkClasses = (path: string) => `
    relative -mx-3 -my-2 rounded-lg px-3 py-2 text-sm transition-colors delay-150 hover:delay-[0ms]
    ${isActive(path)
      ? 'text-sky-400'
      : 'text-slate-400 hover:text-slate-100'
    }
  `;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50">
      <div className="relative z-40 mx-auto max-w-7xl px-4 lg:px-8">
        <div className="relative flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative w-6 h-6">
                {/* Center dot */}
                <div className="absolute inset-[35%] rounded-full bg-sky-400"></div>
                
                {/* Static circles */}
                <div className="absolute inset-[15%] rounded-full border border-sky-400/80"></div>
                <div className="absolute inset-[5%] rounded-full border border-sky-400/60"></div>
                <div className="absolute inset-0 rounded-full border border-sky-400/40"></div>
                <div className="absolute -inset-1 rounded-full border border-sky-400/30"></div>
                <div className="absolute -inset-2 rounded-full border border-sky-400/20"></div>
                <div className="absolute -inset-3 rounded-full border border-sky-400/10"></div>
                <div className="absolute -inset-4 rounded-full border border-sky-400/5"></div>

                {/* Animated ripples */}
                <div className="absolute inset-0 rounded-full border border-sky-400/60 animate-ripple-pulse"></div>
                <div className="absolute inset-0 rounded-full border border-sky-400/50 animate-ripple-pulse" style={{ animationDelay: '0.8s' }}></div>
                <div className="absolute inset-0 rounded-full border border-sky-400/40 animate-ripple-pulse" style={{ animationDelay: '1.6s' }}></div>
                <div className="absolute inset-0 rounded-full border border-sky-400/30 animate-ripple-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
                Orpheus
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {session && (
                <>
                  <Link to="/" className={linkClasses('/')}>
                    <Home className="mr-2 h-4 w-4 inline-block" />
                    <span>Home</span>
                  </Link>
                  <Link to="/playlist" className={linkClasses('/playlist')}>
                    <ListMusic className="mr-2 h-4 w-4 inline-block" />
                    <span>Playlist</span>
                  </Link>
                  <Link to="/generate" className={linkClasses('/generate')}>
                    <Sparkles className="mr-2 h-4 w-4 inline-block" />
                    <span>Generate</span>
                  </Link>
                  <Link to={`/user/${session.user.id}`} className={linkClasses('/profile')}>
                    <User className="mr-2 h-4 w-4 inline-block" />
                    <span>Profile</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {session ? (
              <>
                <Link to="/account" className={linkClasses('/account')}>
                  <Settings className="mr-2 h-4 w-4 inline-block" />
                  <span>Account</span>
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
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/waitlist"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2 text-sm font-medium text-white hover:from-sky-300 hover:to-indigo-300 transition-colors"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Get Started</span>
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
        className={`fixed inset-0 z-50 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Full-screen menu */}
        <div 
          className={`fixed inset-0 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Header with close button */}
            <div className="flex items-center justify-end px-4 py-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Menu items */}
            <div className="flex-1 px-6 py-6">
              <div className="flex flex-col space-y-6 bg-slate-900 rounded-xl p-4">
                {session ? (
                  <>
                    <Link
                      to="/"
                      className={`flex items-center px-3 py-3 rounded-lg text-base ${isActive('/') ? 'text-sky-400' : 'text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Home className="mr-3 h-5 w-5" />
                      <span>Home</span>
                    </Link>
                    <Link
                      to="/playlist"
                      className={`flex items-center px-3 py-3 rounded-lg text-base ${isActive('/playlist') ? 'text-sky-400' : 'text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ListMusic className="mr-3 h-5 w-5" />
                      <span>Playlist</span>
                    </Link>
                    <Link
                      to="/generate"
                      className={`flex items-center px-3 py-3 rounded-lg text-base ${isActive('/generate') ? 'text-sky-400' : 'text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Sparkles className="mr-3 h-5 w-5" />
                      <span>Generate</span>
                    </Link>
                    <Link
                      to={`/user/${session.user.id}`}
                      className={`flex items-center px-3 py-3 rounded-lg text-base ${isActive('/profile') ? 'text-sky-400' : 'text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="mr-3 h-5 w-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/account"
                      className={`flex items-center px-3 py-3 rounded-lg text-base ${isActive('/account') ? 'text-sky-400' : 'text-slate-400 hover:text-slate-100'}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      <span>Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-3 py-3 rounded-lg text-base text-slate-400 hover:text-slate-100"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="flex items-center px-3 py-3 rounded-full text-base text-slate-400 hover:text-slate-100 border border-slate-700 bg-slate-800"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="mr-3 h-5 w-5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/waitlist"
                      className="flex items-center px-3 py-3 rounded-full text-base bg-gradient-to-r from-sky-400 to-indigo-400 text-white hover:from-sky-300 hover:to-indigo-300"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Sparkles className="mr-3 h-5 w-5" />
                      <span>Get Started</span>
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