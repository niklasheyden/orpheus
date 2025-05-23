import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const TrendingPage = () => {
  // Fetch trending podcasts (most liked in the last 7 days)
  const { data: podcasts, isLoading } = useQuery<Podcast[]>({
    queryKey: ['trending-podcasts-all'],
    queryFn: async () => {
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get podcasts with their like counts from the last 7 days
        const { data: podcasts, error: podcastsError } = await supabase
          .from('podcasts')
          .select(`
            *,
            likes(count)
          `)
          .eq('is_public', true)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (podcastsError) throw podcastsError;

        // Sort podcasts by like count
        const podcastsWithLikeCounts = (podcasts || [])
          .map(podcast => ({
            ...podcast,
            likeCount: podcast.likes[0]?.count || 0
          }))
          .sort((a, b) => b.likeCount - a.likeCount);

        return podcastsWithLikeCounts;
      } catch (error) {
        console.error('Error fetching trending podcasts:', error);
        throw error;
      }
    }
  });

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl font-medium text-white sm:text-4xl flex items-center justify-center gap-3">
            <TrendingUp className="text-fuchsia-400" />
            Trending Now
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Discover what's popular in the last 7 days
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
          </div>
        ) : podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">No podcasts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingPage; 