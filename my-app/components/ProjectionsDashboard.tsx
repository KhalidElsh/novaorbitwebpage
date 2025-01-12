'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectionsDashboardProps {
  systemSize: number;
  estimatedCost: number;
  annualProduction: number;
}

interface YearlyData {
  year: number;
  traditionalBill: number;
  solarCost: number;
  annualSavings: number;
  cumulativeSavings: number;
  electricityRate: number;
}

interface SavingsResult {
  yearlyData: YearlyData[];
  firstYearSavings: number;
  monthlyPayment: number;
  paybackPeriod: number;
  roi: number;
}

// Financial calculation helper functions
function calculateLoanPayment(principal: number, years: number, annualRate: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const numberOfPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}

function calculateSavings(systemSize: number, systemCost: number, annualProduction: number): SavingsResult {
  // Financial parameters
  const electricityRate = 0.14; // Starting electricity rate ($/kWh)
  const annualRateIncrease = 5; // Annual electricity rate increase (%)
  const loanYears = 25;
  const interestRate = 5.99;
  const federalTaxCredit = 0.30; // 30% federal tax credit
  const analysisPeriod = 25; // Years to analyze
  const degradationRate = 0.5; // Annual panel degradation rate (%)

  // Calculate loan details
  const loanAmount = systemCost * (1 - federalTaxCredit);
  const monthlyPayment = calculateLoanPayment(loanAmount, loanYears, interestRate);
  const annualLoanPayment = monthlyPayment * 12;

  let yearlyData: YearlyData[] = [];
  let currentRate = electricityRate;
  let currentProduction = annualProduction;
  let cumulativeSavings = 0;
  let paybackYear = 0;
  let paybackFound = false;

  // Calculate year-by-year savings
  for (let year = 1; year <= analysisPeriod; year++) {
    // Traditional utility bill
    const traditionalBill = currentProduction * currentRate;

    // Solar costs (loan payment)
    const solarCost = year <= loanYears ? annualLoanPayment : 0;

    // Calculate savings
    const annualSavings = traditionalBill - solarCost;
    cumulativeSavings += annualSavings;

    // Check for payback
    if (!paybackFound && cumulativeSavings > systemCost) {
      paybackYear = year;
      paybackFound = true;
    }

    // Store this year's data
    yearlyData.push({
      year,
      traditionalBill,
      solarCost,
      annualSavings,
      cumulativeSavings,
      electricityRate: currentRate
    });

    // Update values for next year
    currentProduction *= (1 - degradationRate / 100);
    currentRate *= (1 + annualRateIncrease / 100);
  }

  const roi = (cumulativeSavings / systemCost) * 100;

  return {
    yearlyData,
    firstYearSavings: yearlyData[0].annualSavings,
    monthlyPayment,
    paybackPeriod: paybackYear,
    roi
  };
}

export default function ProjectionsDashboard({ systemSize, estimatedCost, annualProduction }: ProjectionsDashboardProps) {
  const [results, setResults] = useState<SavingsResult>(() => 
    calculateSavings(systemSize, estimatedCost, annualProduction)
  );

  useEffect(() => {
    setResults(calculateSavings(systemSize, estimatedCost, annualProduction));
  }, [systemSize, estimatedCost, annualProduction]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Savings Projections</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Monthly Savings</h3>
          <p className="text-2xl font-bold text-green-700">
            ${Math.floor(results.firstYearSavings / 12).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">per month</p>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Financing</h3>
          <p className="text-2xl font-bold text-blue-700">
            ${Math.floor(results.monthlyPayment).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">monthly payment</p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">25-Year Savings</h3>
          <p className="text-2xl font-bold text-purple-700">
            ${Math.floor(results.yearlyData[results.yearlyData.length-1].cumulativeSavings).toLocaleString()}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Cost Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={results.yearlyData.map(d => ({
                  ...d,
                  traditionalBill: d.traditionalBill / 12,
                  solarCost: d.solarCost / 12
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `$${Math.round(value).toLocaleString()}`}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="traditionalBill" 
                  name="Without Solar" 
                  stroke="#dc2626" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="solarCost" 
                  name="With Solar" 
                  stroke="#16a34a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}