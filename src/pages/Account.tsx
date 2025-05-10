import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';
import { Lock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, initialized } = useAuth();
  const { subscription, isLoadingSubscription, createCustomerPortalSession } = useSubscription();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion state
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle success message from Stripe redirect
  useEffect(() => {
    if (location.search.includes('success=true')) {
      showToast({
        title: 'Success',
        message: 'Your subscription has been updated successfully!',
        type: 'success',
      });
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, showToast]);

  useEffect(() => {
    const setupSession = async () => {
      const accessToken = searchParams.get('access_token');
      
      if (accessToken) {
        // If we have an access token in the URL, set up the session
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '', // The session will be short-lived
        });

        if (error) {
          console.error('Error setting session:', error);
          navigate('/login');
          return;
        }

        // Remove the access token from the URL
        searchParams.delete('access_token');
        navigate({ search: searchParams.toString() }, { replace: true });
      } else if (!user && initialized) {
        // No access token and no user, redirect to login
        navigate('/login');
      }
    };

    setupSession();
  }, [user, initialized, navigate, searchParams]);

  const handleManageSubscription = async () => {
    if (!user) return;
    await createCustomerPortalSession({
      userId: user.id,
      returnUrl: `${window.location.origin}/account`
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      showToast({
        title: 'Error',
        message: 'Passwords do not match',
        type: 'error'
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      showToast({
        title: 'Password Updated',
        message: 'Your password has been successfully updated.',
        type: 'success'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }

    if (deleteConfirmation !== 'delete') return;

    try {
      setIsLoading(true);
      
      if (!user?.id) throw new Error('No user found');

      // Call the database function to delete the user
      const { error } = await supabase
        .rpc('delete_user_data', {
          target_user_id: user.id
        });

      if (error) throw error;

      // Sign out the user
      await supabase.auth.signOut();

      showToast({
        title: 'Account Deleted',
        message: 'Your account has been successfully deleted.',
        type: 'success'
      });

      // Navigate to home page after sign out
      navigate('/');
    } catch (error: any) {
      showToast({
        title: 'Error',
        message: error.message,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  // Debug: Log the subscription object
  console.log('Account page subscription:', subscription);

  if (isLoadingSubscription) {
    return (
      <div className="min-h-screen bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="h-32 bg-slate-800 rounded mb-8"></div>
            <div className="h-24 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-8">
          Account Settings
        </h1>

        {/* Subscription Status Card */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
          
          {subscription ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-medium text-white">
                    {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                  </p>
                  <p className="text-slate-400">
                    Status: <span className="text-emerald-500">{subscription.status}</span>
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleManageSubscription}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium"
                  >
                    Manage Subscription
                  </button>
                </div>
              </div>
              
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-400">
                  {subscription.cancel_at_period_end
                    ? `Your subscription will end on ${formatDate(subscription.current_period_end)}`
                    : `Your next billing date is ${formatDate(subscription.current_period_end)}`}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 mb-4">You are currently on the Free plan.</p>
              <Link
                to="/pricing"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

        {/* Account Information Card */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-slate-400">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
            <div>
              <p className="text-slate-400">Account Created</p>
              <p className="text-white">
                {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-sky-500 px-4 py-2 font-medium text-white hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Delete Account Section */}
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Delete Account</h2>
          </div>
          <div className="space-y-4">
            <p className="text-slate-400">
              {isDeleting
                ? 'Are you sure? This action cannot be undone. Type "delete" to confirm.'
                : 'Once you delete your account, there is no going back. Please be certain.'}
            </p>
            {isDeleting && (
              <input
                type="text"
                placeholder='Type "delete" to confirm'
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-white placeholder-red-300/50 focus:border-red-500 focus:outline-none"
              />
            )}
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting && deleteConfirmation !== 'delete'}
              className="w-full rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isDeleting ? 'Confirm Delete Account' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 