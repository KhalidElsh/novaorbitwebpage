import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ElectricityUsageInputProps {
  onUpdate: (data: { monthlyUsage: number; monthlyBill: number }) => void;
}

export default function ElectricityUsageInput({ onUpdate }: ElectricityUsageInputProps) {
  const [monthlyBill, setMonthlyBill] = useState<string>('150'); // Default value
  const averageRate = 0.14; // Average electricity rate per kWh

  // Use memoized calculation function
  const calculateAndUpdate = useCallback(() => {
    const billAmount = Number(monthlyBill) || 0;
    const estimatedUsage = Math.round(billAmount / averageRate);
    
    // Only update if we have valid numbers
    if (billAmount > 0 && estimatedUsage > 0) {
      onUpdate({
        monthlyUsage: estimatedUsage,
        monthlyBill: billAmount
      });
    }
  }, [monthlyBill, onUpdate]);

  // Run calculation only when monthlyBill changes
  useEffect(() => {
    calculateAndUpdate();
  }, [calculateAndUpdate]);

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthlyBill">Monthly Electricity Bill ($)</Label>
            <Input
              id="monthlyBill"
              type="number"
              placeholder="e.g. 150"
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(e.target.value)}
            />
            {Number(monthlyBill) > 0 && (
              <p className="text-sm text-gray-600">
                Estimated monthly usage: {Math.round(Number(monthlyBill) / averageRate)} kWh
                <br />
                <span className="text-xs">
                  (Based on average rate of ${averageRate.toFixed(2)}/kWh)
                </span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}