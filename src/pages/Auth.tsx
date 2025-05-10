import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AudioWaveform, Mail, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const emailParam = searchParams.get('email');
  
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(searchParams.get('signup') === 'true');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteValid, setInviteValid] = useState(false);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteCode) {
      checkInviteCode();
    }
  }, [inviteCode]);

  const checkInviteCode = async () => {
    setIsCheckingInvite(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .eq('is_used', false)
        .single();

      if (error) throw error;

      if (data) {
        setInviteValid(true);
        setIsSignUp(true);
        if (data.email) {
          setEmail(data.email);
        } else if (emailParam) {
          setEmail(emailParam);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Invalid or expired invitation code.');
    } finally {
      setIsCheckingInvite(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isSignUp) {
        // Check if passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }

        // Check if invite code is required and valid
        if (!inviteCode) {
          setError('An invitation code is required to sign up.');
          return;
        }

        if (!inviteValid) {
          setError('Invalid or expired invitation code.');
          return;
        }

        // Sign up
        console.log('Signing up with:', email, password);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              invite_code: inviteCode
            }
          }
        });

        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No user data returned after sign up');

        // Mark invite code as used
        const { error: updateError } = await supabase
          .from('invite_codes')
          .update({ 
            is_used: true, 
            used_at: new Date().toISOString(),
            used_by: signUpData.user.id,
            email: email 
          })
          .eq('code', inviteCode);

        if (updateError) throw updateError;

        // If email confirmation is required, redirect to verify page
        if (!signUpData.user.confirmed_at) {
          navigate('/auth/verify');
          return;
        }

        // Sign in immediately after signup (if confirmed)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (!signInData.user) throw new Error('No user data returned after sign in');

        // Redirect to onboarding after successful signup and sign in
        navigate('/onboarding');
      } else {
        // Sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) throw signInError;
        if (!signInData.user) throw new Error('No user data returned after sign in');

        // Redirect to user profile page after sign in
        navigate(`/user/${signInData.user.id}`);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingInvite) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span>Verifying invitation code...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12">
      <div className="max-w-md mx-auto px-4">
        {isSignUp ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-medium mb-3">Create Your Account</h1>
              <p className="text-slate-400">Join the future of research communication</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/50">
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
                    disabled={inviteValid && email !== ''}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                      transition duration-200 disabled:opacity-50"
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

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                      <Lock className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                        transition duration-200"
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 text-white py-2.5 px-4 rounded-xl font-medium
                    hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:ring-offset-2 focus:ring-offset-slate-800
                    shadow-lg shadow-sky-400/20 hover:shadow-sky-400/40 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-slate-400 hover:text-white text-sm transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-medium mb-3">Welcome Back</h1>
              <p className="text-slate-400">Sign in to your account</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/50">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                    <Mail className="inline h-4 w-4 mr-1 text-sky-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50
                      transition duration-200"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                    <Lock className="inline h-4 w-4 mr-1 text-sky-400" />
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50
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
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-sky-400/80 to-indigo-500/80 text-white py-2.5 px-4 rounded-xl font-medium
                    hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-2 focus:ring-offset-slate-800
                    shadow-lg shadow-sky-400/20 hover:shadow-sky-400/40 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>

              {inviteCode && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;