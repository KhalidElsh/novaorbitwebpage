'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectionsDashboardProps {
  systemSize: number;
  estimatedCost: number;
  annualProduction: number;
  monthlyUsage: number;
  monthlyBill: number;
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
  currentRate: number;
  offsetPercentage: number;
}

function calculateLoanPayment(principal: number, years: number, annualRate: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const numberOfPayments = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
         (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
}

function calculateSavings(
  systemSize: number, 
  systemCost: number, 
  annualProduction: number,
  monthlyUsage: number,
  monthlyBill: number
): SavingsResult {
  // Calculate current electricity rate
  const currentRate = monthlyBill / monthlyUsage;
  const annualUsage = monthlyUsage * 12;
  
  // Calculate offset percentage
  const offsetPercentage = Math.min((annualProduction / annualUsage) * 100, 100);

  // Financial parameters
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
  let currentProductionRate = currentRate;
  let currentProduction = annualProduction;
  let cumulativeSavings = 0;
  let paybackYear = 0;
  let paybackFound = false;

  // Calculate year-by-year savings
  for (let year = 1; year <= analysisPeriod; year++) {
    // Traditional utility bill (based on actual usage)
    const traditionalBill = annualUsage * currentProductionRate;

    // Solar costs (loan payment)
    const solarCost = year <= loanYears ? annualLoanPayment : 0;

    // Calculate actual savings based on production vs usage
    const solarSavings = currentProduction * currentProductionRate;
    const annualSavings = solarSavings - solarCost;
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
      electricityRate: currentProductionRate
    });

    // Update values for next year
    currentProduction *= (1 - degradationRate / 100);
    currentProductionRate *= (1 + annualRateIncrease / 100);
  }

  const roi = (cumulativeSavings / systemCost) * 100;

  return {
    yearlyData,
    firstYearSavings: yearlyData[0].annualSavings,
    monthlyPayment,
    paybackPeriod: paybackYear,
    roi,
    currentRate,
    offsetPercentage
  };
}

export default function ProjectionsDashboard({ 
  systemSize, 
  estimatedCost, 
  annualProduction,
  monthlyUsage,
  monthlyBill 
}: ProjectionsDashboardProps) {
  const [results, setResults] = useState<SavingsResult | null>(null);

  useEffect(() => {
    if (monthlyUsage > 0 && monthlyBill > 0) {
      setResults(calculateSavings(
        systemSize,
        estimatedCost,
        annualProduction,
        monthlyUsage,
        monthlyBill
      ));
    }
  }, [systemSize, estimatedCost, annualProduction, monthlyUsage, monthlyBill]);

  if (!results) {
    return (
      <Alert>
        <AlertDescription>
          Please enter your current electricity usage and bill amount to see savings projections.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Your Savings Projections</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Monthly Savings</h3>
          <p className="text-2xl font-bold text-green-700">
            ${Math.floor(results.firstYearSavings / 12).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">per month</p>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Solar Payment</h3>
          <p className="text-2xl font-bold text-blue-700">
            ${Math.floor(results.monthlyPayment).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">monthly payment</p>
        </div>

        <div className="bg-orange-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Current Rate</h3>
          <p className="text-2xl font-bold text-orange-700">
            ${results.currentRate.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600">per kWh</p>
        </div>
        
        <div className="bg-purple-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">25-Year Savings</h3>
          <p className="text-2xl font-bold text-purple-700">
            ${Math.floor(results.yearlyData[results.yearlyData.length-1].cumulativeSavings).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">total savings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    formatter={(value: number) => `${Math.round(value).toLocaleString()}`}
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

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Cumulative Savings</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.yearlyData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `${Math.round(value).toLocaleString()}`}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavings" 
                    name="Total Savings" 
                    stroke="#6d28d9" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Solar Offset</h3>
          <p className="text-2xl font-bold text-gray-700">
            {Math.round(results.offsetPercentage)}%
          </p>
          <p className="text-sm text-gray-600">of your usage</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">Payback Period</h3>
          <p className="text-2xl font-bold text-gray-700">
            {results.paybackPeriod} years
          </p>
          <p className="text-sm text-gray-600">to break even</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold text-lg mb-2">ROI</h3>
          <p className="text-2xl font-bold text-gray-700">
            {Math.round(results.roi)}%
          </p>
          <p className="text-sm text-gray-600">25-year return</p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded mt-6">
        <h3 className="font-bold text-lg mb-2">Additional Benefits</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li>30% Federal Tax Credit: ${Math.round(estimatedCost * 0.30).toLocaleString()}</li>
          <li>Property Value Increase: ~${Math.round(systemSize * 3000).toLocaleString()}</li>
          <li>CO2 Reduction: {Math.round(annualProduction * 0.709)} lbs annually</li>
          <li>Protection from utility rate increases</li>
        </ul>
      </div>
    </div>
  );
}