import React, { useState } from 'react';
import { Search, TrendingUp, Zap, BookOpen, ChevronDown, Filter, Heart, Clock, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { Podcast, Profile } from '../lib/types';
import PodcastCard from '../components/PodcastCard';
import { RESEARCH_FIELDS, RESEARCH_FIELD_CATEGORIES } from '../lib/constants';
import { useAuth } from '../hooks/useAuth';

const Explore = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch followed users
  const { data: followedUsers, isLoading: isLoadingFollowed } = useQuery<(Profile & { id: string })[]>({
    queryKey: ['followed-users', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get the IDs of users that the current user follows
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      if (!follows || follows.length === 0) return [];

      // Get the profiles of followed users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', follows.map(f => f.following_id));

      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!user
  });

  // Get the selected field name for display
  const selectedFieldName = selectedField || 'All Fields';

  // Quick filters - most popular fields
  const quickFilters = [
    { name: 'Computer Science', category: 'Computer Science & Technology' },
    { name: 'Artificial Intelligence', category: 'Computer Science & Technology' },
    { name: 'Biology', category: 'Life Sciences' },
    { name: 'Physics', category: 'Physical Sciences' },
    { name: 'Psychology', category: 'Social Sciences' }
  ];

  // Fetch all podcasts with search and field filtering
  const { data: filteredPodcasts, isLoading: isLoadingFiltered, error: filteredError } = useQuery<Podcast[]>({
    queryKey: ['filtered-podcasts', searchTerm, selectedField],
    queryFn: async () => {
      try {
        let query = supabase
          .from('podcasts')
          .select('*')
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,abstract.ilike.%${searchTerm}%,authors.ilike.%${searchTerm}%`);
        }

        if (selectedField) {
          query = query.eq('field_of_research', selectedField);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching podcasts:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000
  });

  // Fetch recently released podcasts (last 7 days)
  const { data: recentPodcasts, isLoading: isLoadingRecent } = useQuery<Podcast[]>({
    queryKey: ['recent-podcasts'],
    queryFn: async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching recent podcasts:', error);
        throw error;
      }
    }
  });

  // Fetch trending podcasts (most liked in the last 30 days)
  const { data: trendingPodcasts, isLoading: isLoadingTrending } = useQuery<Podcast[]>({
    queryKey: ['trending-podcasts'],
    queryFn: async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get podcasts with their like counts
        const { data: podcasts, error: podcastsError } = await supabase
          .from('podcasts')
          .select(`
            *,
            likes(count)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (podcastsError) throw podcastsError;

        // Sort podcasts by like count
        const podcastsWithLikeCounts = (podcasts || []).map(podcast => ({
          ...podcast,
          likeCount: podcast.likes[0]?.count || 0
        })).sort((a, b) => b.likeCount - a.likeCount);

        return podcastsWithLikeCounts;
      } catch (error) {
        console.error('Error fetching trending podcasts:', error);
        throw error;
      }
    }
  });

  // Fetch most liked podcasts
  const { data: mostLikedPodcasts, isLoading: isLoadingMostLiked } = useQuery<Podcast[]>({
    queryKey: ['most-liked-podcasts'],
    queryFn: async () => {
      try {
        const { data: podcastsWithLikes, error: countError } = await supabase
          .from('podcasts')
          .select('*, likes(*)')
          .order('created_at', { ascending: false })
          .limit(6);
          
        if (countError) throw countError;
        return podcastsWithLikes || [];
      } catch (error) {
        console.error('Error fetching most liked podcasts:', error);
        throw error;
      }
    }
  });

  // Determine if we should show the discovery sections or search results
  const showDiscoverySections = !searchTerm && !selectedField;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-medium text-white sm:text-4xl">Explore</h1>
          <p className="mt-2 text-base text-slate-400">Discover research podcasts</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:text-white transition-colors flex items-center justify-between gap-2"
              >
                <span>{selectedFieldName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedField(null);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                        selectedField === null ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      All Fields
                    </button>
                    
                    {RESEARCH_FIELD_CATEGORIES.map((category) => (
                      <div key={category} className="mt-2">
                        <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">{category}</div>
                        {RESEARCH_FIELDS.filter(field => field.category === category).map((field) => {
                          const Icon = field.icon;
                          return (
                            <button
                              key={field.id}
                              onClick={() => {
                                setSelectedField(field.name);
                                setShowDropdown(false);
                              }}
                              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                selectedField === field.name ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-slate-300 hover:bg-slate-700/50'
                              }`}
                            >
                              <Icon size={16} className="text-fuchsia-400" />
                              {field.name}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-4 mb-8">
          <span className="text-sm text-slate-400 mr-2">Quick filters:</span>
          {quickFilters.map((filter) => (
            <button
              key={filter.name}
              onClick={() => setSelectedField(selectedField === filter.name ? null : filter.name)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${selectedField === filter.name
                  ? 'bg-fuchsia-500 text-white'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
            >
              {filter.name}
            </button>
          ))}
        </div>

        {/* Followed Users Section - Moved below search and filters */}
        {user && followedUsers && followedUsers.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-fuchsia-400" />
              Following
            </h2>
            <div className="relative">
              <div className="flex overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                <div className="flex space-x-4">
                  {followedUsers.map((followedUser) => (
                    <Link
                      key={followedUser.id}
                      to={`/user/${followedUser.id}`}
                      className="flex-shrink-0 group"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center ring-2 ring-transparent group-hover:ring-fuchsia-500 transition-all duration-200">
                        {followedUser.avatar_url ? (
                          <img 
                            src={followedUser.avatar_url} 
                            alt={followedUser.name || 'User'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <p className="mt-2 text-sm text-center text-slate-300 group-hover:text-white transition-colors truncate max-w-[4rem]">
                        {followedUser.name || 'Anonymous'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="absolute left-0 top-0 bottom-4 w-4 bg-gradient-to-r from-slate-950 to-transparent" />
              <div className="absolute right-0 top-0 bottom-4 w-4 bg-gradient-to-l from-slate-950 to-transparent" />
            </div>
          </div>
        )}

        {/* Show either discovery sections or search results */}
        {showDiscoverySections ? (
          <>
            {/* Trending Section */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium text-white flex items-center gap-2">
                  <TrendingUp className="text-fuchsia-400" size={24} />
                  Trending Now
                </h2>
                <a href="#" className="text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors">View all</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingTrending ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
                  </div>
                ) : trendingPodcasts && trendingPodcasts.length > 0 ? (
                  trendingPodcasts.map((podcast) => (
                    <PodcastCard key={podcast.id} podcast={podcast} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400">No trending podcasts found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Most Liked Section */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium text-white flex items-center gap-2">
                  <Heart className="text-red-400" size={24} />
                  Most Liked
                </h2>
                <a href="#" className="text-sm text-red-400 hover:text-red-300 transition-colors">View all</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingMostLiked ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                  </div>
                ) : mostLikedPodcasts && mostLikedPodcasts.length > 0 ? (
                  mostLikedPodcasts.map((podcast) => (
                    <PodcastCard key={podcast.id} podcast={podcast} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400">No liked podcasts found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Released Section */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-medium text-white flex items-center gap-2">
                  <Clock className="text-sky-400" size={24} />
                  Recently Released
                </h2>
                <a href="#" className="text-sm text-sky-400 hover:text-sky-300 transition-colors">View all</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoadingRecent ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
                  </div>
                ) : recentPodcasts && recentPodcasts.length > 0 ? (
                  recentPodcasts.map((podcast) => (
                    <PodcastCard key={podcast.id} podcast={podcast} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400">No recent podcasts found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Search Results */
          <div className="mb-12">
            <h2 className="font-display text-2xl font-medium text-white mb-8 text-center">
              {selectedField ? `${selectedField} Podcasts` : 'Search Results'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingFiltered ? (
                <div className="col-span-full flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
                </div>
              ) : filteredError ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-red-400">Failed to load podcasts. Please try again later.</p>
                </div>
              ) : filteredPodcasts && filteredPodcasts.length > 0 ? (
                filteredPodcasts.map((podcast) => (
                  <PodcastCard key={podcast.id} podcast={podcast} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-400">No podcasts found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;