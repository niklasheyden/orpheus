import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import PodcastCard from '../components/PodcastCard';
import { Loader } from '../components/Loader';
import { PlayCircle, ListMusic, Compass } from 'lucide-react';

interface Podcast {
  id: string;
  title: string;
  description: string;
  duration: number;
  cover_url: string;
  audio_url: string;
  created_at: string;
  rating: number;
}

export default function PlaylistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ['playlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // First get all playlist items
      const { data: playlistItems, error: playlistError } = await supabase
        .from('playlists')
        .select('podcast_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (playlistError) {
        console.error('Error fetching playlist:', playlistError);
        return [];
      }

      if (!playlistItems?.length) return [];

      // Then fetch the actual podcasts
      const { data: podcastData, error: podcastError } = await supabase
        .from('podcasts')
        .select('*')
        .in('id', playlistItems.map(item => item.podcast_id));

      if (podcastError) {
        console.error('Error fetching podcasts:', podcastError);
        return [];
      }

      return podcastData || [];
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-dark text-gray-100">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your playlist</h1>
        <button
          onClick={() => navigate('/auth')}
          className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark">
        <Loader />
      </div>
    );
  }

  const hasPodcasts = podcasts && podcasts.length > 0;

  return (
    <div className="min-h-screen bg-dark text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ListMusic className="w-8 h-8 text-fuchsia-500" />
          <h1 className="text-3xl font-bold">Your Playlist</h1>
        </div>

        {hasPodcasts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PlayCircle className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your playlist is empty</h2>
            <p className="text-gray-400 mb-6">Start adding podcasts to your playlist!</p>
            <button
              onClick={() => navigate('/discover')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-400 to-indigo-500 text-white rounded-full px-8 py-3 font-medium hover:shadow-lg hover:shadow-sky-400/20 transition-all"
            >
              <Compass className="w-5 h-5" />
              <span>Discover Podcasts</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 