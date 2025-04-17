import React from 'react';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import PodcastCard from '../components/PodcastCard';

const RecentPage = () => {
  // Fetch recently released podcasts
  const { data: podcasts, isLoading } = useQuery<Podcast[]>({
    queryKey: ['recent-podcasts-all'],
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
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl font-medium text-white sm:text-4xl flex items-center justify-center gap-3">
            <Clock className="text-sky-400" />
            Recently Released
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Explore the latest research podcasts
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
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

export default RecentPage; 