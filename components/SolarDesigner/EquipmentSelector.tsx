import { useEffect, useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Equipment } from '@/types/solar';
import { solarApi } from '@/service/solarApi';

interface EquipmentSelectorProps {
  selectedEquipment: {
    panel?: Equipment;
    inverter?: Equipment;
    battery?: Equipment;
  };
  onEquipmentSelect: (equipment: {
    panel?: Equipment;
    inverter?: Equipment;
    battery?: Equipment;
  }) => void;
  systemSize?: number; // Optional system size for filtering compatible equipment
}

export default function EquipmentSelector({
  selectedEquipment,
  onEquipmentSelect,
  systemSize
}: EquipmentSelectorProps) {
  const [equipment, setEquipment] = useState<{
    panels: Equipment[];
    inverters: Equipment[];
    batteries: Equipment[];
  }>({
    panels: [],
    inverters: [],
    batteries: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setError(null);
      const data = await solarApi.getEquipmentCatalog();
      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      setError('Failed to load equipment catalog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter compatible inverters based on selected panel and system size
  const compatibleInverters = useMemo(() => {
    if (!selectedEquipment.panel || !systemSize) {
      return equipment.inverters;
    }

    return equipment.inverters.filter(inverter => {
      const panelWatts = selectedEquipment.panel!.specifications.watts;
      const totalWatts = systemSize * 1000; // Convert kW to W

      if (inverter.specifications.type === 'Microinverter') {
        // Check if microinverter power rating matches panel output
        return inverter.specifications.powerRating >= panelWatts * 0.9;
      } else {
        // For string inverters, check overall system compatibility
        return (
          inverter.specifications.powerRating >= totalWatts * 0.9 &&
          inverter.specifications.powerRating <= totalWatts * 1.2
        );
      }
    });
  }, [equipment.inverters, selectedEquipment.panel, systemSize]);

  // Calculate and validate string sizing
  const validateStringConfig = (inverter: Equipment, panel: Equipment) => {
    if (!inverter || !panel) return true;
    
    const maxPanelsPerString = Math.floor(inverter.specifications.maxVoltage / panel.specifications.voltage);
    const minPanelsForPower = Math.ceil(inverter.specifications.powerRating / panel.specifications.watts);
    
    return {
      maxPanelsPerString,
      minPanelsForPower,
      isValid: maxPanelsPerString >= minPanelsForPower
    };
  };

  // Filter compatible batteries based on system size
  const compatibleBatteries = useMemo(() => {
    if (!systemSize) {
      return equipment.batteries;
    }

    return equipment.batteries.filter(battery => {
      // Battery capacity should be suitable for system size
      const recommendedMinCapacity = systemSize * 2; // kWh
      const recommendedMaxCapacity = systemSize * 4; // kWh
      return (
        battery.specifications.capacity >= recommendedMinCapacity &&
        battery.specifications.capacity <= recommendedMaxCapacity
      );
    });
  }, [equipment.batteries, systemSize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Solar Panels</h3>
            <Select
              value={selectedEquipment.panel?.id}
              onValueChange={(id) => {
                const panel = equipment.panels.find(p => p.id === id);
                // Clear inverter selection if panel changes
                onEquipmentSelect({ 
                  ...selectedEquipment, 
                  panel,
                  inverter: undefined 
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Panel" />
              </SelectTrigger>
              <SelectContent>
                {equipment.panels.map(panel => (
                  <SelectItem key={panel.id} value={panel.id}>
                    <div className="flex flex-col">
                      <span>{panel.manufacturer} {panel.model}</span>
                      <span className="text-sm text-gray-500">
                        {panel.specifications.watts}W - {panel.specifications.efficiency}% Eff.
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Inverter Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Inverters</h3>
            <Select
              value={selectedEquipment.inverter?.id}
              onValueChange={(id) => {
                const inverter = compatibleInverters.find(i => i.id === id);
                onEquipmentSelect({ ...selectedEquipment, inverter });
              }}
              disabled={!selectedEquipment.panel}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedEquipment.panel 
                    ? "Select Panel First" 
                    : "Select Inverter"
                } />
              </SelectTrigger>
              <SelectContent>
                {compatibleInverters.map(inverter => {
                  const config = selectedEquipment.panel 
                    ? validateStringConfig(inverter, selectedEquipment.panel)
                    : { isValid: true };

                  return (
                    <SelectItem 
                      key={inverter.id} 
                      value={inverter.id}
                      disabled={!config.isValid}
                    >
                      <div className="flex flex-col">
                        <span>{inverter.manufacturer} {inverter.model}</span>
                        <span className="text-sm text-gray-500">
                          {inverter.specifications.powerRating}W - {inverter.specifications.type}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Battery Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Batteries</h3>
            <Select
              value={selectedEquipment.battery?.id}
              onValueChange={(id) => {
                const battery = compatibleBatteries.find(b => b.id === id);
                onEquipmentSelect({ ...selectedEquipment, battery });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Battery (Optional)" />
              </SelectTrigger>
              <SelectContent>
                {compatibleBatteries.map(battery => (
                  <SelectItem key={battery.id} value={battery.id}>
                    <div className="flex flex-col">
                      <span>{battery.manufacturer} {battery.model}</span>
                      <span className="text-sm text-gray-500">
                        {battery.specifications.capacity}kWh - {battery.specifications.powerOutput}kW
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Compatibility Warnings */}
      {selectedEquipment.panel && selectedEquipment.inverter && (
        <div className="mt-4">
          {validateStringConfig(selectedEquipment.inverter, selectedEquipment.panel).isValid ? (
            <Alert>
              <AlertDescription className="text-green-600">
                Selected equipment configuration is compatible
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Warning: Current inverter may not be compatible with the selected panel configuration
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}