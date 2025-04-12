import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Building2, BookOpen, Heart, Headphones, ListMusic, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Podcast, Profile } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

interface ListenWithPodcast {
  podcasts: {
    field_of_research: string;
  }
}

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
            avatar_url: null
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

  const [profileData, setProfileData] = useState<Omit<Profile, 'id' | 'updated_at'>>({
    name: '',
    affiliation: '',
    research_interests: '',
    avatar_url: null
  });

  // Update local state when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        affiliation: profile.affiliation || '',
        research_interests: profile.research_interests || '',
        avatar_url: profile.avatar_url
      });
    }
  }, [profile]);

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

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          affiliation: profileData.affiliation,
          research_interests: profileData.research_interests
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    try {
      setIsUploading(true);
      setSaveError(null);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    try {
      setIsUploading(true);
      setSaveError(null);

      // Delete the file from storage
      const filePath = profile.avatar_url.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${filePath}`]);
      }

      // Update the profile to remove the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
    } catch (error) {
      console.error('Error removing avatar:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
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
            <div className="relative">
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
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <label className="cursor-pointer p-2 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-white" />
                  </label>
                  {profile?.avatar_url && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1">
              {saveError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400">{saveError}</p>
                </div>
              )}

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      <User className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                        transition duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      <Building2 className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                      Affiliation
                    </label>
                    <input
                      type="text"
                      name="affiliation"
                      value={profileData.affiliation || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                        transition duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      <BookOpen className="inline h-4 w-4 mr-1 text-fuchsia-400" />
                      Research Interests
                    </label>
                    <textarea
                      name="research_interests"
                      value={profileData.research_interests || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50
                        transition duration-200 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="font-display text-2xl font-medium text-white mb-2">{profileData.name || 'Anonymous User'}</h1>
                  <p className="text-slate-400 mb-2 flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-fuchsia-400" />
                    {profileData.affiliation || 'No affiliation set'}
                  </p>
                  <p className="text-slate-400 flex items-center">
                    <BookOpen className="h-4 w-4 mr-1 text-fuchsia-400" />
                    {profileData.research_interests || 'No research interests set'}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  disabled={isSaving}
                  className={`
                    px-4 py-2 rounded-xl font-medium flex items-center space-x-2
                    ${isSaving 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                      : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/50'
                    }
                    transition-all duration-200
                  `}
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  )}
                  {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div className="mb-16">
          <div className="grid gap-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Listening Time */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-fuchsia-500/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-fuchsia-500/20 rounded-lg">
                    <Headphones className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-medium text-fuchsia-400">{stats?.listeningTime || 0}h</span>
                    <p className="text-sm text-slate-400">Total Listening Time</p>
                  </div>
                </div>
              </div>

              {/* Liked Podcasts */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-sky-500/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-sky-500/20 rounded-lg">
                    <Heart className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-medium text-sky-400">{stats?.likes || 0}</span>
                    <p className="text-sm text-slate-400">Liked Podcasts</p>
                  </div>
                </div>
              </div>

              {/* Playlists */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-indigo-500/20">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg">
                    <ListMusic className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-medium text-indigo-400">{stats?.playlists || 0}</span>
                    <p className="text-sm text-slate-400">In Playlist</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Most Listened Categories */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-display text-xl font-medium text-white mb-6">Top Categories</h3>
                <div className="space-y-4">
                  {stats?.topCategories.map((category, index) => (
                    <div key={category.name} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">{category.name}</span>
                        <span className="text-fuchsia-400">{category.count} podcasts</span>
                      </div>
                      <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-fuchsia-500/50 rounded-full"
                          style={{ 
                            width: `${(category.count / (stats.topCategories[0]?.count || 1)) * 100}%`,
                            backgroundColor: index === 0 ? 'rgb(217, 70, 239, 0.5)' : 
                                           index === 1 ? 'rgb(14, 165, 233, 0.5)' : 
                                           'rgb(99, 102, 241, 0.5)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-display text-xl font-medium text-white mb-6">Listening Activity</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Last 7 Days</span>
                      <span className="text-sky-400">{stats?.weeklyHours || 0} hours</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500/50 rounded-full"
                        style={{ 
                          width: `${((stats?.weeklyHours || 0) / (stats?.monthlyHours || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Last 30 Days</span>
                      <span className="text-indigo-400">{stats?.monthlyHours || 0} hours</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500/50 rounded-full w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">Total</span>
                      <span className="text-fuchsia-400">{stats?.listeningTime || 0} hours</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-fuchsia-500/50 rounded-full w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Podcasts */}
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 shadow-lg">
          <h2 className="font-display text-xl font-medium text-white mb-6">My Podcasts</h2>

          {/* Loading State */}
          {isLoadingPodcasts && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 mx-auto"></div>
              <p className="mt-4 text-slate-400">Loading your podcasts...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPodcasts && (!userPodcasts || userPodcasts.length === 0) && (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">You haven't created any podcasts yet.</p>
              <Link
                to="/generate"
                className="inline-block px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-medium shadow-lg shadow-fuchsia-500/25 hover:shadow-fuchsia-500/50 transition-all duration-200"
              >
                Create Your First Podcast
              </Link>
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

export default Profile;