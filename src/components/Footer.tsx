import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Branding */}
          <div className="space-y-4 flex flex-col items-center sm:items-start">
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
            <div className="flex space-x-4">
              <a
                href="https://github.com/nstranquist/orpheus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-100"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/nstranquist/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-100"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-semibold text-slate-100">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-sm text-slate-400 hover:text-slate-100">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/discover" className="text-sm text-slate-400 hover:text-slate-100">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/generate" className="text-sm text-slate-400 hover:text-slate-100">
                  Generate
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-slate-400 hover:text-slate-100">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/playlist" className="text-sm text-slate-400 hover:text-slate-100">
                  Playlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-semibold text-slate-100">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-slate-400 hover:text-slate-100">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-slate-400 hover:text-slate-100">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/imprint" className="text-sm text-slate-400 hover:text-slate-100">
                  Imprint
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-semibold text-slate-100">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:contact@orpheusai.io"
                  className="text-sm text-slate-400 hover:text-slate-100"
                >
                  contact@orpheusai.io
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-slate-800/50 pt-8">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Orpheus AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;