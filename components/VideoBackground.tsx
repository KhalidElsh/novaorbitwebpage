import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Ensure component only renders on client side
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
    setHasError(true);
    setIsLoading(false);
  };

  // Don't render anything until component is mounted
  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  // Fallback background gradient if video fails
  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
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