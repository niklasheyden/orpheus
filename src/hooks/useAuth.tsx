import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuthInit = () => {
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Check if user is marked as deleted
        if (session.user.user_metadata?.deleted) {
          // Sign out deleted users
          await supabase.auth.signOut();
          return;
        }
      }
    });
  }, []);
}; 