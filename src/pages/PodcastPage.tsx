import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Pause, Download, Share2, Calendar, Users, BookOpen, Trash2, Edit, Plus, Minus, Heart, Bookmark, BookmarkCheck, ListMusic, MoreHorizontal, MoreVertical, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import type { Podcast } from '../lib/types';
import { useToast } from '../components/Toast';
import EditPodcastForm from '../components/EditPodcastForm';
import { Loader } from '../components/Loader';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { formatDate } from '../utils/formatDate';

const PodcastPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'abstract'>('summary');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { showToast } = useToast();
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [isUpdatingPlaylist, setIsUpdatingPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { currentPodcast, isPlaying: audioPlayerIsPlaying, playPodcast, togglePlayPause } = useAudioPlayer();
  const [lastPlayTime, setLastPlayTime] = useState<number | null>(null);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const MINIMUM_PLAY_DURATION = 20; // seconds
  const PLAY_COOLDOWN = 300; // 5 minutes in seconds

  const { data: podcast, isLoading, error } = useQuery<Podcast>({
    queryKey: ['podcast', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('Fetched podcast:', data);
      return data;
    }
  });

  const isCurrentlyPlaying = currentPodcast?.id === podcast?.id && audioPlayerIsPlaying;

  const { data: creator } = useQuery({
    queryKey: ['creator', podcast?.user_id],
    queryFn: async () => {
      if (!podcast?.user_id) return { name: "Anonymous User", avatar_url: null };
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', podcast.user_id)
        .single();

      if (error) {
        console.error('Error fetching creator:', error);
        return { name: "Anonymous User", avatar_url: null };
      }

      return { 
        name: data?.name || "Anonymous User",
        avatar_url: data?.avatar_url
      };
    },
    enabled: !!podcast?.user_id
  });

  const { data: playlistStatus } = useQuery({
    queryKey: ['playlist-status', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await supabase
        .from('playlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('podcast_id', id);

      if (error) {
        console.error('Error checking playlist status:', error);
        return false;
      }
      return data && data.length > 0;
    },
    enabled: !!user && !!id
  });

  const { data: stats } = useQuery({
    queryKey: ['podcast-stats', id],
    queryFn: async () => {
      if (!id) return null;
      const [likesResponse, savesResponse] = await Promise.all([
        supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .eq('podcast_id', id),
        supabase
          .from('playlists')
          .select('id', { count: 'exact' })
          .eq('podcast_id', id)
      ]);

      return {
        likes: likesResponse.count || 0,
        saves: savesResponse.count || 0
      };
    }
  });

  useEffect(() => {
    const getSignedUrl = async () => {
      setAudioError(null);
      if (podcast?.audio_url) {
        try {
          let storagePath = podcast.audio_url;
          if (storagePath.includes('storage/v1/object/public/podcasts/')) {
            storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
          }

          const { data, error } = await supabase
            .storage
            .from('podcasts')
            .createSignedUrl(storagePath, 3600);

          if (error) {
            throw new Error(`Error getting signed URL: ${error.message}`);
          }

          if (!data?.signedUrl) {
            throw new Error('No signed URL received from storage');
          }

          setAudioUrl(data.signedUrl);
        } catch (error) {
          console.error('Error processing audio URL:', error);
          setAudioError(error instanceof Error ? error.message : 'Error loading audio file');
          setAudioUrl(null);
        }
      }
    };

    getSignedUrl();
  }, [podcast]);

  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio duration loaded:', audio.duration);
        setDuration(audio.duration);
      });
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
      });
    }
  }, [audioUrl]);

  useEffect(() => {
    if (playlistStatus !== undefined) {
      setIsInPlaylist(playlistStatus);
    }
  }, [playlistStatus]);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user || !id) return;

      // Check like status
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('podcast_id', id)
        .single();

      setIsLiked(!!likeData);
    };

    checkStatus();
  }, [user, id]);

  const recordPlay = useCallback(async () => {
    if (!user || !podcast) {
      console.log('Cannot record play: missing user or podcast', { user, podcast });
      return;
    }
    
    try {
      console.log('Updating listen count...');
      // First get the current listen count
      const { data: currentData, error: fetchError } = await supabase
        .from('podcasts')
        .select('listen_count')
        .eq('id', podcast.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current listen count:', fetchError);
        return;
      }

      const currentCount = currentData?.listen_count || 0;
      console.log('Current listen count:', currentCount);

      // Update listen count
      const { error: updateError } = await supabase
        .from('podcasts')
        .update({ 
          listen_count: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', podcast.id);

      if (updateError) {
        console.error('Error updating listen count:', updateError);
        return;
      }

      console.log('Listen count updated successfully to:', currentCount + 1);

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['podcast', podcast.id] });
      console.log('Queries invalidated, UI should update');
    } catch (error) {
      console.error('Error in recordPlay:', error);
    }
  }, [user, podcast, queryClient]);

  // Monitor play duration only for authenticated users
  useEffect(() => {
    if (!user || !isCurrentlyPlaying || !playStartTime) {
      console.log('Play monitoring inactive:', { isCurrentlyPlaying, playStartTime, isAuthenticated: !!user });
      return;
    }

    console.log('Starting play duration monitoring...');
    const checkPlayDuration = () => {
      const now = Date.now() / 1000;
      const playDuration = now - playStartTime;
      console.log('Current play duration:', Math.round(playDuration), 'seconds');
      
      if (playDuration >= MINIMUM_PLAY_DURATION) {
        console.log('Minimum play duration reached, recording play...');
        recordPlay();
        setPlayStartTime(null);
      }
    };

    const timer = setInterval(checkPlayDuration, 1000);
    return () => {
      clearInterval(timer);
      console.log('Play monitoring cleared');
    };
  }, [isCurrentlyPlaying, playStartTime, recordPlay, user]);

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Allow anyone to play the podcast
    if (!podcast) return;

    console.log('Play clicked:', { isCurrentlyPlaying, currentPodcast: currentPodcast?.id, podcastId: podcast.id });
    const now = Date.now() / 1000;
    
    // Only check cooldown and record plays for authenticated users
    if (user) {
      if (lastPlayTime && now - lastPlayTime < PLAY_COOLDOWN && !isCurrentlyPlaying && currentPodcast?.id !== podcast.id) {
        console.log('Play cooldown active, waiting...');
        showToast(`Please wait before playing again`);
        return;
      }

      // Only set these when starting a completely new play session
      if (!isCurrentlyPlaying && currentPodcast?.id !== podcast.id) {
        setLastPlayTime(now);
        setPlayStartTime(now);
        console.log('Starting new playback, time set:', now);
      }
    }

    // If this podcast is currently loaded in the player
    if (currentPodcast?.id === podcast.id) {
      console.log('Toggling current podcast');
      togglePlayPause();
    } else {
      // If it's a different podcast or no podcast is playing
      console.log('Starting new podcast');
      playPodcast(podcast);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('✨ Podcast link copied to clipboard! Share it with your colleagues.');
  };

  const handleDownload = async () => {
    if (!podcast?.audio_url) return;

    try {
      let storagePath = podcast.audio_url;
      if (storagePath.includes('storage/v1/object/public/podcasts/')) {
        storagePath = storagePath.split('storage/v1/object/public/podcasts/')[1];
      }

      const { data, error } = await supabase
        .storage
        .from('podcasts')
        .download(storagePath);

      if (error) {
        console.error('Error downloading audio:', error);
        return;
      }

      if (data) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${podcast.title}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!podcast || !user) {
      console.error('Delete failed: Invalid user or podcast data', { user, podcast });
      setDeleteError('Unable to delete podcast: Invalid user or podcast data');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Delete the podcast record first
      console.log('Attempting to delete podcast:', podcast.id);
      const { data, error: deleteError } = await supabase
        .rpc('delete_podcast', {
          p_podcast_id: podcast.id,
          p_user_id: user.id
        });

      if (deleteError) {
        console.error('Error deleting podcast:', deleteError);
        throw new Error(`Failed to delete podcast: ${deleteError.message}`);
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['user-podcasts'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['likes'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-stats'] });
      queryClient.invalidateQueries({ queryKey: ['podcast', podcast.id] });

      navigate(`/user/${user.id}`);
      showToast('Podcast deleted successfully');
    } catch (error) {
      console.error('Error in delete process:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete podcast');
      showToast('Failed to delete podcast');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handlePlaylistToggle = async () => {
    if (!user || !podcast) {
      showToast('Please sign in to add to playlist');
      return;
    }

    try {
      setIsUpdatingPlaylist(true);
      if (isInPlaylist) {
        const { error } = await supabase
          .from('playlists')
          .delete()
          .eq('user_id', user.id)
          .eq('podcast_id', podcast.id);

        if (error) throw error;
        setIsInPlaylist(false);
        showToast('Removed from playlist');
      } else {
        const { error } = await supabase
          .from('playlists')
          .insert({ user_id: user.id, podcast_id: podcast.id });

        if (error) throw error;
        setIsInPlaylist(true);
        showToast('Added to playlist');
      }
      // Invalidate both playlist and stats queries
      queryClient.invalidateQueries({ queryKey: ['playlist-status'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['podcast-stats', podcast.id] });
    } catch (error) {
      console.error('Error updating playlist:', error);
      showToast('Failed to update playlist');
    } finally {
      setIsUpdatingPlaylist(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user || !podcast) {
      showToast('Please sign in to like podcasts');
      return;
    }

    try {
      setIsUpdating(true);
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
      setIsLiked(!isLiked);
      // Invalidate the stats query
      queryClient.invalidateQueries({ queryKey: ['podcast-stats', podcast.id] });
    } catch (error) {
      console.error('Error updating like:', error);
      showToast('Failed to update like');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-dark">
        <Loader />
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-dark text-gray-100">
        <h1 className="text-2xl font-bold mb-4">Podcast not found</h1>
        <button
          onClick={() => navigate('/explore')}
          className="px-6 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700 transition-colors"
        >
          Explore Podcasts
        </button>
      </div>
    );
  }

  const canEdit = user && user.id === podcast.user_id;
  console.log('Podcast:', podcast);
  console.log('Podcast creator before render:', creator);
  console.log('User ID from podcast:', podcast?.user_id);

  return (
    <div className="min-h-screen pb-32">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,53,215,0.3),rgba(255,255,255,0))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-16">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between mb-8 text-sm">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-slate-400">PODCAST ID</span>
              <span className="ml-2 text-sky-400 font-mono">{podcast.id.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Share2 size={20} />
            </button>
            {canEdit && (
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowEditForm(true);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
                    >
                      <Edit size={16} />
                      Edit Podcast
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleDeleteClick();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-slate-700"
                    >
                      <Trash2 size={16} />
                      Delete Podcast
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Cover Image */}
              <div className="w-full md:w-64 aspect-square rounded-2xl overflow-hidden bg-slate-800 relative group">
                <img 
                  src={podcast.cover_image_url || '/default-podcast-cover.png'}
                  alt={podcast.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={handlePlayClick}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors flex items-center justify-center text-white">
                    {isCurrentlyPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                  </div>
                </button>
              </div>

              {/* Title and Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-4">{podcast.title}</h1>
                <div className="flex flex-wrap gap-6 text-sm text-slate-400 mb-4">
                  <Link 
                    to={`/user/${podcast.user_id}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700">
                      <img 
                        src={creator?.avatar_url || '/default-avatar.png'} 
                        alt={creator?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>{creator?.name}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Clock size={16} />
                    <span>{duration ? `${Math.ceil(duration / 60)} min` : 'Duration not available'}</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-6 md:mb-6">
                  {/* Likes */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                      <Heart
                        className={`h-4 w-4 ${
                          isLiked ? 'fill-red-500 text-red-500' : 'text-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-slate-400">
                      {stats?.likes ?? 0}
                    </span>
                  </div>

                  {/* Plays */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
                      <Play className="h-4 w-4 text-sky-500" />
                    </div>
                    <span className="text-sm text-slate-400">
                      {podcast.listen_count ?? 0}
                    </span>
                  </div>

                  {/* Bookmarks */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/10">
                      <Bookmark
                        className={`h-4 w-4 ${
                          isInPlaylist ? 'fill-fuchsia-500 text-fuchsia-500' : 'text-fuchsia-500'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-slate-400">
                      {stats?.saves ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {podcast.research_fields?.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1 rounded-full text-sm bg-slate-800 text-slate-300"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Abstract - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block mt-4">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="border-b border-slate-700/50">
                  <div className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'summary'
                          ? 'text-fuchsia-400 border-b-2 border-fuchsia-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      AI Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('abstract')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'abstract'
                          ? 'text-fuchsia-400 border-b-2 border-fuchsia-400'
                          : 'text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      Abstract
                    </button>
                  </div>
                </div>
                <div className="relative">
                  {activeTab === 'summary' ? (
                    <div className="text-slate-300">
                      {podcast.summary ? (
                        <div className="space-y-4">
                          <style>{`
                            .summary-content h2 {
                              font-size: 1.25rem;
                              font-weight: 600;
                              color: white;
                              margin-bottom: 0.5rem;
                              margin-top: 1.5rem;
                            }
                            .summary-content h2:first-child {
                              margin-top: 0;
                            }
                            .summary-content p {
                              color: rgb(203 213 225);
                              margin-bottom: 0.5rem;
                            }
                            .summary-content ul {
                              list-style-type: disc;
                              padding-left: 1.5rem;
                              margin-bottom: 0.5rem;
                            }
                            .summary-content li {
                              color: rgb(203 213 225);
                              margin-bottom: 0.25rem;
                            }
                            .summary-content strong {
                              color: white;
                            }
                          `}</style>
                          <div 
                            className="summary-content"
                            dangerouslySetInnerHTML={{ __html: podcast.summary }}
                          />
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No summary available for this podcast.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-300">
                      {podcast.abstract ? (
                        <div className="space-y-4">
                          <style>{`
                            .summary-content h2 {
                              font-size: 1.25rem;
                              font-weight: 600;
                              color: white;
                              margin-bottom: 0.5rem;
                              margin-top: 1.5rem;
                            }
                            .summary-content h2:first-child {
                              margin-top: 0;
                            }
                            .summary-content p {
                              color: rgb(203 213 225);
                              margin-bottom: 0.5rem;
                            }
                            .summary-content ul {
                              list-style-type: disc;
                              padding-left: 1.5rem;
                              margin-bottom: 0.5rem;
                            }
                            .summary-content li {
                              color: rgb(203 213 225);
                              margin-bottom: 0.25rem;
                            }
                            .summary-content strong {
                              color: white;
                            }
                          `}</style>
                          <div 
                            className="summary-content"
                            dangerouslySetInnerHTML={{ __html: podcast.abstract }}
                          />
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No abstract available for this podcast.</p>
                      )}
                    </div>
                  )}
                  {activeTab === 'summary' && podcast.summary && (
                    <button
                      onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                      className="mt-2 text-fuchsia-400 hover:text-fuchsia-300 transition-colors text-sm font-medium"
                    >
                      {isAbstractExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-4 md:space-y-8">
            {/* Primary Action */}
            <button
              onClick={handlePlayClick}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors rounded-lg text-white font-medium w-full"
            >
              {isCurrentlyPlaying ? (
                <>
                  <Pause size={20} /> Pause
                </>
              ) : (
                <>
                  <Play size={20} /> Play
                </>
              )}
            </button>

            {/* Secondary Actions */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleLikeToggle}
                  disabled={isUpdating}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 ${
                    isLiked ? 'bg-slate-700 text-fuchsia-400' : 'bg-slate-800 text-slate-300'
                  } hover:bg-slate-700 transition-colors rounded-lg font-medium`}
                >
                  <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                  {isLiked ? 'Liked' : 'Like'}
                </button>
                <button
                  onClick={handlePlaylistToggle}
                  disabled={isUpdatingPlaylist}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 ${
                    isInPlaylist ? 'bg-slate-700 text-sky-400' : 'bg-slate-800 text-slate-300'
                  } hover:bg-slate-700 transition-colors rounded-lg font-medium`}
                >
                  <ListMusic size={18} />
                  {isInPlaylist ? 'Added to Playlist' : 'Add to Playlist'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-slate-300 font-medium"
                >
                  <Download size={18} />
                  Download
                </button>
                {podcast.doi && (
                  <a
                    href={`https://doi.org/${podcast.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg text-slate-300 font-medium"
                  >
                    <BookOpen size={18} />
                    View Paper
                  </a>
                )}
              </div>
            </div>

            {/* Author Info Box */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="space-y-6">
                {/* Authors Section */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">AUTHORS</h3>
                  <p className="text-slate-300">
                    {podcast.authors} ({podcast.publishing_year})
                  </p>
                </div>

                {/* Research Field Section */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">RESEARCH FIELD</h3>
                  <p className="text-slate-300">
                    {podcast.field_of_research}
                  </p>
                </div>

                {/* Keywords Section */}
                <div>
                  <h3 className="text-xs font-medium text-slate-400 mb-2">KEYWORDS</h3>
                  <p className="text-slate-300">
                    {podcast.keywords}
                  </p>
                </div>

                {/* DOI Section */}
                {podcast.doi && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 mb-2">DOI</h3>
                    <a 
                      href={`https://doi.org/${podcast.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 transition-colors break-all"
                    >
                      {podcast.doi}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Abstract - Shown on mobile, hidden on desktop */}
          <div className="lg:hidden col-span-1">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="border-b border-slate-700/50">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'summary'
                        ? 'text-fuchsia-400 border-b-2 border-fuchsia-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    AI Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('abstract')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'abstract'
                        ? 'text-fuchsia-400 border-b-2 border-fuchsia-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Abstract
                  </button>
                </div>
              </div>
              <div className="relative">
                {activeTab === 'summary' ? (
                  <div className="text-slate-300">
                    {podcast.summary ? (
                      <div className="space-y-4">
                        <style>{`
                          .summary-content h2 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: white;
                            margin-bottom: 0.5rem;
                            margin-top: 1.5rem;
                          }
                          .summary-content h2:first-child {
                            margin-top: 0;
                          }
                          .summary-content p {
                            color: rgb(203 213 225);
                            margin-bottom: 0.5rem;
                          }
                          .summary-content ul {
                            list-style-type: disc;
                            padding-left: 1.5rem;
                            margin-bottom: 0.5rem;
                          }
                          .summary-content li {
                            color: rgb(203 213 225);
                            margin-bottom: 0.25rem;
                          }
                          .summary-content strong {
                            color: white;
                          }
                        `}</style>
                        <div 
                          className="summary-content"
                          dangerouslySetInnerHTML={{ __html: podcast.summary }}
                        />
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No summary available for this podcast.</p>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-300">
                    {podcast.abstract ? (
                      <div className="space-y-4">
                        <style>{`
                          .summary-content h2 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: white;
                            margin-bottom: 0.5rem;
                            margin-top: 1.5rem;
                          }
                          .summary-content h2:first-child {
                            margin-top: 0;
                          }
                          .summary-content p {
                            color: rgb(203 213 225);
                            margin-bottom: 0.5rem;
                          }
                          .summary-content ul {
                            list-style-type: disc;
                            padding-left: 1.5rem;
                            margin-bottom: 0.5rem;
                          }
                          .summary-content li {
                            color: rgb(203 213 225);
                            margin-bottom: 0.25rem;
                          }
                          .summary-content strong {
                            color: white;
                          }
                        `}</style>
                        <div 
                          className="summary-content"
                          dangerouslySetInnerHTML={{ __html: podcast.abstract }}
                        />
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No abstract available for this podcast.</p>
                    )}
                  </div>
                )}
                {activeTab === 'summary' && podcast.summary && (
                  <button
                    onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
                    className="mt-2 text-fuchsia-400 hover:text-fuchsia-300 transition-colors text-sm font-medium"
                  >
                    {isAbstractExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md mx-4 border border-slate-700/50 shadow-xl">
            <h3 className="text-lg font-display font-medium mb-4 text-white">Delete Podcast</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this podcast? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && podcast && (
        <EditPodcastForm
          podcast={podcast}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default PodcastPage;