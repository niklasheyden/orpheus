import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Building2, BookOpen, UserPlus, UserMinus, Headphones, Heart, ListMusic, User } from 'lucide-react';
import type { Profile, Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch profile data
  const { data: profile, isLoading: isLoadingProfile } = useQuery<Profile>({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Fetch user's podcasts
  const { data: userPodcasts, isLoading: isLoadingPodcasts } = useQuery<Podcast[]>({
    queryKey: ['user-podcasts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Check if the current user is following this profile
  const { data: isFollowing, isLoading: isLoadingFollow } = useQuery({
    queryKey: ['is-following', userId],
    queryFn: async () => {
      if (!user) return false;
      
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact' })
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      return count === 1;
    },
    enabled: !!user && user.id !== userId
  });

  // Get follower and following counts
  const { data: followCounts } = useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('following_id', userId),
        supabase
          .from('follows')
          .select('*', { count: 'exact' })
          .eq('follower_id', userId)
      ]);

      return {
        followers: followers.count || 0,
        following: following.count || 0
      };
    }
  });

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['is-following', userId] });
      queryClient.invalidateQueries({ queryKey: ['follow-counts', userId] });
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Profile Header */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 mb-6 shadow-lg">
          <div className="flex items-start gap-6">
            {/* Avatar Section */}
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-display text-2xl font-medium text-white mb-2">{profile?.name || 'Anonymous User'}</h1>
                  <p className="text-slate-400 mb-2 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-fuchsia-400" />
                    {profile?.affiliation || 'No affiliation set'}
                  </p>
                  <p className="text-slate-400 flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-fuchsia-400" />
                    {profile?.research_interests || 'No research interests set'}
                  </p>
                </div>

                {user && user.id !== userId && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isLoadingFollow}
                    className={`
                      px-4 py-2 rounded-xl font-medium flex items-center space-x-2
                      ${isFollowing 
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                        : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white'
                      }
                      transition-all duration-200
                    `}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Follow Stats */}
              <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700/50">
                <div>
                  <span className="text-slate-400">Followers</span>
                  <p className="text-lg font-medium text-white">{followCounts?.followers || 0}</p>
                </div>
                <div>
                  <span className="text-slate-400">Following</span>
                  <p className="text-lg font-medium text-white">{followCounts?.following || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Public Podcasts */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 shadow-lg">
          <h2 className="font-display text-xl font-medium text-white mb-6">Public Podcasts</h2>

          {/* Loading State */}
          {isLoadingPodcasts && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading podcasts...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPodcasts && (!userPodcasts || userPodcasts.length === 0) && (
            <div className="text-center py-8">
              <p className="text-slate-400">No public podcasts yet.</p>
            </div>
          )}

          {/* Podcasts Grid */}
          {!isLoadingPodcasts && userPodcasts && userPodcasts.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {userPodcasts.map(podcast => (
                <PodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 