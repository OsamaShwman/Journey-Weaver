import React, { useState, useRef, useEffect } from 'react';
import type { Landmark } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import SparklesIcon from './icons/SparklesIcon';
import GeminiChat from './GeminiChat';
import AudioPlayer from './AudioPlayer';

interface SidebarProps {
  landmark: Landmark;
  onNext: () => void;
  onPrev: () => void;
  isTransitioning: boolean;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const videoIdMatch = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([^&\n?#]+)/i
    );
    if (videoIdMatch && videoIdMatch[1]) {
        const videoId = videoIdMatch[1];
        // Autoplay, mute, loop, and rel=0 to avoid related videos from other channels.
        return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }
    return null; 
};

interface TabButtonProps {
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-1 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
            ${isActive 
                ? 'border-yellow-500 text-yellow-400' 
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'}`
        }
        aria-current={isActive ? 'page' : undefined}
    >
        {icon}
        {label}
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ landmark, onNext, onPrev, isTransitioning }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'ai'>('info');
  const youtubeEmbedUrl = landmark.videoUrl ? getYouTubeEmbedUrl(landmark.videoUrl) : null;
  
  // The intro landmark has a different, simpler layout.
  if (landmark.id === 0) {
    return (
        <div className="relative flex flex-col w-full h-full text-white bg-gray-900/90 backdrop-blur-sm">
             <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center animate-fade-in"
                style={{ backgroundImage: `url(${landmark.imageUrl})` }}
            />
            <div className="absolute inset-0 bg-gray-900/70" />

            <div className="relative z-10 flex flex-col items-center justify-center h-full p-10 text-center">
                 <h2 className="text-4xl font-extrabold tracking-tight uppercase" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                    {landmark.title}
                  </h2>
                 <div
                    className="mt-4 max-w-prose text-lg text-gray-200"
                    dangerouslySetInnerHTML={{ __html: landmark.description }}
                />
            </div>
             <button
                onClick={onNext}
                disabled={isTransitioning}
                className="absolute z-20 flex items-center justify-center w-auto h-16 px-4 font-bold text-gray-900 transition-colors transform -translate-x-1/2 bg-yellow-500 rounded-md bottom-10 left-1/2 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Start Journey"
              >
                <span>Start Journey</span>
                <ChevronRightIcon className="w-6 h-6 ml-2" />
              </button>
        </div>
    );
  }

  // Main layout with tabs for all other landmarks
  return (
    <div className="relative flex flex-col w-full h-full text-white bg-gray-900/90 backdrop-blur-sm">
        {/* Background image for aesthetic */}
        <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-700 animate-fade-in"
            style={{ backgroundImage: `url(${landmark.imageUrl})` }}
            key={landmark.id} // Re-trigger animation on landmark change
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
        
        <div className="relative z-10 flex flex-col flex-grow h-full">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 px-6 pt-6 border-b border-white/10">
                <nav className="flex -mb-px space-x-6">
                    <TabButton
                        label="Info"
                        icon={<InformationCircleIcon className="w-5 h-5 mr-2" />}
                        isActive={activeTab === 'info'}
                        onClick={() => setActiveTab('info')}
                    />
                    {(landmark.videoUrl || landmark.audioUrl) && (
                        <TabButton
                            label="Media"
                            icon={<PlayCircleIcon className="w-5 h-5 mr-2" />}
                            isActive={activeTab === 'media'}
                            onClick={() => setActiveTab('media')}
                        />
                    )}
                    <TabButton
                        label="Ask AI"
                        icon={<SparklesIcon className="w-5 h-5 mr-2" />}
                        isActive={activeTab === 'ai'}
                        onClick={() => setActiveTab('ai')}
                    />
                </nav>
            </div>

            {/* Header Area */}
            <div className="flex-shrink-0 px-6 pt-6">
                <h2 className="text-3xl font-extrabold tracking-tight text-center uppercase" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                    {landmark.title}
                </h2>
            </div>

            {/* Tab Content */}
            <div className="flex-grow px-6 pb-6 overflow-y-auto custom-scrollbar">
                {activeTab === 'info' && (
                    <div
                        key={`${landmark.id}-info`}
                        className="max-w-none text-gray-300 animate-fade-in-fast text-center"
                        dangerouslySetInnerHTML={{ __html: landmark.description }}
                    />
                )}
                {activeTab === 'media' && (
                    <div key={`${landmark.id}-media`} className="space-y-6 animate-fade-in-fast">
                        <div className="relative w-full overflow-hidden bg-black rounded-lg aspect-video shadow-lg">
                            {youtubeEmbedUrl ? (
                                <iframe
                                    className="w-full h-full"
                                    src={youtubeEmbedUrl}
                                    title={`${landmark.name} video player`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <img
                                    src={landmark.imageUrl}
                                    alt={landmark.name}
                                    className="object-cover w-full h-full"
                                />
                            )}
                        </div>
                        {landmark.audioUrl && (
                            <div className="p-4 bg-black/20 rounded-lg">
                                <h3 className="mb-3 text-sm font-bold tracking-wider text-gray-400 uppercase">Ambient Audio</h3>
                                <AudioPlayer key={landmark.audioUrl} src={landmark.audioUrl} />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div key={`${landmark.id}-ai`} className="animate-fade-in-fast">
                        <GeminiChat landmark={landmark} />
                    </div>
                )}
            </div>
        </div>
      
        <button
            onClick={onPrev}
            disabled={isTransitioning || landmark.id === 0}
            className="absolute top-1/2 -translate-y-1/2 z-20 left-0 flex items-center justify-center h-16 transition-colors bg-gray-800/50 text-white/70 w-9 hover:bg-yellow-500/80 hover:text-white rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous Landmark"
        >
            <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <button
            onClick={onNext}
            disabled={isTransitioning}
            className="absolute top-1/2 -translate-y-1/2 z-20 right-0 flex items-center justify-center h-16 transition-colors bg-gray-800/50 text-white/70 w-9 hover:bg-yellow-500/80 hover:text-white rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next Landmark"
        >
            <ChevronRightIcon className="w-6 h-6" />
        </button>

        <style>{`
            @keyframes fade-in {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            .animate-fade-in {
                animation: fade-in 0.75s ease-in-out;
            }
            @keyframes fade-in-fast {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in-fast {
                animation: fade-in-fast 0.3s ease-in-out;
            }
            /* Custom scrollbar for webkit browsers */
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
        `}</style>
    </div>
  );
};

export default Sidebar;