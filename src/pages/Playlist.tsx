import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PodcastCard from '../components/PodcastCard';
import { Loader2 } from 'lucide-react';

const Playlist = () => {
  const { user } = useAuth();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          podcast_id,
          podcasts (
            id,
            title,
            authors,
            abstract,
            cover_image_url,
            audio_url,
            duration,
            rating,
            field_of_research,
            keywords,
            publishing_year,
            doi
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(item => item.podcasts);
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-display font-medium text-gray-100 mb-4">Sign in to view your playlist</h1>
          <p className="text-gray-400">Please sign in to access your saved podcasts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-medium text-gray-100 mb-2">My Playlist</h1>
        <p className="text-gray-400">
          {playlists?.length === 0
            ? "You haven't added any podcasts to your playlist yet."
            : `You have ${playlists?.length} podcast${playlists?.length === 1 ? '' : 's'} in your playlist.`}
        </p>
      </div>

      {playlists && playlists.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlist; 