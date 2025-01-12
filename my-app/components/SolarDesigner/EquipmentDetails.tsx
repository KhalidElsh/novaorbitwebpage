import { Card, CardContent } from "@/components/ui/card";
import { Equipment } from "@/types/solar";

interface EquipmentDetailsProps {
  selectedEquipment: {
    panel?: Equipment;
    inverter?: Equipment;
    battery?: Equipment;
  };
}

export default function EquipmentDetails({
  selectedEquipment,
}: EquipmentDetailsProps) {
  const { panel, inverter, battery } = selectedEquipment;

  if (!panel && !inverter && !battery) {
    return null;
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold mb-4">Selected Equipment Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel Details */}
        {panel && (
          <Card className="p-4">
            <h4 className="font-medium mb-2">Solar Panel Specifications</h4>
            <div className="space-y-2 text-sm">
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Power Output:</dt>
                  <dd>{panel.specifications.watts}W</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Efficiency:</dt>
                  <dd>{panel.specifications.efficiency}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Dimensions:</dt>
                  <dd>
                    {panel.dimensions.width}m x {panel.dimensions.height}m
                  </dd>
                </div>
                {panel.specifications.warranty && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Warranty:</dt>
                    <dd>{panel.specifications.warranty} years</dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>
        )}

        {/* Inverter Details */}
        {inverter && (
          <Card className="p-4">
            <h4 className="font-medium mb-2">Inverter Specifications</h4>
            <div className="space-y-2 text-sm">
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Power Rating:</dt>
                  <dd>{inverter.specifications.powerRating}W</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Efficiency:</dt>
                  <dd>{inverter.specifications.efficiency}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Type:</dt>
                  <dd>{inverter.specifications.type}</dd>
                </div>
                {inverter.specifications.warranty && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Warranty:</dt>
                    <dd>{inverter.specifications.warranty} years</dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>
        )}

        {/* Battery Details */}
        {battery && (
          <Card className="p-4">
            <h4 className="font-medium mb-2">Battery Specifications</h4>
            <div className="space-y-2 text-sm">
              <dl className="space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Capacity:</dt>
                  <dd>{battery.specifications.capacity}kWh</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Power Output:</dt>
                  <dd>{battery.specifications.powerOutput}kW</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Warranty:</dt>
                  <dd>{battery.specifications.warranty} years</dd>
                </div>
                {battery.specifications.cycles && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cycle Life:</dt>
                    <dd>{battery.specifications.cycles} cycles</dd>
                  </div>
                )}
              </dl>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}