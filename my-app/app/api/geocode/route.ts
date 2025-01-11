// app/api/geocode/route.ts
import { NextResponse } from 'next/server';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

function findAddressComponent(components: AddressComponent[], type: string): string {
  const component = components.find(c => c.types.includes(type));
  return component ? component.long_name : '';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key is not configured');
    return NextResponse.json({ 
      error: 'Server configuration error' 
    }, { status: 500 });
  }

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.append('address', address);
  url.searchParams.append('key', process.env.GOOGLE_MAPS_API_KEY);

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Maps API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API error:', data.error_message);
      return NextResponse.json({ 
        error: 'API request denied' 
      }, { status: 403 });
    }

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ 
        error: 'Address not found' 
      }, { status: 404 });
    }

    if (data.status !== 'OK' || !data.results?.[0]) {
      console.error('Unexpected Google Maps API response:', data);
      return NextResponse.json({ 
        error: 'Invalid address response' 
      }, { status: 400 });
    }

    const result = data.results[0];
    const components = result.address_components;

    // Parse all address components
    const parsedAddress = {
      street_number: findAddressComponent(components, 'street_number'),
      street: findAddressComponent(components, 'route'),
      city: findAddressComponent(components, 'locality') || 
            findAddressComponent(components, 'sublocality') ||
            findAddressComponent(components, 'administrative_area_level_3'),
      state: findAddressComponent(components, 'administrative_area_level_1'),
      county: findAddressComponent(components, 'administrative_area_level_2'),
      zip: findAddressComponent(components, 'postal_code'),
      country_iso2: result.address_components.find((c: { types: string | string[]; }) => 
        c.types.includes('country')
      )?.short_name || 'US',
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      formatted_address: result.formatted_address
    };

    // Validate required fields
    if (!parsedAddress.street || !parsedAddress.city || !parsedAddress.state) {
      return NextResponse.json({ 
        error: 'Incomplete address information' 
      }, { status: 400 });
    }

    // Format address for OpenSolar
    const address = `${parsedAddress.street_number} ${parsedAddress.street}`.trim();

    return NextResponse.json({
      address,
      city: parsedAddress.city,
      state: parsedAddress.state,
      zip: parsedAddress.zip,
      county: parsedAddress.county,
      country_iso2: parsedAddress.country_iso2,
      lat: parsedAddress.lat,
      lon: parsedAddress.lon,
      formatted_address: parsedAddress.formatted_address
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify address',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}