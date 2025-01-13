'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import backgroundVideo from '@/public/background.mp4'; // Import video at the top

const VideoBackground = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadedData = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  const handleError = (error: any) => {
    console.error('Video loading error:', error);
    console.error('Video source:', backgroundVideo);
    setHasError(true);
    setIsLoading(false);
  };

  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black">
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
          {process.env.NODE_ENV === 'development' && 'Video failed to load'}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black animate-pulse" />
      )}
      
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={handleLoadedData}
        onError={handleError}
        className={`
          w-full h-full object-cover
          transition-opacity duration-1000
          ${isPlaying ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <source 
          src={backgroundVideo}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      
      <div 
        className={`
          absolute inset-0 bg-black/50
          transition-opacity duration-1000
          ${isPlaying ? 'opacity-100' : 'opacity-0'}
        `} 
      />
    </div>
  );
};

export default dynamic(() => Promise.resolve(VideoBackground), {
  ssr: false
});