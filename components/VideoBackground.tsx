'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const VideoBackground = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLoadedData = () => {
    setIsLoading(false);
    setIsPlaying(true);
  };

  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
      )}
      
      <video
        key="background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={handleLoadedData}
        className={`
          w-full h-full object-cover
          transition-opacity duration-1000
          ${isPlaying ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
};

export default dynamic(() => Promise.resolve(VideoBackground), {
  ssr: false
});