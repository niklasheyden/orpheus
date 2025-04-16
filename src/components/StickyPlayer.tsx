import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const StickyPlayer = () => {
  const {
    currentPodcast,
    isPlaying,
    togglePlayPause,
    seekTo,
    setVolume,
    closePlayer,
    audioRef
  } = useAudioPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    
    const updateTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    // Set initial values
    updateTime();
    updateDuration();

    // Add event listeners
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('loadeddata', updateDuration);
    audio.addEventListener('canplay', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('loadeddata', updateDuration);
      audio.removeEventListener('canplay', updateDuration);
    };
  }, [audioRef, currentPodcast]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    seekTo(newTime);
  };

  const handleVolumeToggle = () => {
    if (!audioRef.current) return;
    setIsMuted(!isMuted);
    setVolume(isMuted ? 1 : 0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSkipBack = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, currentTime - 15);
    seekTo(newTime);
  };

  const handleSkipForward = () => {
    if (!audioRef.current) return;
    const newTime = Math.min(duration, currentTime + 15);
    seekTo(newTime);
  };

  if (!currentPodcast) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const coverUrl = currentPodcast.cover_image_url || '/default-podcast-cover.png';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        {/* Podcast Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link 
            to={`/podcast/${currentPodcast.id}`}
            className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={coverUrl}
              alt={currentPodcast.title}
              className="w-full h-full object-cover"
            />
          </Link>
          <div className="min-w-0">
            <Link 
              to={`/podcast/${currentPodcast.id}`}
              className="text-white font-medium hover:text-fuchsia-400 transition-colors truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {currentPodcast.title}
            </Link>
            <p className="text-sm text-slate-400 truncate">{currentPodcast.authors}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSkipBack}
              className="text-slate-400 hover:text-white transition-colors"
              title="Skip back 15 seconds"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 rounded-full bg-fuchsia-500 hover:bg-fuchsia-600 transition-colors flex items-center justify-center text-white"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button 
              onClick={handleSkipForward}
              className="text-slate-400 hover:text-white transition-colors"
              title="Skip forward 15 seconds"
            >
              <SkipForward size={20} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full flex items-center gap-2 text-sm text-slate-400">
            <span className="w-12 text-right tabular-nums">{formatTime(currentTime)}</span>
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-1 h-1 bg-slate-700 rounded-full cursor-pointer group"
            >
              <div 
                className="h-full bg-fuchsia-500 rounded-full relative group-hover:bg-fuchsia-400 transition-colors"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="w-12 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Close */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button
            onClick={handleVolumeToggle}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            onClick={closePlayer}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyPlayer; 