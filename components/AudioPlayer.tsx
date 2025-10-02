import React, { useState, useRef, useEffect } from 'react';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import SpeakerXMarkIcon from './icons/SpeakerXMarkIcon';
import EllipsisVerticalIcon from './icons/EllipsisVerticalIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  // 1. SoundCloud support: If it's a soundcloud URL, embed their player.
  if (/soundcloud\.com/i.test(src)) {
    const soundCloudEmbedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(src)}&color=%23facc15&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
    return (
        <iframe
            width="100%"
            height="120"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={soundCloudEmbedUrl}
            title="SoundCloud audio player"
            className="bg-transparent rounded-lg shadow-lg"
        ></iframe>
    );
  }

  // 2. YouTube Error: Show a specific error for YouTube links in the audio section.
  if (/youtu\.?be/i.test(src)) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200">
        <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold">Unsupported Audio Source</p>
          <p className="text-red-300/80">YouTube links are for video and cannot be used here. Please use the 'Video URL' field instead.</p>
        </div>
      </div>
    );
  }

  // 3. Native Player: The original custom player for direct audio links.
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('The audio could not be loaded. The link may be broken or the format is unsupported.');

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const volumeBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // When the src changes, reset the player state
    setLoadError(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    audio.load(); // Explicitly load the new source

    const handleMetadataLoaded = () => {
      // Check for finite duration, as streams can have Infinity.
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
      setCurrentTime(audio.currentTime);
      // Attempt to autoplay now that we know the source is valid
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(error => {
          // Autoplay is often blocked by browsers. This is expected.
          console.log("Autoplay was prevented by the browser:", error);
          setIsPlaying(false); // Stay in paused state if autoplay fails
        });
    };

    const handleTimeUpdate = () => {
        if (audio && !isNaN(audio.currentTime)) {
            setCurrentTime(audio.currentTime);
        }
    };
    const handleEnded = () => setIsPlaying(false);
    
    const handleError = () => {
      const audio = audioRef.current;
      if (!audio) return;

      let debugMessage = 'An unknown error occurred.';
      if (audio.error) {
        switch (audio.error.code) {
          case 1: debugMessage = 'MEDIA_ERR_ABORTED: The fetching of the audio was aborted.'; break;
          case 2: debugMessage = 'MEDIA_ERR_NETWORK: A network error caused the audio to fail to download.'; break;
          case 3: debugMessage = 'MEDIA_ERR_DECODE: The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.'; break;
          case 4: debugMessage = 'MEDIA_ERR_SRC_NOT_SUPPORTED: The audio could not be loaded, either because the server or network failed or because the format is not supported.'; break;
          default: debugMessage = audio.error.message || 'An unknown error occurred.';
        }
        console.warn(`Audio Error (Code: ${audio.error.code}): ${debugMessage}`, `Source: ${src}`);
      } else {
        console.warn('An unknown audio error occurred.', `Source: ${src}`);
      }
      setIsPlaying(false);
      setLoadError(true);
    };

    audio.addEventListener('loadedmetadata', handleMetadataLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      // Cleanup: remove event listeners and pause audio
      audio.removeEventListener('loadedmetadata', handleMetadataLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      if (audio && !audio.paused) {
        audio.pause();
      }
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
        // Prevent play/pause actions if the audio source failed to load.
        if (loadError) {
            audioRef.current.pause();
            return;
        }

        if (isPlaying) {
            audioRef.current.play().catch(e => {
                console.warn("Play failed:", e);
                setIsPlaying(false);
            });
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, loadError]);
  
  useEffect(() => {
     if (audioRef.current) {
         audioRef.current.volume = volume;
         audioRef.current.muted = isMuted;
     }
  }, [volume, isMuted]);
  
  useEffect(() => {
    if (progressBarRef.current) {
        const currentPercentage = duration ? (currentTime / duration) * 100 : 0;
        progressBarRef.current.style.setProperty('--seek-before-width', `${currentPercentage}%`);
    }
  }, [currentTime, duration]);
  
   useEffect(() => {
    if (volumeBarRef.current) {
      const currentPercentage = isMuted ? 0 : volume * 100;
      volumeBarRef.current.style.setProperty('--volume-before-width', `${currentPercentage}%`);
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!loadError) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && isFinite(duration)) {
      const newTime = Number(e.target.value);
      setCurrentTime(newTime);
      audioRef.current.currentTime = newTime;
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const currentlyMuted = !isMuted;
    setIsMuted(currentlyMuted);
    if (currentlyMuted) {
      setLastVolume(volume);
      setVolume(0);
    } else {
      setVolume(lastVolume > 0 ? lastVolume : 0.5);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0 || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loadError) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200">
        <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold">Audio Error</p>
          <p className="text-red-300/80">{errorDetails}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-4 p-2 bg-gray-800/60 rounded-full backdrop-blur-sm">
        <button onClick={togglePlayPause} className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white focus:outline-none">
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>

        <span className="w-20 text-xs font-mono text-center text-gray-300">{formatTime(currentTime)} / {formatTime(duration)}</span>

        <input
          type="range"
          ref={progressBarRef}
          value={currentTime}
          step="0.01"
          min="0"
          max={duration || 0}
          onChange={handleProgressChange}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer custom-range"
          aria-label="Audio progress bar"
          disabled={!isFinite(duration)}
        />
        
        <div className="flex items-center gap-2 group">
            <button onClick={toggleMute} className="flex items-center justify-center w-6 h-6 text-white focus:outline-none" aria-label={isMuted ? "Unmute" : "Mute"}>
            {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon className="w-5 h-5" />
            ) : (
                <SpeakerWaveIcon className="w-5 h-5" />
            )}
            </button>
            <input
                type="range"
                ref={volumeBarRef}
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 h-1 rounded-full appearance-none cursor-pointer custom-volume-range group-hover:w-20 transition-all duration-300"
                aria-label="Volume control"
            />
        </div>

        <button className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white focus:outline-none" aria-label="More options">
          <EllipsisVerticalIcon className="w-5 h-5" />
        </button>
      </div>
      <style>{`
        .custom-range {
            background-color: rgba(255, 255, 255, 0.2);
            --seek-before-width: 0%;
        }
        
        .custom-range:disabled {
            background: repeating-linear-gradient(-45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 5px, rgba(255,255,255,0.15) 5px, rgba(255,255,255,0.15) 10px);
        }

        .custom-range:disabled::-webkit-slider-thumb {
            visibility: hidden;
        }

        .custom-range:disabled::-moz-range-thumb {
            visibility: hidden;
        }

        .custom-range::-webkit-slider-runnable-track {
            background: linear-gradient(to right, #facc15 var(--seek-before-width), rgba(255, 255, 255, 0.2) var(--seek-before-width));
            height: 6px;
            border-radius: 3px;
        }
        .custom-range::-moz-range-track {
            background: linear-gradient(to right, #facc15 var(--seek-before-width), rgba(255, 255, 255, 0.2) var(--seek-before-width));
            height: 6px;
            border-radius: 3px;
        }
        .custom-range::-ms-track {
            background: linear-gradient(to right, #facc15 var(--seek-before-width), rgba(255, 255, 255, 0.2) var(--seek-before-width));
            height: 6px;
            border-radius: 3px;
            border-color: transparent;
            color: transparent;
        }
        
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          margin-top: -4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease-in-out;
        }
        .custom-range:hover::-webkit-slider-thumb {
            transform: scale(1.1);
        }
        .custom-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        .custom-range::-ms-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        
        .custom-range:focus { outline: none; }
        .custom-range:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(252, 211, 77, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        
        .custom-volume-range {
            --volume-before-width: 100%;
        }
        .custom-volume-range::-webkit-slider-runnable-track {
            background: linear-gradient(to right, #facc15 var(--volume-before-width), rgba(255, 255, 255, 0.2) var(--volume-before-width));
            height: 4px;
            border-radius: 2px;
        }
        .custom-volume-range::-moz-range-track {
            background: linear-gradient(to right, #facc15 var(--volume-before-width), rgba(255, 255, 255, 0.2) var(--volume-before-width));
            height: 4px;
            border-radius: 2px;
        }
        .custom-volume-range::-ms-track {
            background: linear-gradient(to right, #facc15 var(--volume-before-width), rgba(255, 255, 255, 0.2) var(--volume-before-width));
            height: 4px;
            border-radius: 2px;
        }
        .custom-volume-range::-webkit-slider-thumb {
            margin-top: -5px; /* (track-height - thumb-height) / 2 */
        }
      `}</style>
    </>
  );
};

export default AudioPlayer;