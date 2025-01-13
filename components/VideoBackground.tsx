'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

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
    console.error('Video source:', document.querySelector('video source')?.src);
    console.error('Base URL:', window.location.origin);
    console.error('Full video URL:', new URL('/background.mp4', window.location.origin).href);
    
    // Try to fetch the video directly to see if it exists
    fetch('/background.mp4')
      .then(response => {
        console.log('Video fetch response:', response.status, response.statusText);
      })
      .catch(err => {
        console.error('Video fetch error:', err);
      });
  
    setHasError(true);
    setIsLoading(false);
  };

  // Don't render anything until component is mounted on client side
  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  // Show fallback gradient if video fails to load
  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black">
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
          {/* Optional: Show a message when in development */}
          {process.env.NODE_ENV === 'development' && 'Video failed to load'}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Loading state */}
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
          src="/background.mp4"
          type="video/mp4"
        />
        {/* Fallback message for browsers that don't support video */}
        Your browser does not support the video tag.
      </video>
      
      {/* Overlay with fade effect */}
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

// Export as dynamic component with SSR disabled
export default dynamic(() => Promise.resolve(VideoBackground), {
  ssr: false
});