'use client'

export default function VideoBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source 
          src="https://cdn.coverr.co/videos/coverr-solar-panels-installation-2527/1080p.mp4" 
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-black/50" />
    </div>
  )
}
