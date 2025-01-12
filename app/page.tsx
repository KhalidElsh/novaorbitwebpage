'use client'

import { useState, useCallback } from 'react';
import AddressInput from '@/components/AddressInput';
import SolarRoofDesigner from '@/components/SolarRoofDesigner';
import ProjectionsDashboard from '@/components/ProjectionsDashboard';
import ElectricityUsageInput from '@/components/ElectricityUsageInput';
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

interface ElectricityData {
  monthlyUsage: number;
  monthlyBill: number;
}

export default function SolarDesignPage() {
  const [addressData, setAddressData] = useState<VerifiedAddress | null>(null);
  const [designData, setDesignData] = useState<DesignData | null>(null);
  // Set default electricity data instead of null
  const [electricityData, setElectricityData] = useState<ElectricityData>({
    monthlyUsage: 1000, // Default values
    monthlyBill: 150
  });
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  const handleAddressSubmit = useCallback(async (verifiedAddress: VerifiedAddress) => {
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
  }, []);

  const handleDesignUpdate = useCallback((newDesignData: DesignData) => {
    if (newDesignData.systemSize > 0) {
      setDesignData(newDesignData);
    }
  }, []);

  const handleElectricityUpdate = useCallback((data: ElectricityData) => {
    if (data.monthlyBill > 0 && data.monthlyUsage > 0) {
      setElectricityData(data);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="min-h-screen">
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {!addressData ? (
            <>
              {/* Video background only shown on initial screen */}
              <div className="fixed inset-0 -z-10">
                <VideoBackground />
              </div>
              
              <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-light text-white mb-8">
                    Own Your Energy Future.
                  </h1>
                  <h2 className="text-3xl font-light text-white mb-12">
                    Empower Your Business. Save Thousands Doing So.
                  </h2>
                  <p className="text-lg text-white/80 mb-12 font-light">
                    Empowering businesses to save with no out of pocket cost.
                  </p>
                  <div className="max-w-3xl mx-auto">
                    <AddressInput onSubmit={handleAddressSubmit} />
                  </div>
                </div>
              </div>
            </>
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

              {/* Electricity Usage Input */}
              <ElectricityUsageInput onUpdate={handleElectricityUpdate} />

              {/* Main Content */}
              <SolarRoofDesigner
                lat={addressData.lat}
                lng={addressData.lon}
                onUpdate={handleDesignUpdate}
              />

              {/* Show projections if we have design data (electricity data is always present now) */}
              {designData && (
                <ProjectionsDashboard 
                  systemSize={designData.systemSize}
                  estimatedCost={designData.estimatedCost}
                  annualProduction={designData.annualProduction}
                  monthlyUsage={electricityData.monthlyUsage}
                  monthlyBill={electricityData.monthlyBill}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Capture Form Modal */}
      {showLeadForm && (
        <LeadCaptureForm
          onClose={() => setShowLeadForm(false)}
          searchedAddress={addressData?.formatted_address || ''}
          designData={designData}
          electricityData={electricityData}
        />
      )}
    </div>
  );
}