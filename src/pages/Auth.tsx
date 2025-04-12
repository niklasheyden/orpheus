import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioWaveform, Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-3">
              <AudioWaveform className="h-8 w-8 text-sky-400" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500">
                Orpheus
              </span>
            </div>
          </div>
          <h1 className="font-display text-3xl font-medium text-white">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-slate-400">
            {isSignUp ? 'Start turning research into podcasts' : 'Sign in to continue to Orpheus'}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 md:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                <Mail className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                  transition duration-200"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                <Lock className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                  transition duration-200"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 text-white py-2.5 px-4 rounded-xl font-medium
                hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:ring-offset-2 focus:ring-offset-slate-800
                shadow-lg shadow-sky-400/20 hover:shadow-sky-400/40 transition-all duration-200"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;