'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import video from '../assets/background.mp4'

const VideoBackground = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      >
        <source src={video} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
};

export default dynamic(() => Promise.resolve(VideoBackground), {
  ssr: false
});