import React from 'react';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const RecentPage = () => {
  // Fetch recently released podcasts
  const { data: recentPodcasts, isLoading } = useQuery<Podcast[]>({
    queryKey: ['all-recent-podcasts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching recent podcasts:', error);
        throw error;
      }
    }
  });

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-grid-slate-900 bg-[center_-1px] [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-8 h-8 text-sky-400" />
          <h1 className="font-display text-3xl font-medium text-white">Recently Released</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        ) : recentPodcasts && recentPodcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPodcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400">No recent podcasts found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentPage; 