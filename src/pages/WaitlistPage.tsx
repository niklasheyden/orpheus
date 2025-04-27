import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const WaitlistPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);

      if (error) throw error;
      setMessage('Thanks for joining the waitlist! Redirecting to sign in...');
      setEmail('');
      // Redirect to auth page after a short delay
      setTimeout(() => {
        navigate('/auth');
      }, 1500);
    } catch (error) {
      setMessage('Error joining waitlist. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F15] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Join the Waitlist</h2>
          <p className="mt-2 text-sm text-slate-400">
            Be among the first to experience Orpheus when we launch.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-slate-700/50 placeholder-slate-400 text-white rounded-lg bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent sm:text-sm"
              placeholder="Enter your email"
            />
          </div>

          {message && (
            <div className="text-sm text-center">
              <p className={message.includes('Error') ? 'text-red-400' : 'text-green-400'}>
                {message}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg px-6 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Joining...' : 'Join the Waitlist'}
          </button>

          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0B0F15] text-slate-400">or</span>
              </div>
            </div>
            
            <a
              href="https://forms.gle/YOUR_SURVEY_LINK"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-6 py-3 font-medium transition-all border border-slate-700/50"
            >
              Answer Survey to Skip the Wait
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaitlistPage; 