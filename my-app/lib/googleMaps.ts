// lib/googleMaps.ts
export interface VerifiedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  country_iso2: string;
  lat: number;
  lon: number;
  formatted_address: string;
}

export async function verifyAddress(address: string): Promise<VerifiedAddress> {
  if (!address.trim()) {
    throw new Error('Please enter an address')
  }

  try {
    const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Address not found. Please check and try again.')
      }
      throw new Error(data.error || 'Failed to verify address')
    }

    return data as VerifiedAddress
  } catch (error: any) {
    console.error('Verification error:', error)
    throw new Error(error.message || 'Failed to verify address. Please try again.')
  }
}

export async function getSuggestedAddresses(input: string): Promise<string[]> {
  if (!input.trim()) {
    return []
  }

  try {
    const response = await fetch(`/api/places?input=${encodeURIComponent(input)}`)
    const data = await response.json()

    if (!response.ok) {
      console.error('Error getting suggestions:', data.error)
      return []
    }

    return data.predictions || []
  } catch (error) {
    console.error('Error getting address suggestions:', error)
    return []
  }
}