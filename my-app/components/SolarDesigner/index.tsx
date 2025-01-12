'use client'

import { useState, useCallback } from 'react';
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import MapInitializer from './MapInitializer';
import EquipmentSelector from './EquipmentSelector';
import EquipmentDetails from './EquipmentDetails';
import PanelDesigner from './PanelDesigner';
import { Equipment, DesignData } from '@/types/solar';
import { solarApi } from '@/service/solarApi';

interface SolarRoofDesignerProps {
  lat: number;
  lng: number;
  onUpdate: (designData: DesignData) => void;
}

export default function SolarRoofDesigner({ lat, lng, onUpdate }: SolarRoofDesignerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [roofShape, setRoofShape] = useState<google.maps.Polygon | google.maps.Rectangle | null>(null);
  const [roofArea, setRoofArea] = useState<number>(0);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    panel?: Equipment;
    inverter?: Equipment;
    battery?: Equipment;
  }>({});
  const [designMetrics, setDesignMetrics] = useState<{
    systemSize: number;
    annualProduction: number;
    estimatedCost: number;
    paybackPeriod: number;
  }>({
    systemSize: 0,
    annualProduction: 0,
    estimatedCost: 0,
    paybackPeriod: 0
  });

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsLoading(false);
  }, []);

  const handleAreaSelect = useCallback((area: number, shape: google.maps.Polygon | google.maps.Rectangle) => {
    setRoofArea(area);
    setRoofShape(shape);
  }, []);

  const handleDesignUpdate = async (configuration: any) => {
    if (!selectedEquipment.panel) return;

    try {
      const systemSize = calculateSystemSize(configuration);
      
      // Calculate annual production using NREL API
      const annualProduction = await calculateAnnualProduction(configuration, systemSize);
      
      // Calculate costs and metrics
      const estimatedCost = calculateCost(configuration);
      const paybackPeriod = calculatePaybackPeriod(annualProduction, estimatedCost);

      const metrics = {
        systemSize,
        annualProduction,
        estimatedCost,
        paybackPeriod
      };

      setDesignMetrics(metrics);

      const designData: DesignData = {
        ...metrics,
        panelCount: countPanels(configuration),
        roofArea: calculateArea(configuration),
        selectedEquipment: {
          panels: [selectedEquipment.panel],
          inverters: selectedEquipment.inverter ? [selectedEquipment.inverter] : [],
          batteries: selectedEquipment.battery ? [selectedEquipment.battery] : []
        }
      };

      onUpdate(designData);
    } catch (error) {
      console.error('Error updating design:', error);
    }
  };

  // Enhanced calculation functions
  const calculateSystemSize = (config: any) => {
    if (!selectedEquipment.panel || !config.panels) return 0;
    const totalPanels = config.panels.length;
    return (totalPanels * selectedEquipment.panel.specifications.watts) / 1000; // Convert to kW
  };

  const calculateAnnualProduction = async (config: any, systemSize: number) => {
    try {
      // Get roof angle and orientation
      const tilt = calculateRoofPitch();
      const azimuth = calculateRoofAzimuth();

      // Call NREL PVWatts API
      const response = await solarApi.calculateProduction({
        systemCapacity: systemSize,
        lat,
        lon: lng,
        azimuth,
        tilt,
        arrayType: 1, // Fixed roof mount
        module_type: 1, // Standard module type
        losses: 14.08 // Default losses
      });

      return response.outputs.ac_annual; // Annual AC production in kWh
    } catch (error) {
      console.error('Error calculating production:', error);
      return 0;
    }
  };

  const calculateCost = (config: any) => {
    if (!selectedEquipment.panel || !config.panels) return 0;
    
    const panelCost = config.panels.length * (selectedEquipment.panel.specifications.cost || 350); // Default cost per panel
    const inverterCost = selectedEquipment.inverter ? selectedEquipment.inverter.specifications.cost || 2000 : 0;
    const batteryCost = selectedEquipment.battery ? selectedEquipment.battery.specifications.cost || 8000 : 0;
    
    const installationCost = config.panels.length * 200; // Base installation cost per panel
    const permitCost = 1500; // Base permit cost
    
    return panelCost + inverterCost + batteryCost + installationCost + permitCost;
  };

  const calculatePaybackPeriod = (annualProduction: number, totalCost: number) => {
    const averageElectricityRate = 0.15; // $/kWh - should be location specific
    const annualSavings = annualProduction * averageElectricityRate;
    return annualSavings > 0 ? totalCost / annualSavings : 0;
  };

  const countPanels = (config: any) => {
    return config.panels?.length || 0;
  };

  const calculateArea = (config: any) => {
    return roofArea;
  };

  const calculateRoofPitch = () => {
    // Calculate roof pitch from the polygon/rectangle
    // This would use elevation data in a full implementation
    return 30; // Default 30-degree pitch
  };

  const calculateRoofAzimuth = () => {
    if (!roofShape) return 180; // Default south-facing
    
    if (roofShape instanceof google.maps.Rectangle) {
      const bounds = roofShape.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      return google.maps.geometry.spherical.computeHeading(sw, ne);
    } else {
      const path = roofShape.getPath();
      const first = path.getAt(0);
      const last = path.getAt(path.getLength() - 1);
      return google.maps.geometry.spherical.computeHeading(first, last);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="design" className="w-full">
        <TabsList>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
        </TabsList>

        <TabsContent value="design">
          <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
            
            <MapInitializer
              lat={lat}
              lng={lng}
              onMapLoad={handleMapLoad}
              onAreaSelect={handleAreaSelect}
            />

            {!isLoading && selectedEquipment.panel && selectedEquipment.inverter && (
              <PanelDesigner
                map={map}
                selectedPanel={selectedEquipment.panel}
                selectedInverter={selectedEquipment.inverter}
                roofShape={roofShape || undefined}
                roofArea={roofArea}
                onUpdate={handleDesignUpdate}
              />
            )}

            {/* Design Metrics Display */}
            {designMetrics.systemSize > 0 && (
              <Card className="absolute top-4 right-4 w-80 bg-white shadow-lg">
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold">System Metrics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">System Size:</div>
                    <div>{designMetrics.systemSize.toFixed(2)} kW</div>
                    
                    <div className="text-gray-600">Annual Production:</div>
                    <div>{Math.round(designMetrics.annualProduction).toLocaleString()} kWh</div>
                    
                    <div className="text-gray-600">Estimated Cost:</div>
                    <div>${Math.round(designMetrics.estimatedCost).toLocaleString()}</div>
                    
                    <div className="text-gray-600">Payback Period:</div>
                    <div>{designMetrics.paybackPeriod.toFixed(1)} years</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="p-6">
            <EquipmentSelector
              selectedEquipment={selectedEquipment}
              onEquipmentSelect={setSelectedEquipment}
            />
            {Object.keys(selectedEquipment).length > 0 && (
              <EquipmentDetails selectedEquipment={selectedEquipment} />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}