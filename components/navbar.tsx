'use client'
import Link from 'next/link';

export default function Navbar() {
  const handleContactClick = () => {
    window.open('https://calendly.com/khalid-novaorbit', '_blank');
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className="text-white text-xl font-light tracking-[0.5em] hover:opacity-80 transition-opacity">
              N O V A O R B I T
            </h1>
          </div>
          <div>
            <button
              onClick={handleContactClick}
              className="bg-black/80 hover:bg-black text-white px-8 py-3 rounded text-sm font-light transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}