import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'sb-auth'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js'
    }
  }
});

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.id);
});

// Get initial session
supabase.auth.getSession().then(({ data: { session } }) => {
  console.log('Initial session:', session?.user?.id);
  if (session) {
    // Refresh the session if it exists
    supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error }) => {
      if (error) {
        console.error('Error refreshing session:', error);
      } else {
        console.log('Session refreshed:', refreshedSession?.user?.id);
      }
    });
  }
});

// Only run connection tests in development
if (import.meta.env.DEV) {
  // Test connection silently - don't block app initialization
  (async () => {
    try {
      const { count, error } = await supabase
        .from('podcasts')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.warn('Supabase connection test warning:', error.message);
      } else {
        console.log('Supabase connection successful');
      }
    } catch (err) {
      console.warn('Supabase connection test warning:', err instanceof Error ? err.message : 'Unknown error');
    }
  })();

  // Test storage silently
  (async () => {
    try {
      console.log('Testing storage access...');
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Storage buckets test error:', {
          message: error.message
        });
      } else {
        console.log('Storage buckets:', buckets);
        console.log('Storage access successful');
      }
    } catch (err) {
      console.error('Storage access test error:', err instanceof Error ? {
        message: err.message,
        stack: err.stack
      } : 'Unknown error');
    }
  })();
}