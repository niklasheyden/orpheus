import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Building2, BookOpen, Heart, Headphones, ListMusic, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { Podcast, Profile } from '../lib/types';
import PodcastCard from '../components/PodcastCard';
import EditProfileForm from '../components/EditProfileForm';
import { useSubscription } from '../hooks/useSubscription';

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { subscription } = useSubscription();

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      
      try {
        // First try to fetch existing profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!data && !error) {
          const newProfile: Omit<Profile, 'updated_at'> = {
            id: user.id,
            name: '',
            affiliation: '',
            research_interests: '',
            avatar_url: null,
            banner_background: null
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) throw createError;
          return createdProfile;
        }

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching/creating profile:', error);
        throw error;
      }
    },
    enabled: !!user
  });

  // Fetch user's podcasts
  const { data: userPodcasts, isLoading: isLoadingPodcasts } = useQuery<Podcast[]>({
    queryKey: ['user-podcasts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      // Get total listening time
      const { data: listens } = await supabase
        .from('listens')
        .select('duration')
        .eq('user_id', user.id);
      
      const totalListeningTime = Math.round((listens?.reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0) / 3600);

      // Get likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Get playlist count
      const { count: playlistCount } = await supabase
        .from('playlists')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Get category breakdown
      const { data: categoryData } = await supabase
        .from('listens')
        .select(`
          podcasts (
            field_of_research
          )
        `)
        .eq('user_id', user.id);

      const categories = (categoryData || []).reduce((acc: Record<string, number>, curr: any) => {
        const category = curr.podcasts?.field_of_research || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      const topCategories = Object.entries(categories || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // Get recent activity
      const { data: recentListens } = await supabase
        .from('listens')
        .select('duration, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyHours = Math.round(
        (recentListens
          ?.filter(listen => new Date(listen.created_at) > weekAgo)
          .reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0) / 3600
      );

      const monthlyHours = Math.round(
        (recentListens
          ?.filter(listen => new Date(listen.created_at) > monthAgo)
          .reduce((acc, curr) => acc + (curr.duration || 0), 0) || 0) / 3600
      );

      return {
        listeningTime: totalListeningTime,
        likes: likesCount || 0,
        playlists: playlistCount || 0,
        topCategories,
        weeklyHours,
        monthlyHours
      };
    },
    enabled: !!user
  });

  useEffect(() => {
    if (!user) {
      // Store the return URL in session storage before redirecting to login
      const returnUrl = window.location.pathname + window.location.search;
      sessionStorage.setItem('returnUrl', returnUrl);
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if we have a session_id from Stripe redirect
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Remove the session_id from the URL to keep it clean
      searchParams.delete('session_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Hero Banner */}
      <div className={`relative h-80 ${profile.banner_background || 'bg-[url("/images/banners/neurons.jpg")]'} bg-cover bg-center`}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
        
        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto flex items-end gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-800 transform translate-y-12">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-20 h-20 text-slate-400 m-auto mt-10" />
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 mb-4">
              <h1 className="font-display text-4xl font-bold text-white mb-2">
                {profile.name || 'Anonymous User'}
              </h1>
              <div className="flex items-center gap-6 text-slate-300">
                <p className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-fuchsia-400" />
                  {profile.affiliation || 'No affiliation set'}
                </p>
                <button
                  onClick={() => setShowEditForm(true)}
                  className="px-4 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 font-medium transition-colors backdrop-blur-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Research Interests & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Research Interests */}
          <div className="md:col-span-2 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 backdrop-blur-sm">
            <h2 className="font-display text-lg font-medium text-white mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-fuchsia-400" />
              Research Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.research_interests?.split(',').map((interest, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 text-sm border border-slate-600/50"
                >
                  {interest.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 backdrop-blur-sm">
            <h2 className="font-display text-lg font-medium text-white mb-4">Activity</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Publications</p>
                <p className="text-2xl font-bold text-white">{userPodcasts?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Listens</p>
                <p className="text-2xl font-bold text-white">
                  {userPodcasts?.reduce((acc, podcast) => acc + (podcast.listen_count || 0), 0) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Citations</p>
                <p className="text-2xl font-bold text-white">
                  {userPodcasts?.reduce((acc, podcast) => acc + (podcast.citation_count || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Publications */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 backdrop-blur-sm">
          <h2 className="font-display text-xl font-medium text-white mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-fuchsia-400" />
            Publications
          </h2>

          {/* Loading State */}
          {isLoadingPodcasts && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading publications...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPodcasts && (!userPodcasts || userPodcasts.length === 0) && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No publications yet.</p>
            </div>
          )}

          {/* Publications Grid */}
          {!isLoadingPodcasts && userPodcasts && userPodcasts.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {userPodcasts.map(podcast => (
                <PodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700/50 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-medium text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <EditProfileForm profile={profile} onClose={() => setShowEditForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;