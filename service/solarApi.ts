// services/solarApi.ts
import { Equipment } from '@/types/solar';

export const API_ENDPOINTS = {
  PVWATTS: 'https://developer.nrel.gov/api/pvwatts/v8.json',
  SOLAR_RESOURCE: 'https://developer.nrel.gov/api/solar/v1/resource.json',
  MARKET_RATES: 'https://developer.nrel.gov/api/utility_rates/v3.json'
};

class SolarApiService {
  private nrelApiKey: string;

  constructor() {
    this.nrelApiKey = process.env.NEXT_PUBLIC_NREL_API_KEY || '';
    if (!this.nrelApiKey) {
      console.warn('NREL API key is not set in environment variables');
    }
  }

  async getEquipmentCatalog(): Promise<{
    panels: Equipment[];
    inverters: Equipment[];
    batteries: Equipment[];
  }> {
    try {
      // First try to get the equipment data
      const data = await this.getMockEquipment();
      return data;
    } catch (error) {
      console.error('Error fetching equipment catalog:', error);
      return this.getMockEquipment();
    }
  }

  async calculateProduction(params: {
    systemCapacity: number;
    lat: number;
    lon: number;
    azimuth: number;
    tilt: number;
    arrayType: number;
    moduleType: number;
    losses: number;
  }) {
    try {
      const queryParams = new URLSearchParams({
        api_key: this.nrelApiKey,
        format: 'json',
        system_capacity: params.systemCapacity.toString(),
        module_type: params.moduleType.toString(),
        losses: params.losses.toString(),
        array_type: params.arrayType.toString(),
        tilt: params.tilt.toString(),
        azimuth: params.azimuth.toString(),
        lat: params.lat.toString(),
        lon: params.lon.toString(),
        // Additional v8 parameters
        dc_ac_ratio: '1.2',
        gcr: '0.4',
        inv_eff: '96.0',
        radius: '0',
        dataset: 'nsrdb',
        bifaciality: '0',
        albedo: '0.2',
        soiling: '0|0|0|0|0|0|0|0|0|0|0|0'
      });

      const response = await fetch(
        `${API_ENDPOINTS.PVWATTS}?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`NREL API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(`NREL API validation error: ${data.errors.join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error calculating production:', error);
      throw error;
    }
  }

  async getSolarResource(lat: number, lng: number) {
    try {
      const params = new URLSearchParams({
        api_key: this.nrelApiKey,
        lat: lat.toString(),
        lon: lng.toString()
      });

      const response = await fetch(
        `${API_ENDPOINTS.SOLAR_RESOURCE}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Solar Resource API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(`Solar Resource API validation error: ${data.errors.join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching solar resource:', error);
      throw error;
    }
  }

  async getElectricityRates(lat: number, lng: number) {
    try {
      const params = new URLSearchParams({
        api_key: this.nrelApiKey,
        lat: lat.toString(),
        lon: lng.toString()
      });

      const response = await fetch(
        `${API_ENDPOINTS.MARKET_RATES}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Market Rates API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(`Market Rates API validation error: ${data.errors.join(', ')}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching electricity rates:', error);
      throw error;
    }
  }

  private getMockEquipment() {
    return {
      panels: [
        {
          id: 'rec400aa',
          manufacturer: 'REC',
          model: 'Alpha 400W',
          specifications: {
            watts: 400,
            efficiency: 21.7,
            voltage: 40.5,
            current: 9.9,
            warranty: 25,
            type: 'Monocrystalline',
            cost: 400
          },
          dimensions: {
            width: 1.7,
            height: 1.0,
            depth: 0.04,
            weight: 20
          }
        },
        {
          id: 'lg450',
          manufacturer: 'LG',
          model: 'NeON H 450W',
          specifications: {
            watts: 450,
            efficiency: 22.1,
            voltage: 41.3,
            current: 10.9,
            warranty: 25,
            type: 'Monocrystalline',
            cost: 450
          },
          dimensions: {
            width: 1.8,
            height: 1.1,
            depth: 0.04,
            weight: 21
          }
        }
      ],
      inverters: [
        {
          id: 'se7600h',
          manufacturer: 'SolarEdge',
          model: 'SE7600H-US',
          specifications: {
            powerRating: 7600,
            efficiency: 99,
            maxVoltage: 480,
            warranty: 12,
            type: 'String',
            cost: 1800
          },
          dimensions: {
            width: 0.54,
            height: 0.32,
            depth: 0.19,
            weight: 22
          }
        },
        {
          id: 'iq8plus',
          manufacturer: 'Enphase',
          model: 'IQ8+',
          specifications: {
            powerRating: 290,
            efficiency: 97,
            maxVoltage: 48,
            warranty: 25,
            type: 'Microinverter',
            cost: 215
          },
          dimensions: {
            width: 0.21,
            height: 0.17,
            depth: 0.03,
            weight: 1.1
          }
        }
      ],
      batteries: [
        {
          id: 'pw2',
          manufacturer: 'Tesla',
          model: 'Powerwall 2',
          specifications: {
            capacity: 13.5,
            powerOutput: 5.0,
            warranty: 10,
            cycles: 3200,
            type: 'Lithium-ion',
            cost: 8500
          },
          dimensions: {
            width: 1.15,
            height: 0.75,
            depth: 0.15,
            weight: 114
          }
        },
        {
          id: 'encharge10',
          manufacturer: 'Enphase',
          model: 'Encharge 10',
          specifications: {
            capacity: 10.1,
            powerOutput: 3.84,
            warranty: 10,
            cycles: 4000,
            type: 'Lithium-iron-phosphate',
            cost: 8000
          },
          dimensions: {
            width: 0.87,
            height: 1.14,
            depth: 0.22,
            weight: 155
          }
        }
      ]
    };
  }
}

export const solarApi = new SolarApiService();