import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { Settings, Lock, Trash2, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

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
      onClose();
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
      
      const user = (await supabase.auth.getUser()).data.user;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Password Change Section */}
          <div className="space-y-4 rounded-xl bg-slate-800/50 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-400" />
              <h3 className="font-medium text-white">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
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
          <div className="space-y-4 rounded-xl bg-red-500/10 p-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              <h3 className="font-medium text-white">Delete Account</h3>
            </div>
            <p className="text-sm text-slate-400">
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
};

export default SettingsModal; 