import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  BookOpen, 
  UserPlus, 
  UserMinus,
  User,
  Globe2,
  BookMarked,
  Share2,
  Award,
  Link as LinkIcon,
  MapPin,
  Mail,
  Twitter,
  Github,
  ExternalLink,
  Instagram,
  Linkedin,
  GraduationCap,
  Edit2,
  Users,
  BookText,
  TrendingUp,
  Zap,
  Plus,
  Compass
} from 'lucide-react';
import type { Profile, Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';
import EditProfileModal from '../components/EditProfileModal';
import { Link } from 'react-router-dom';

// Banner backgrounds inspired by scientific themes
const BANNER_BACKGROUNDS = [
  'bg-[url("/images/banners/neurons.jpg")]',
  'bg-[url("/images/banners/dna.jpg")]',
  'bg-[url("/images/banners/space.jpg")]',
  'bg-[url("/images/banners/molecules.jpg")]',
];

// Status colors mapping
const getStatusColor = (status: string | null): { text: string, dot: string } => {
  switch (status) {
    case 'PhD Student':
      return { text: 'text-amber-400', dot: 'bg-amber-500' };
    case 'Master\'s Student':
      return { text: 'text-indigo-400', dot: 'bg-indigo-500' };
    case 'Postdoctoral Researcher':
      return { text: 'text-purple-400', dot: 'bg-purple-500' };
    case 'Assistant Professor':
      return { text: 'text-pink-400', dot: 'bg-pink-500' };
    case 'Associate Professor':
      return { text: 'text-rose-400', dot: 'bg-rose-500' };
    case 'Professor':
      return { text: 'text-red-400', dot: 'bg-red-500' };
    case 'Research Scientist':
      return { text: 'text-orange-400', dot: 'bg-orange-500' };
    case 'Industry Professional':
      return { text: 'text-blue-400', dot: 'bg-blue-500' };
    case 'Data Scientist':
      return { text: 'text-yellow-400', dot: 'bg-yellow-500' };
    case 'Software Engineer':
      return { text: 'text-lime-400', dot: 'bg-lime-500' };
    case 'Independent Researcher':
      return { text: 'text-green-400', dot: 'bg-green-500' };
    case 'Science Communicator':
      return { text: 'text-emerald-400', dot: 'bg-emerald-500' };
    case 'Science Educator':
      return { text: 'text-teal-400', dot: 'bg-teal-500' };
    case 'Retired Researcher':
      return { text: 'text-cyan-400', dot: 'bg-cyan-500' };
    default:
      return { text: 'text-emerald-400', dot: 'bg-emerald-500' };
  }
};

const EmptyPublications = () => (
  <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] -translate-y-8">
    <Link
      to="/generate"
      className="inline-flex items-center gap-2 w-[280px] justify-center bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full px-6 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all"
    >
      <Plus className="w-5 h-5" />
      <span>Create Your First Podcast</span>
    </Link>
    {/* Temporarily hidden - Discover Podcasts button
    <Link
      to="/discover"
      className="inline-flex items-center gap-2 w-[280px] justify-center bg-slate-800/80 backdrop-blur-sm text-slate-300 hover:text-white rounded-full px-6 py-3 font-medium border border-slate-700/50 hover:bg-slate-800 transition-all"
    >
      <Compass className="w-5 h-5" />
      <span>Discover Podcasts</span>
    </Link>
    */}
  </div>
);

const UserProfile = () => {
  const { user } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sortMode, setSortMode] = useState<'recent' | 'popular'>('recent');
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [totalStats, setTotalStats] = useState<{ likes: number; saves: number }>({ likes: 0, saves: 0 });
  const [searchParams] = useSearchParams();
  const { subscription } = useSubscription();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if we have a session_id from Stripe redirect
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Remove the session_id from the URL to keep it clean
      searchParams.delete('session_id');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

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
    queryKey: ['user-podcasts', userId, user?.id === userId],
    queryFn: async () => {
      let query = supabase
        .from('podcasts')
        .select('*')
        .eq('user_id', userId);

      // Only filter for public podcasts if viewing someone else's profile
      if (user?.id !== userId) {
        query = query.eq('is_public', true);
      }

      // Always sort by created_at in the database query
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // If no data is returned, return an empty array instead of null
      return data || [];
    }
  });

  // Sort podcasts based on the selected mode
  const sortedPodcasts = React.useMemo(() => {
    if (!userPodcasts) return [];
    
    if (sortMode === 'recent') {
      // Sort by created_at in descending order (newest first)
      return [...userPodcasts].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      // Sort by listen_count in descending order (most listened first)
      return [...userPodcasts].sort((a, b) => {
        const listensA = a.listen_count || 0;
        const listensB = b.listen_count || 0;
        return listensB - listensA;
      });
    }
  }, [userPodcasts, sortMode]);

  // Fetch total likes and saves for user's podcasts
  const { data: userTotalStats } = useQuery({
    queryKey: ['user-total-likes', userId],
    queryFn: async () => {
      if (!userPodcasts?.length) return { likes: 0, saves: 0 };
      
      const [likesResponse, savesResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('*', { count: 'exact' })
          .in('podcast_id', userPodcasts.map(p => p.id)),
        supabase
          .from('playlists')
          .select('*', { count: 'exact' })
          .in('podcast_id', userPodcasts.map(p => p.id))
      ]);

      return {
        likes: likesResponse.count || 0,
        saves: savesResponse.count || 0
      };
    }
  });

  // Update totalStats when userTotalStats changes
  useEffect(() => {
    if (userTotalStats) {
      setTotalStats(userTotalStats);
    }
  }, [userTotalStats]);

  // Check if the current user is following this profile
  const { data: followData, isLoading: isLoadingFollowData } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: async () => {
      if (!user?.id) return { isFollowing: false, followCounts: { followers: 0, following: 0 } };
      
      const [followStatus, followerCount, followingCount] = await Promise.all([
        supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single(),
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
        isFollowing: !!followStatus,
        followCounts: {
          followers: followerCount.count || 0,
          following: followingCount.count || 0
        }
      };
    },
    enabled: !!user?.id && !!userId
  });

  // Update follow-related state when query data changes
  useEffect(() => {
    if (followData) {
      setIsFollowing(followData.isFollowing);
      setFollowCounts(followData.followCounts);
    }
  }, [followData]);

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

  const handleProfileUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F15]">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="animate-spin mr-3 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-blue-400 text-sm font-medium">Loading Profile Data</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F15] text-slate-200 antialiased">
      {/* Hero Section */}
      <div 
        className="relative min-h-[90vh] bg-cover bg-fixed bg-center"
        style={{
          backgroundImage: profile?.banner_background?.startsWith('data:image') 
            ? `url('${profile.banner_background}')`
            : profile?.custom_banner_url
              ? `url('${profile.custom_banner_url}')`
              : `url('/images/banners/${profile?.banner_background || 'neurons'}.jpg')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F15]/80 via-[#0B0F15]/50 to-[#0B0F15]" />
        
        {/* Technical Overlay */}
        <div className="absolute inset-0">
          {/* Orbital Lines */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <ellipse cx="50" cy="100" rx="80" ry="25" stroke="url(#orbital-gradient)" strokeWidth="0.1" fill="none" />
              <ellipse cx="50" cy="100" rx="60" ry="18" stroke="url(#orbital-gradient)" strokeWidth="0.1" fill="none" />
              <ellipse cx="50" cy="100" rx="40" ry="12" stroke="url(#orbital-gradient)" strokeWidth="0.1" fill="none" />
              <defs>
                <linearGradient id="orbital-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                  <stop offset="50%" stopColor="rgba(147, 51, 234, 0.1)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Animated Particles */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-300"></div>
            <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-pink-400 animate-pulse delay-700"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 pt-16">
          {/* Mobile Layout - Profile Header */}
          <div className="md:hidden flex flex-col items-center gap-4 mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-lg">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=0B0F15&color=fff`}
                alt={profile?.name || 'User'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-transparent" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent text-center">
              {profile?.name || 'Anonymous User'}
            </h1>
          </div>

          {/* Mobile Layout - Research Interests */}
          <div className="md:hidden w-full mb-1 overflow-hidden">
            <div className="relative overflow-x-auto pb-2">
              <div className="flex space-x-3" style={{ minWidth: 'min-content' }}>
                {profile?.research_interests?.split(',').map((interest, index) => (
                  <span 
                    key={index}
                    className="flex-none px-4 py-2 bg-slate-900/60 backdrop-blur-lg text-slate-200 text-sm rounded-full ring-1 ring-slate-700/50
                      hover:ring-blue-500/50 hover:text-blue-400 transition-all duration-200 cursor-default
                      animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {interest.trim()
                      .replace(/[\[\]"']/g, '') // Remove brackets and quotes
                      .split(' ')
                      .map(word => {
                        // Preserve existing capitalization for acronyms (words with 2 or more uppercase letters)
                        if (word.replace(/[^A-Z]/g, '').length >= 2) {
                          return word;
                        }
                        // Otherwise capitalize first letter only
                        return word.charAt(0).toUpperCase() + word.slice(1);
                      })
                      .join(' ')}
                  </span>
                )) || (
                  <span className="flex-none px-4 py-2 bg-slate-900/60 backdrop-blur-lg text-slate-400 text-sm rounded-full ring-1 ring-slate-700/50">
                    No research interests specified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout - Profile Stats */}
          <div className="md:hidden w-full mb-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="px-4 py-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-400">Role</div>
                <div className="mt-1 flex items-center">
                  {(() => {
                    const statusColor = getStatusColor(profile?.status || null);
                    return (
                      <>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} mr-2 animate-pulse`}></div>
                        <span className={`text-sm ${statusColor.text}`}>{profile?.status || 'PhD Student'}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg">
                <div className="text-xs uppercase tracking-wider text-slate-400">Affiliation</div>
                <div className="mt-1 text-sm">{profile?.affiliation || 'Independent'}</div>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Impact Stats */}
          <div className="md:hidden w-full mb-6">
            <div className="grid grid-cols-3 gap-2">
              <div className="px-3 py-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">{followCounts?.followers || 0}</div>
                <div className="text-xs font-medium text-slate-400">Network</div>
              </div>

              <div className="px-3 py-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-1">
                  <BookText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">{userPodcasts?.length || 0}</div>
                <div className="text-xs font-medium text-slate-400">Publications</div>
              </div>

              <div className="px-3 py-3 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {(totalStats?.likes || 0) + (totalStats?.saves || 0)}
                </div>
                <div className="text-xs font-medium text-slate-400">Impact</div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex flex-row justify-between items-start gap-6">
            {/* Left Side - Profile Stats */}
            <div className="w-auto inline-flex items-center px-4 py-2 bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 rounded-lg">
              <div className="flex flex-nowrap items-center divide-x divide-slate-700/60">
                <div className="px-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Research ID</div>
                  <div className="mt-0.5 font-mono text-sm text-blue-400">{userId?.substring(0, 8).toUpperCase()}</div>
                </div>
                <div className="px-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Role</div>
                  <div className="mt-0.5 flex items-center">
                    {(() => {
                      const statusColor = getStatusColor(profile?.status || null);
                      return (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} mr-2 animate-pulse`}></div>
                          <span className={`text-sm ${statusColor.text}`}>{profile?.status || 'PhD Student'}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="px-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Affiliation</div>
                  <div className="mt-0.5 text-sm">{profile?.affiliation || 'Independent'}</div>
                </div>
              </div>
            </div>

            {/* Right Side - Impact Stats */}
            <div className="w-auto flex flex-nowrap gap-4">
              <div className="relative group flex-none">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-500/20 to-transparent rounded-xl blur-sm group-hover:from-blue-500/30 transition-all duration-300"></div>
                <div className="relative px-5 py-3 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/40 flex items-center space-x-3
                  group-hover:border-blue-500/20 transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white tabular-nums">{followCounts?.followers || 0}</div>
                    <div className="text-xs font-medium text-slate-400">Network</div>
                  </div>
                </div>
              </div>

              <div className="relative group flex-none">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-purple-500/20 to-transparent rounded-xl blur-sm group-hover:from-purple-500/30 transition-all duration-300"></div>
                <div className="relative px-5 py-3 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/40 flex items-center space-x-3
                  group-hover:border-purple-500/20 transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <BookText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white tabular-nums">{userPodcasts?.length || 0}</div>
                    <div className="text-xs font-medium text-slate-400">Publications</div>
                  </div>
                </div>
              </div>

              <div className="relative group flex-none">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-emerald-500/20 to-transparent rounded-xl blur-sm group-hover:from-emerald-500/30 transition-all duration-300"></div>
                <div className="relative px-5 py-3 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/40 flex items-center space-x-3
                  group-hover:border-emerald-500/20 transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white tabular-nums">
                      {(totalStats?.likes || 0) + (totalStats?.saves || 0)}
                    </div>
                    <div className="text-xs font-medium text-slate-400">Impact</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Info - Desktop Only */}
          <div className="hidden md:block mt-12 max-w-7xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-lg">
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=0B0F15&color=fff`}
                  alt={profile?.name || 'User'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-transparent" />
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {profile?.name || 'Anonymous User'}
              </h1>
            </div>
            <div className="flex flex-wrap gap-3 mb-1 justify-start">
              {profile?.research_interests?.split(',').map((interest, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 bg-slate-900/60 backdrop-blur-lg text-slate-200 text-sm rounded-full ring-1 ring-slate-700/50
                    hover:ring-blue-500/50 hover:text-blue-400 transition-all duration-200 cursor-default
                    animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {interest.trim()
                    .replace(/[\[\]"']/g, '') // Remove brackets and quotes
                    .split(' ')
                    .map(word => {
                      // Preserve existing capitalization for acronyms (words with 2 or more uppercase letters)
                      if (word.replace(/[^A-Z]/g, '').length >= 2) {
                        return word;
                      }
                      // Otherwise capitalize first letter only
                      return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ')}
                </span>
              )) || (
                <span className="px-4 py-2 bg-slate-900/60 backdrop-blur-lg text-slate-400 text-sm rounded-full ring-1 ring-slate-700/50">
                  No research interests specified
                </span>
              )}
            </div>
          </div>

          {/* Bio Section - Mobile and Desktop */}
          <div className="mt-2 md:mt-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Bio Section */}
              <div className="w-full lg:w-[400px]">
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/40 p-5 h-auto lg:h-[400px] flex flex-col">
                  <h2 className="text-base font-medium text-white mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-400" />
                    About
                  </h2>
                  <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {profile?.bio || 'This researcher has not added a bio yet.'}
                    </p>
                  </div>
                  
                  {/* Social Links - Now inside About box */}
                  <div className="mt-auto pt-3 md:pt-6 border-t border-slate-700/40">
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      {profile?.website && (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center
                            hover:bg-slate-800 hover:border-blue-500/20 transition-all duration-200 group"
                        >
                          <Globe2 className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                        </a>
                      )}
                      {profile?.github && (
                        <a
                          href={`https://github.com/${profile.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center
                            hover:bg-slate-800 hover:border-purple-500/20 transition-all duration-200 group"
                        >
                          <Github className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
                        </a>
                      )}
                      {profile?.linkedin && (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center
                            hover:bg-slate-800 hover:border-blue-500/20 transition-all duration-200 group"
                        >
                          <Linkedin className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                        </a>
                      )}
                      {profile?.instagram && (
                        <a
                          href={`https://instagram.com/${profile.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center
                            hover:bg-slate-800 hover:border-pink-500/20 transition-all duration-200 group"
                        >
                          <Instagram className="w-4 h-4 text-slate-400 group-hover:text-pink-400" />
                        </a>
                      )}
                      {profile?.research_gate && (
                        <a
                          href={profile.research_gate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center
                            hover:bg-slate-800 hover:border-green-500/20 transition-all duration-200 group"
                        >
                          <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-green-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Publications Section - Mobile and Desktop */}
              <div className="flex-1 min-w-0">
                <div className="relative bg-slate-900/40 backdrop-blur-xl rounded-xl border border-slate-700/40 h-auto lg:h-[400px] flex flex-col">
                  <div className="px-4 pt-4 flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 pr-4">
                    <h2 className="text-base font-medium text-white flex items-center whitespace-nowrap">
                      <BookOpen className="w-4 h-4 mr-2 text-purple-400" />
                      {sortMode === 'recent' ? 'Latest Publications' : 'Popular Publications'}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSortMode('recent')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors duration-200 whitespace-nowrap
                          ${sortMode === 'recent' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700/40 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                      >
                        Recent
                      </button>
                      <button 
                        onClick={() => setSortMode('popular')}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors duration-200 whitespace-nowrap
                          ${sortMode === 'popular' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                            : 'bg-slate-800 text-slate-400 border-slate-700/40 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                      >
                        Popular
                      </button>
                    </div>
                  </div>

                  {/* Mobile Publications - Vertical Layout */}
                  <div className="md:hidden flex flex-col space-y-4 mb-10 overflow-y-auto flex-grow px-4">
                    {isLoadingPodcasts ? (
                      <div className="flex items-center justify-center py-6 px-4">
                        <div className="inline-flex items-center px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="animate-spin mr-2 h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                          <span className="text-blue-400 text-xs">Loading</span>
                        </div>
                      </div>
                    ) : userPodcasts?.length === 0 ? (
                      <EmptyPublications />
                    ) : (
                      sortedPodcasts.map(podcast => (
                        <div key={podcast.id} className="w-full">
                          <PodcastCard podcast={podcast} />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop Publications - Horizontal Scroll */}
                  <div className="hidden md:block flex-grow overflow-hidden">
                    <div className="h-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      <div className="flex space-x-3 h-full pl-4" style={{ minWidth: 'min-content' }}>
                        {isLoadingPodcasts ? (
                          <div className="flex items-center justify-center py-6 px-4">
                            <div className="inline-flex items-center px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <div className="animate-spin mr-2 h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span className="text-blue-400 text-xs">Loading</span>
                            </div>
                          </div>
                        ) : userPodcasts?.length === 0 ? (
                          <EmptyPublications />
                        ) : (
                          sortedPodcasts.map(podcast => (
                            <div key={podcast.id} className="flex-none w-[280px]">
                              <PodcastCard podcast={podcast} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            {userId && (
              <button
                onClick={user ? handleFollowToggle : () => navigate('/waitlist')}
                disabled={isLoadingFollowData}
                className={`absolute top-4 right-4 group inline-flex items-center px-4 py-2 text-xs font-medium transition-all duration-200
                  ${user 
                    ? (isFollowing 
                        ? 'text-slate-400 hover:text-slate-300' 
                        : 'text-white')
                    : 'text-white'
                  }
                `}
              >
                <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                  user
                    ? (isFollowing 
                        ? 'bg-slate-800/80 backdrop-blur-sm group-hover:bg-slate-800' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500')
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-500 group-hover:to-purple-500'
                }`}></div>
                <span className="relative flex items-center">
                  {user ? (
                    isFollowing ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5 mr-1.5" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        Connect
                      </>
                    )
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Sign in to Connect
                    </>
                  )}
                </span>
              </button>
            )}

            {/* Edit Profile Button */}
            {user && user.id === userId && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute top-4 right-4 group inline-flex items-center px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-300 transition-all duration-200"
              >
                <div className="absolute inset-0 rounded-lg bg-slate-800/80 backdrop-blur-sm group-hover:bg-slate-800 transition-all duration-200"></div>
                <span className="relative flex items-center">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Profile
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          profile={profile}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default UserProfile; 