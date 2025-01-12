'use client';

import Link from 'next/link';

export default function Navbar() {
  const handleContactClick = () => {
    window.open('https://calendly.com/khalid-novaorbit', '_blank');
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <h1 className="text-white text-xl font-light tracking-[0.5em]">
              N O V A O R B I T
            </h1>
          </div>
          <div>
            <button
              onClick={handleContactClick}
              className="bg-black/80 hover:bg-black text-white px-6 py-2 rounded text-sm font-light transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}