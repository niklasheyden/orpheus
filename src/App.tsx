import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Profile from './pages/Profile';
import PodcastPage from './pages/PodcastPage';
import Auth from './pages/Auth';
import Explore from './pages/Explore';
import Toast from './components/Toast';
import { useAuthInit } from './hooks/useAuth';
import PlaylistPage from './pages/PlaylistPage';
import UserProfile from './pages/UserProfile';

const queryClient = new QueryClient();

function App() {
  useAuthInit();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-slate-950 selection:bg-sky-500/90 selection:text-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-64 bg-gradient-to-b from-slate-950" />
          <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
          
          <div className="relative">
            <Navbar />
            <main className="relative">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/generate" element={<Generate />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/podcast/:id" element={<PodcastPage />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/playlist" element={<PlaylistPage />} />
                <Route path="/user/:userId" element={<UserProfile />} />
              </Routes>
            </main>
            <Footer />
            <Toast />
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;