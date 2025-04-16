import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Pause, Download, Share2, Calendar, Users, BookOpen, Trash2, Edit, Plus, Minus, Heart, Bookmark, BookmarkCheck, ListMusic, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import type { Podcast } from '../lib/types';
import { useToast } from '../components/Toast';
import EditPodcastForm from '../components/EditPodcastForm';
import { Loader } from '../components/Loader';

const PodcastPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { showToast } = useToast();
  const [isInPlaylist, setIsInPlaylist] = useState(false);
  const [isUpdatingPlaylist, setIsUpdatingPlaylist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    if (audioRef.current) {
      const audio = audioRef.current;

      const handleTimeUpdate = () => {
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        audio.currentTime = 0;
      };

      const handleError = (e: ErrorEvent) => {
        console.error('Audio element error:', e);
        setAudioError('Error playing audio file');
        setIsPlaying(false);
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
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

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          setAudioError('Failed to play audio file');
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
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
    showToast('Podcast link copied to clipboard!');
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

      navigate('/');
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
      queryClient.invalidateQueries({ queryKey: ['playlist-status'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {deleteError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400">{deleteError}</p>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden mb-8 shadow-xl">
        <div className="relative h-64 md:h-96">
          <img
            src={podcast.cover_image_url}
            alt={podcast.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/70 to-transparent" />
          
          {/* Primary Actions */}
          <div className="absolute top-6 right-6 flex items-center gap-3">
            {user && (
              <>
                <button
                  onClick={handleLikeToggle}
                  disabled={isUpdating}
                  className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm ${
                    isLiked
                      ? 'bg-red-500/90 hover:bg-red-600/90'
                      : 'bg-slate-800/70 hover:bg-slate-700/70'
                  } transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'text-white' : 'text-red-400'}`} />
                </button>
                <button
                  onClick={handlePlaylistToggle}
                  disabled={isUpdatingPlaylist}
                  className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm ${
                    isInPlaylist
                      ? 'bg-fuchsia-500/90 hover:bg-fuchsia-600/90'
                      : 'bg-slate-800/70 hover:bg-slate-700/70'
                  } transition-colors`}
                >
                  {isInPlaylist ? (
                    <BookmarkCheck className="w-5 h-5 text-white" />
                  ) : (
                    <Bookmark className="w-5 h-5 text-fuchsia-400" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* More Menu (Mobile) */}
          {canEdit && (
            <div className="absolute bottom-6 right-6 sm:hidden">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-sm bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-slate-300" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 bottom-12 mb-2 w-48 bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setShowEditForm(true);
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700/50"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteClick();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-slate-700/50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title and Author Section */}
        <div className="p-6 md:p-8 border-b border-slate-700/50">
          {/* Meta Information */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
                <span className="sm:inline hidden">{stats?.likes || 0} likes</span>
                <span className="sm:hidden inline">{stats?.likes || 0}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ListMusic className="w-4 h-4 text-fuchsia-400" />
                <span className="sm:inline hidden">{stats?.saves || 0} saves</span>
                <span className="sm:hidden inline">{stats?.saves || 0}</span>
              </div>
            </div>
            {podcast.user_id && (
              <Link 
                to={`/user/${podcast.user_id}`}
                className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors group flex items-center gap-2 text-sm"
              >
                {creator?.avatar_url ? (
                  <img 
                    src={creator.avatar_url} 
                    alt={creator.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                )}
                <span className="group-hover:underline">
                  Created by {creator?.name || 'Anonymous User'}
                </span>
              </Link>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-display font-medium mb-4 text-white">{podcast.title}</h1>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-fuchsia-400" />
            <p className="text-lg text-slate-200">
              {podcast.authors}
              <span className="text-slate-400 ml-2">({podcast.publishing_year})</span>
            </p>
          </div>
        </div>

        {/* Audio Player Section */}
        <div className="p-6 md:p-8 border-b border-slate-700/50">
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              onError={() => setAudioError('Error loading audio file')}
            />
          )}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  disabled={!audioUrl || !!audioError}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    audioUrl && !audioError 
                      ? 'bg-slate-700 [&::-webkit-slider-thumb]:bg-fuchsia-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:bg-fuchsia-500 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer' 
                      : 'bg-slate-700/50 cursor-not-allowed'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400 text-sm">
                    {formatTime(duration * (progress / 100))}
                  </span>
                  <span className="text-slate-400 text-sm">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 text-white" />
                ) : (
                  <Play className="w-7 h-7 text-white ml-1" />
                )}
              </button>
            </div>

            {audioError && (
              <div className="text-red-400 text-sm">
                {audioError}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-6 md:p-8 border-b border-slate-700/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white transition-colors w-full sm:w-auto"
            >
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
            
            {podcast.doi && (
              <a
                href={`https://doi.org/${podcast.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white transition-colors w-full sm:w-auto"
              >
                <BookOpen className="w-5 h-5" />
                <span>View Paper</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white transition-colors w-full sm:w-auto"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>

          {canEdit && (
            <div className="hidden sm:flex items-center gap-4 mt-4 sm:mt-0">
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 md:p-8 shadow-xl">
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-fuchsia-400" />
                <span className="text-slate-300">{podcast.publishing_year}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia-400" />
                <span className="text-slate-300">{podcast.authors}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-fuchsia-400" />
                <span className="text-slate-300">{podcast.field_of_research}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Keywords</div>
            <div className="text-slate-300">{podcast.keywords}</div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display font-medium mb-4 text-white">Abstract</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line">{podcast.abstract}</p>
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