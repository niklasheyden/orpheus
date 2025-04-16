import React, { createContext, useContext, useRef, useState } from 'react';
import type { Podcast } from '../lib/types';

interface AudioPlayerContextType {
  currentPodcast: Podcast | null;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  playPodcast: (podcast: Podcast) => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPodcast, setCurrentPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playPodcast = (podcast: Podcast) => {
    if (currentPodcast?.id === podcast.id) {
      togglePlayPause();
      return;
    }

    setCurrentPodcast(podcast);
    setIsPlaying(true);
    
    // Small delay to ensure the audio source has been updated
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current) return;
    
    // Ensure time is a valid number and within bounds
    if (isNaN(time) || time < 0) {
      time = 0;
    } else if (time > audioRef.current.duration) {
      time = audioRef.current.duration;
    }

    try {
      audioRef.current.currentTime = time;
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const setVolume = (volume: number) => {
    if (!audioRef.current) return;
    
    // Ensure volume is between 0 and 1
    volume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = volume;
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentPodcast(null);
    setIsPlaying(false);
  };

  return (
    <AudioPlayerContext.Provider 
      value={{
        currentPodcast,
        isPlaying,
        audioRef,
        playPodcast,
        togglePlayPause,
        seekTo,
        setVolume,
        closePlayer
      }}
    >
      {children}
      {currentPodcast && (
        <audio
          ref={audioRef}
          src={currentPodcast.audio_url}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => {
            setIsPlaying(false);
            console.error('Audio playback error');
          }}
        />
      )}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}; 