'use client'

import { useState } from 'react';
import AddressInput from '@/components/AddressInput';
import SolarDesigner from '@/components/SolarDesigner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SystemDetails, VerifiedAddress } from '@/types/opensolar';

export default function SolarDesignPage() {
  const [addressData, setAddressData] = useState<VerifiedAddress | null>(null);
  const [design, setDesign] = useState<SystemDetails | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleAddressSubmit = (verifiedAddress: VerifiedAddress) => {
    setAddressData(verifiedAddress);
  };

  const handleDesignComplete = (completedDesign: SystemDetails) => {
    setDesign(completedDesign);
    setShowResults(true);
  };

  const renderResults = () => {
    if (!design || !showResults) return null;

    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle>Your Solar Design Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">System Overview</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-600">System Size:</div>
                <div>{design.systemSize.toFixed(2)} kW</div>
                <div className="text-gray-600">Annual Production:</div>
                <div>{design.annualProduction.toLocaleString()} kWh</div>
                <div className="text-gray-600">Estimated Cost:</div>
                <div>${design.estimatedCost.toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Components</h3>
              {design.modules && design.modules.length > 0 && (
                <div>
                  <h4 className="font-medium">Solar Panels</h4>
                  <ul className="list-disc pl-5">
                    {design.modules.map((module, index) => (
                      <li key={index}>
                        {module.quantity}x {module.manufacturer_name} - {module.code}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {design.inverters && design.inverters.length > 0 && (
                <div>
                  <h4 className="font-medium">Inverters</h4>
                  <ul className="list-disc pl-5">
                    {design.inverters.map((inverter, index) => (
                      <li key={index}>
                        {inverter.quantity}x {inverter.manufacturer_name} - {inverter.code}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {design.batteries && design.batteries.length > 0 && (
                <div>
                  <h4 className="font-medium">Batteries</h4>
                  <ul className="list-disc pl-5">
                    {design.batteries.map((battery, index) => (
                      <li key={index}>
                        {battery.quantity}x {battery.manufacturer_name} - {battery.code}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {design.shareUrl && (
            <div className="mt-8">
              <a 
                href={design.shareUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Open Detailed Design
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Design Your Solar System
          </h1>
          <p className="text-lg text-gray-600">
            Get an instant estimate for your home's solar potential
          </p>
        </div>

        <div className="space-y-8">
          {!addressData ? (
            <div className="max-w-2xl mx-auto">
              <AddressInput onSubmit={handleAddressSubmit} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              <SolarDesigner
                addressData={addressData}
                onDesignComplete={handleDesignComplete}
              />
            </div>
          )}

          {renderResults()}
        </div>
      </div>
    </div>
  );
}