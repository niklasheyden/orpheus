import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Profile from './pages/Profile';
import PodcastPage from './pages/PodcastPage';
import Auth from './pages/Auth';
import Discover from './pages/Discover';
import { ToastProvider } from './components/Toast';
import PlaylistPage from './pages/PlaylistPage';
import UserProfile from './pages/UserProfile';
import TrendingPage from './pages/TrendingPage';
import MostLikedPage from './pages/MostLikedPage';
import RecentPage from './pages/RecentPage';
import Waitlist from './pages/Waitlist';
import Survey from './pages/Survey';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Imprint from './pages/Imprint';
import { AudioPlayerProvider } from './hooks/useAudioPlayer';
import StickyPlayer from './components/StickyPlayer';
import { useAuthInit } from './hooks/useAuth';
import ScrollToTop from './components/ScrollToTop';
import { supabase } from './lib/supabase';
import Verify from './pages/auth/Verify';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import Account from './pages/Account';
import SubscriptionSuccess from './pages/SubscriptionSuccess';

const queryClient = new QueryClient();

// Auth initialization component
const AuthInit: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useAuthInit();
  return <>{children}</>;
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <AuthInit>
          <AudioPlayerProvider>
            <ToastProvider>
              <div className="min-h-screen bg-slate-950 selection:bg-sky-500/90 selection:text-white">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-slate-950" />
                <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
                
                <div className="relative">
                  <Navbar session={session} />
                  <main className="relative">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<Home />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/waitlist" element={<Waitlist />} />
                      <Route path="/podcast/:id" element={<PodcastPage />} />
                      <Route path="/survey" element={<Survey />} />
                      <Route path="/auth/verify" element={<Verify />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/imprint" element={<Imprint />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                      <Route path="/user/:userId" element={<UserProfile />} />

                      {/* Protected Routes */}
                      {session ? (
                        <>
                          <Route path="/discover" element={<Discover />} />
                          <Route path="/generate" element={<Generate />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/playlist" element={<PlaylistPage />} />
                          <Route path="/trending" element={<TrendingPage />} />
                          <Route path="/most-liked" element={<MostLikedPage />} />
                          <Route path="/recent" element={<RecentPage />} />
                          <Route path="/onboarding" element={<Onboarding />} />
                          <Route path="/account" element={<Account />} />
                        </>
                      ) : (
                        // Redirect all protected routes to waitlist
                        <>
                          <Route path="/discover" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/generate" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/profile" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/playlist" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/user/:userId" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/trending" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/most-liked" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/recent" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/onboarding" element={<Navigate to="/waitlist" replace />} />
                          <Route path="/account" element={<Navigate to="/waitlist" replace />} />
                        </>
                      )}
                    </Routes>
                  </main>
                  <Footer />
                  <StickyPlayer />
                </div>
              </div>
            </ToastProvider>
          </AudioPlayerProvider>
        </AuthInit>
      </Router>
    </QueryClientProvider>
  );
}

export default App;