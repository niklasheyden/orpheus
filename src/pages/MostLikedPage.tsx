import React from 'react';
import { Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const MostLikedPage = () => {
  // Fetch most liked podcasts (all time)
  const { data: mostLikedPodcasts, isLoading } = useQuery<Podcast[]>({
    queryKey: ['all-most-liked-podcasts'],
    queryFn: async () => {
      try {
        const { data: podcastsWithLikes, error: countError } = await supabase
          .from('podcasts')
          .select(`
            *,
            likes(count)
          `)
          .eq('is_public', true);
          
        if (countError) throw countError;

        // Sort by like count
        return (podcastsWithLikes || [])
          .map(podcast => ({
            ...podcast,
            likeCount: podcast.likes[0]?.count || 0
          }))
          .sort((a, b) => b.likeCount - a.likeCount);
      } catch (error) {
        console.error('Error fetching most liked podcasts:', error);
        throw error;
      }
    }
  });

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-red-400" />
          <h1 className="font-display text-3xl font-medium text-white">Most Liked</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : mostLikedPodcasts && mostLikedPodcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mostLikedPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">No liked podcasts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MostLikedPage; 