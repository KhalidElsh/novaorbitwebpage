'use client'

import { useState } from 'react';

export default function VideoBackground() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="absolute inset-0 z-0">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}
      <video
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        <source 
          src="/background.mp4"
          type="video/mp4"
        />
      </video>
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
      )}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  )
}