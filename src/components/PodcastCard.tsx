import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Clock, Bookmark, BookmarkCheck, ListMusic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Podcast } from '../lib/types';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PodcastCardProps {
  podcast: Podcast;
  className?: string;
}

const PodcastCard = ({ podcast, className = '' }: PodcastCardProps) => {
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
      className={`group relative block bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 ${className}`}
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <img
          src={podcast.cover_image_url}
          alt={podcast.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
        
        {/* Action Buttons */}
        {user && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleLikeToggle}
              disabled={isUpdating}
              className={`p-2 rounded-xl backdrop-blur-sm bg-slate-800/70 hover:bg-slate-700/70 transition-colors ${
                isUpdating ? 'opacity-50' : ''
              }`}
            >
              <Heart
                className={`w-5 h-5 ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-red-400'
                }`}
              />
            </button>
            <button
              onClick={handlePlaylistToggle}
              disabled={isUpdating}
              className={`p-2 rounded-xl backdrop-blur-sm bg-slate-800/70 hover:bg-slate-700/70 transition-colors ${
                isUpdating ? 'opacity-50' : ''
              }`}
            >
              {isInPlaylist ? (
                <BookmarkCheck className="w-5 h-5 fill-fuchsia-500 text-fuchsia-500" />
              ) : (
                <Bookmark className="w-5 h-5 text-fuchsia-400" />
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="absolute bottom-4 left-4 right-16 flex items-center gap-4 text-sm text-white/90">
          <div className="flex items-center gap-1.5">
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
            <span>{optimisticLikes ?? stats?.likes ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ListMusic className="w-4 h-4 text-fuchsia-400" />
            <span>{stats?.saves || 0}</span>
          </div>
        </div>

        {/* Play Button */}
        <button
          onClick={handlePlayPause}
          className="absolute bottom-4 right-4 p-3.5 bg-fuchsia-500 rounded-full shadow-lg hover:bg-fuchsia-600 transition-all group-hover:scale-110 duration-300 hover:shadow-fuchsia-500/25"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white translate-x-0.5" />
          )}
        </button>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="px-2 py-1 text-xs font-medium text-fuchsia-400 bg-fuchsia-500/10 rounded-lg">
              {podcast.field_of_research}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-400 whitespace-nowrap">
              <Clock className="w-4 h-4 shrink-0" />
              <span>{duration ? formatDuration(duration) : '--:--'}</span>
            </div>
          </div>
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-2 line-clamp-2">
              {podcast.title}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-1">
              {podcast.authors} ({podcast.publishing_year})
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;