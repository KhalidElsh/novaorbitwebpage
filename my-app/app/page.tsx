'use client'

import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import SolarRoofDesigner from '@/components/SolarRoofDesigner';
import ProjectionsDashboard from '@/components/ProjectionsDashboard';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { VerifiedAddress } from '@/lib/googleMaps';
import VideoBackground from '@/components/VideoBackground';

interface DesignData {
  systemSize: number;
  annualProduction: number;
  estimatedCost: number;
  panelCount: number;
  roofArea: number;
}

export default function SolarDesignPage() {
  const [addressData, setAddressData] = useState<VerifiedAddress | null>(null);
  const [designData, setDesignData] = useState<DesignData>({
    systemSize: 10,
    annualProduction: 14000,
    estimatedCost: 28000,
    panelCount: 25,
    roofArea: 40
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  const handleAddressSubmit = async (verifiedAddress: VerifiedAddress) => {
    setAddressData(verifiedAddress);
    // Start countdown when address is submitted
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDesignUpdate = (newDesignData: DesignData) => {
    setDesignData(newDesignData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      {!addressData && <VideoBackground />}

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {!addressData ? (
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-white mb-6">
                Design Your Solar Future
              </h1>
              <p className="text-xl text-white/90 mb-8">
                Get an instant custom design and savings estimate
              </p>
              <div className="max-w-2xl mx-auto backdrop-blur-sm bg-white/10 p-6 rounded-lg">
                <AddressInput onSubmit={handleAddressSubmit} />
              </div>
            </div>
          ) : (
            <div className="space-y-8 bg-white rounded-lg p-6">
              {/* Lead Magnet Button */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Get Your Free Custom Proposal
                    </h3>
                    <p className="text-white/90 mt-2">
                      Including detailed financial analysis, incentives, and next steps
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-300 mb-2">
                      Offer expires in: {formatTime(timeLeft)}
                    </div>
                    <button
                      onClick={() => setShowLeadForm(true)}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Get Your Free Proposal Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <SolarRoofDesigner
                lat={addressData.lat}
                lng={addressData.lon}
                onUpdate={handleDesignUpdate}
              />
              <ProjectionsDashboard 
                systemSize={designData.systemSize}
                estimatedCost={designData.estimatedCost}
                annualProduction={designData.annualProduction}
              />
            </div>
          )}
        </div>
      </div>

      {/* Lead Capture Form Modal */}
      {showLeadForm && (
        <LeadCaptureForm
          onClose={() => setShowLeadForm(false)}
          searchedAddress={addressData?.formatted_address || ''}
        />
      )}
    </div>
  );
}