// lib/addressParser.ts

interface ParsedAddress {
    street_number: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    country_iso2: string;
    lat: number;
    lon: number;
    formatted_address: string;
  }
  
  export async function parseAddress(address: string): Promise<ParsedAddress> {
    try {
      // Make a call to Google Maps Geocoding API through our backend route
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        throw new Error('Failed to verify address');
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Address parsing error:', error);
      throw error;
    }
  }