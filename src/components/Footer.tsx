import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, AudioWaveform, Shield, FileText, Info } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <AudioWaveform className="h-6 w-6 text-sky-400" />
              <h3 className="text-lg font-display font-medium text-white">Orpheus</h3>
            </div>
            <p className="text-sm text-slate-400">
              Making Research Accessible.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-sky-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-sky-400 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">
                  Discover
                </Link>
              </li>
              <li>
                <Link to="/generate" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">
                  Generate
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/playlist" className="text-slate-400 hover:text-sky-400 transition-colors text-sm">
                  Playlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/privacy" className="text-slate-400 hover:text-sky-400 transition-colors text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-slate-400 hover:text-sky-400 transition-colors text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/imprint" className="text-slate-400 hover:text-sky-400 transition-colors text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Imprint
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@orpheus.ai"
                  className="text-slate-400 hover:text-sky-400 transition-colors text-sm flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  contact@orpheus.ai
                </a>
              </li>
              <li className="text-slate-400 text-sm">
                <p>Have questions or feedback?</p>
                <p className="mt-1">We'd love to hear from you.</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50">
          <p className="text-sm text-slate-400 text-left">
            © {new Date().getFullYear()} Orpheus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;