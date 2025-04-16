import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Clock, Bookmark, BookmarkCheck, ListMusic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface PodcastCardProps {
  podcast: Podcast;
  className?: string;
}

const PodcastCard: React.FC<PodcastCardProps> = ({ podcast, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [optimisticLikes, setOptimisticLikes] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { currentPodcast, isPlaying: audioPlayerIsPlaying, playPodcast } = useAudioPlayer();
  const isCurrentlyPlaying = currentPodcast?.id === podcast.id && audioPlayerIsPlaying;

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Fetch stats for the podcast
  const { data: stats } = useQuery({
    queryKey: ['podcast-stats', podcast.id],
    queryFn: async () => {
      const [likesResponse, savesResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .eq('podcast_id', podcast.id),
        supabase
          .from('playlists')
          .select('id', { count: 'exact' })
          .eq('podcast_id', podcast.id)
      ]);

      const likes = likesResponse.count || 0;
      // Initialize optimistic likes with the real count
      if (optimisticLikes === null) {
        setOptimisticLikes(likes);
      }

      return {
        likes,
        saves: savesResponse.count || 0
      };
    }
  });

  // Check if podcast is in playlist and liked
  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;

      // Check playlist status
      const { data: playlistData } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('podcast_id', podcast.id)
        .single();

      setIsInPlaylist(!!playlistData);

      // Check like status
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('podcast_id', podcast.id)
        .single();

      setIsLiked(!!likeData);
    };

    checkStatus();
  }, [user, podcast.id]);

  // Get audio duration when component mounts
  useEffect(() => {
    const getAudioDuration = async () => {
      try {
        let storagePath = podcast.audio_url;
        if (storagePath.includes('storage/v1/object/public/podcasts/')) {
          storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
        }

        const { data, error } = await supabase
          .storage
          .from('podcasts')
          .createSignedUrl(storagePath, 3600);

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL received');

        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });
        audio.src = data.signedUrl;
      } catch (error) {
        console.error('Error getting audio duration:', error);
      }
    };

    getAudioDuration();
  }, [podcast.audio_url]);

  const handlePlaylistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to add to playlist');
      return;
    }

    try {
      setIsUpdating(true);
      if (isInPlaylist) {
        const { error } = await supabase
          .from('playlists')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', podcast.id);

        if (error) throw error;
        showToast('Removed from playlist');
      } else {
        const { error } = await supabase
          .from('playlists')
          .insert({ user_id: user.id, podcast_id: podcast.id });

        if (error) throw error;
        showToast('Added to playlist');
      }
      setIsInPlaylist(!isInPlaylist);
      queryClient.invalidateQueries({ queryKey: ['playlist'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-stats'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-status'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      // Invalidate user-podcasts query to update impact number on profile
      queryClient.invalidateQueries({ queryKey: ['user-podcasts', podcast.user_id] });
      // Invalidate user-total-likes query to update impact number in real-time
      queryClient.invalidateQueries({ queryKey: ['user-total-likes', podcast.user_id] });
    } catch (error) {
      console.error('Error updating playlist:', error);
      showToast('Failed to update playlist');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to like podcasts');
      return;
    }

    try {
      setIsUpdating(true);
      // Optimistically update the UI
      const newLikeState = !isLiked;
      setIsLiked(newLikeState);
      setOptimisticLikes(prev => (prev ?? 0) + (newLikeState ? 1 : -1));

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', podcast.id);

        if (error) throw error;
        showToast('Removed like');
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, podcast_id: podcast.id });

        if (error) throw error;
        showToast('Added like');
      }

      // Invalidate queries to update the real count
      queryClient.invalidateQueries({ queryKey: ['podcast-stats', podcast.id] });
      queryClient.invalidateQueries({ queryKey: ['podcast-stats'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-status'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      // Invalidate user-podcasts query to update impact number on profile
      queryClient.invalidateQueries({ queryKey: ['user-podcasts', podcast.user_id] });
      // Invalidate user-total-likes query to update impact number in real-time
      queryClient.invalidateQueries({ queryKey: ['user-total-likes', podcast.user_id] });
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setOptimisticLikes(prev => (prev ?? 0) + (isLiked ? 1 : -1));
      console.error('Error updating like:', error);
      showToast('Failed to update like');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!audioRef.current) {
      try {
        let storagePath = podcast.audio_url;
        if (storagePath.includes('storage/v1/object/public/podcasts/')) {
          storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
        }

        const { data, error } = await supabase
          .storage
          .from('podcasts')
          .createSignedUrl(storagePath, 3600);

        if (error) throw error;
        if (!data?.signedUrl) throw new Error('No signed URL received');

        const audio = new Audio(data.signedUrl);
        audio.addEventListener('ended', () => setIsPlaying(false));
        audio.addEventListener('error', () => {
          setAudioError('Error playing audio');
          setIsPlaying(false);
        });
        audioRef.current = audio;
      } catch (error) {
        console.error('Error setting up audio:', error);
        setAudioError('Error loading audio');
        return;
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setAudioError('Error playing audio');
        return;
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      let storagePath = podcast.audio_url;
      if (storagePath.includes('storage/v1/object/public/podcasts/')) {
        storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
      }

      const { data, error } = await supabase
        .storage
        .from('podcasts')
        .download(storagePath);

      if (error) throw error;
      if (!data) throw new Error('No data received');

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${podcast.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading audio:', error);
      setAudioError('Error downloading audio');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/podcast/${podcast.id}`;
    navigator.clipboard.writeText(url);
    showToast('Podcast link copied to clipboard!');
  };

  const handleAuthAction = (e: React.MouseEvent, action: 'like' | 'playlist') => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/auth');
  };

  return (
    <Link
      to={`/podcast/${podcast.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 transition hover:border-white/20 ${className}`}
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        <img
          src={podcast.cover_image_url}
          alt={podcast.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-4">
        {/* Research Field and Duration Row */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-xs font-medium text-fuchsia-500">
            {podcast.field_of_research}
          </span>
          <div className="flex items-center text-slate-400">
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span className="text-xs">{duration ? formatDuration(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-1 line-clamp-2 font-medium text-white">
          {podcast.title}
        </h3>

        {/* Author and Year */}
        <p className="mb-3 line-clamp-1 text-sm text-slate-400">
          {podcast.authors} ({new Date(podcast.created_at).getFullYear()})
        </p>

        {/* Stats and Play Button Row */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            {/* Likes */}
            <div className="flex items-center">
              <div className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10">
                <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-500'}`} />
              </div>
              <span>{optimisticLikes ?? stats?.likes ?? 0}</span>
            </div>

            {/* Plays */}
            <div className="flex items-center">
              <div className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10">
                <Play className="h-3.5 w-3.5 text-sky-500" />
              </div>
              <span>{podcast.listen_count ?? 0}</span>
            </div>

            {/* Bookmarks */}
            <div className="flex items-center">
              <div className="mr-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-fuchsia-500/10">
                <Bookmark className={`h-3.5 w-3.5 ${isInPlaylist ? 'fill-fuchsia-500 text-fuchsia-500' : 'text-fuchsia-500'}`} />
              </div>
              <span>{stats?.saves ?? 0}</span>
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              playPodcast(podcast);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-500 text-white transition hover:bg-fuchsia-600"
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;