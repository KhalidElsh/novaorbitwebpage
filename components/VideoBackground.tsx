'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useInView } from 'react-intersection-observer';

const VideoBackground = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: true,
  });

  // Get base video URL from S3 with type checking
  const baseVideoUrl = process.env.NEXT_PUBLIC_VIDEO_URL ?? '';
  
  // Extract the file extension and base path
  const getVideoUrls = useCallback((): { highQuality: string; lowQuality: string } => {
    if (!baseVideoUrl) {
      console.error('Video URL environment variable is not defined');
      return {
        highQuality: '',
        lowQuality: ''
      };
    }

    const extension = baseVideoUrl.split('.').pop() || 'mp4';
    const basePath = baseVideoUrl.replace(`.${extension}`, '');
    
    return {
      highQuality: `${basePath}.${extension}`,
      lowQuality: `${basePath}-compressed.${extension}`,
    };
  }, [baseVideoUrl]);

  // Lazy load video based on viewport
  useEffect(() => {
    if (inView) {
      const videoElement = document.getElementById('background-video') as HTMLVideoElement | null;
      if (videoElement) {
        videoElement.load();
      }
    }
  }, [inView]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle video loading with quality switching
  const handleCanPlayThrough = () => {
    setIsVideoLoaded(true);
  };

  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  const videoUrls = getVideoUrls();

  // If no video URL is provided, show fallback gradient
  if (!baseVideoUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  return (
    <div 
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-black"
    >
      {!isVideoLoaded && (
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
      )}
      
      {inView && (
        <video
          id="background-video"
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onCanPlayThrough={handleCanPlayThrough}
        >
          {/* Low quality source for initial load */}
          <source
            src={videoUrls.lowQuality}
            type="video/mp4"
          />
          {/* High quality source loaded after */}
          <source
            src={videoUrls.highQuality}
            type="video/mp4"
          />
        </video>
      )}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
};

// Disable SSR for the video component
export default dynamic(() => Promise.resolve(VideoBackground), {
  ssr: false,
});