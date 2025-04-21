import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Clock, Gift, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Waitlist = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      console.log('Checking for existing email:', email);
      // Check if email already exists
      const { data: existingEmail, error: existingError } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .single();

      if (existingError) {
        console.log('Error checking existing email:', existingError);
      }

      console.log('Existing email check result:', existingEmail);

      if (existingEmail) {
        setError('This email is already on the waitlist.');
        return;
      }

      console.log('Inserting new waitlist entry');
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([{ 
          email, 
          status: 'pending', 
          joined_at: new Date().toISOString() 
        }]);

      if (insertError) {
        console.log('Error inserting waitlist entry:', insertError);
        throw insertError;
      }

      console.log('Successfully added to waitlist');
      setShowSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .single();

      if (error || !data) {
        setError('Invalid invitation code.');
        return;
      }

      if (data.used) {
        setError('This invitation code has already been used.');
        return;
      }

      // Mark invitation code as used
      await supabase
        .from('invite_codes')
        .update({ used: true, used_at: new Date() })
        .eq('code', inviteCode);

      // Redirect to sign up page with the invite code
      navigate(`/auth?invite=${inviteCode}`);
    } catch (error) {
      console.error('Error:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl sm:text-6xl font-display font-medium mb-6">
            Transform Your Research into{' '}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
              Engaging Podcasts
            </span>
          </h1>
          <p className="text-lg text-slate-400">
            Join researchers who are revolutionizing how scientific knowledge is shared. 
            Be among the first to try Orpheus and shape the future of research communication.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Waitlist Section */}
          <div className="bg-gradient-to-r from-sky-400/10 to-indigo-500/10 backdrop-blur-xl rounded-2xl p-8 border border-sky-400/20 md:col-span-2">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-medium mb-6 flex items-center gap-3">
                <Clock className="w-8 h-8 text-sky-400" />
                <span>Join the Private Beta</span>
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                We're gradually opening access to ensure the best experience for all users. 
                Join our waitlist today and get early access to shape the future of research communication.
              </p>
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-lg px-4 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
                <Users className="w-4 h-4" />
                <span>324 researchers already on the waitlist</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-medium mb-2">🎙️ AI-Powered Podcast Creation</h3>
              <p className="text-sm text-slate-400">Transform your research papers into engaging podcasts with our advanced AI technology.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-medium mb-2">🔒 Full Privacy Control</h3>
              <p className="text-sm text-slate-400">Choose who can access your research podcasts with flexible privacy settings.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-medium mb-2">📊 Research Impact Tracking</h3>
              <p className="text-sm text-slate-400">Monitor the reach and engagement of your research through detailed analytics.</p>
            </div>
          </div>

          {/* Invitation Code Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
            <h2 className="text-xl font-medium mb-4 flex items-center gap-3">
              <Gift className="w-6 h-6 text-indigo-400" />
              <span>Have an Invite Code?</span>
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Get immediate access to Orpheus with an invitation code.
            </p>
            <form onSubmit={handleInviteCodeSubmit} className="space-y-4">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your invite code"
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-indigo-400 to-purple-500 text-white rounded-lg px-4 py-3 font-medium hover:shadow-lg hover:shadow-indigo-400/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Get Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 max-w-5xl mx-auto">
            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md mx-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-400/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-medium">You're on the List!</h3>
              </div>
              <p className="text-slate-400 mb-6">
                Help us create the perfect platform for you by taking our quick survey. 
                As a thank you, you'll get priority access to Orpheus.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-1 bg-slate-700 text-white rounded-lg px-4 py-3 font-medium hover:bg-slate-600 transition-all"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    navigate('/survey');
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg px-4 py-3 font-medium hover:shadow-lg hover:shadow-emerald-400/20 transition-all"
                >
                  Take Survey
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waitlist; 