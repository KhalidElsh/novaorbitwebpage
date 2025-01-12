// app/api/solar/analyze/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon, address } = body;

    if (!lat || !lon || !address) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      );
    }

    // Construct the Google Solar API request
    const url = new URL('https://solar.googleapis.com/v1/buildingInsights:findClosest');
    url.searchParams.append('location.latitude', lat.toString());
    url.searchParams.append('location.longitude', lon.toString());
    url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY!);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Solar API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to include relevant solar data
    const solarData = {
      solarPotential: {
        maxArrayPanelsCount: data.solarPotential?.maxArrayPanelsCount || 0,
        maxArrayAnnualProduction: data.solarPotential?.maxArrayAnnualProduction || 0,
        roofSegmentStats: data.solarPotential?.roofSegmentStats || [],
        panelCapacityWatts: 400, // Assuming 400W panels
        sunshineQuantiles: data.solarPotential?.annualSunshineQuantiles || [],
      },
      geometry: {
        center: data.center,
        boundingBox: data.boundingBox,
      },
      roofMaterialsAndSlopes: data.roofMaterialsAndSlopes || [],
    };

    return NextResponse.json(solarData);
  } catch (error) {
    console.error('Solar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solar data' },
      { status: 500 }
    );
  }
}