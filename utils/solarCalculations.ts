// utils/solarCalculations.ts
import { Equipment } from '@/types/solar';
import { solarApi } from '@/service/solarApi';

interface CostBreakdown {
  panels: number;
  inverter: number;
  battery: number;
  installation: number;
  permitAndDesign: number;
  racking: number;
  wiring: number;
  monitoring: number;
  total: number;
}

interface LayoutConfig {
  panelSpacing: number;
  edgeSetback: number;
  rowSpacing: number;
  minRowLength: number;
}

export class SolarCalculations {
  static readonly DEFAULT_LOSSES = {
    soiling: 2,
    shading: 3,
    mismatch: 2,
    wiring: 2,
    connectionBoxes: 0.5,
    degradation: 1.5,
    nameplate: 1,
    age: 1,
    availability: 1.08
  };

  static async calculateAnnualProduction(
    systemSize: number,
    latitude: number,
    longitude: number,
    tilt: number,
    azimuth: number,
    losses: Partial<typeof SolarCalculations.DEFAULT_LOSSES> = {}
  ) {
    // Calculate total losses
    const totalLosses = Object.values({
      ...SolarCalculations.DEFAULT_LOSSES,
      ...losses
    }).reduce((sum, loss) => sum + loss, 0);

    try {
      const response = await solarApi.calculateProduction({
        systemCapacity: systemSize,
        lat: latitude,
        lon: longitude,
        azimuth,
        tilt,
        arrayType: 1, // Fixed roof mount
        module_type: 1, // Standard module type
        losses: totalLosses
      });

      return {
        annualProduction: response.outputs.ac_annual,
        monthlyProduction: response.outputs.ac_monthly,
        hourlyProduction: response.outputs.ac,
        losses: totalLosses,
        performanceRatio: response.outputs.ac_annual / (systemSize * 8760) // Annual PR calculation
      };
    } catch (error) {
      console.error('Error calculating production:', error);
      throw error;
    }
  }

  static calculateSystemCost(
    panelCount: number,
    panel: Equipment,
    inverter?: Equipment,
    battery?: Equipment
  ): CostBreakdown {
    const panelCost = panelCount * (panel.specifications.cost || 0);
    const inverterCost = inverter ? inverter.specifications.cost : 0;
    const batteryCost = battery ? battery.specifications.cost : 0;
    
    // Calculate installation costs
    const baseInstallationCost = panelCount * 200;
    const rackingCost = panelCount * 100;
    const wiringCost = panelCount * 50;
    const monitoringCost = 500;
    const permitAndDesignCost = 2500;

    const total = panelCost + inverterCost + batteryCost + baseInstallationCost +
      rackingCost + wiringCost + monitoringCost + permitAndDesignCost;

    return {
      panels: panelCost,
      inverter: inverterCost,
      battery: batteryCost,
      installation: baseInstallationCost,
      racking: rackingCost,
      wiring: wiringCost,
      monitoring: monitoringCost,
      permitAndDesign: permitAndDesignCost,
      total
    };
  }

  static calculateFinancials(
    systemCost: number,
    annualProduction: number,
    electricityRate: number,
    incentives: { federal?: number; state?: number; utility?: number } = {}
  ) {
    // Calculate incentives
    const federalIncentive = (incentives.federal || 0.30) * systemCost;
    const stateIncentive = incentives.state || 0;
    const utilityIncentive = incentives.utility || 0;
    const totalIncentives = federalIncentive + stateIncentive + utilityIncentive;

    // Calculate net cost and savings
    const netCost = systemCost - totalIncentives;
    const annualSavings = annualProduction * electricityRate;
    const paybackPeriod = netCost / annualSavings;

    // Calculate ROI
    const systemLifespan = 25; // Standard solar panel lifespan
    const totalSavings = annualSavings * systemLifespan;
    const roi = ((totalSavings - netCost) / netCost) * 100;

    return {
      netCost,
      annualSavings,
      paybackPeriod,
      roi,
      incentives: {
        federal: federalIncentive,
        state: stateIncentive,
        utility: utilityIncentive,
        total: totalIncentives
      },
      lifetimeSavings: totalSavings
    };
  }

  static calculateOptimalLayout(
    bounds: google.maps.LatLngBounds,
    panel: Equipment,
    pitch: number,
    orientation: number,
    config: Partial<LayoutConfig> = {}
  ) {
    // Default configuration values
    const defaultConfig: LayoutConfig = {
      panelSpacing: 0.025, // 2.5cm spacing between panels
      edgeSetback: 0.5, // 0.5m from roof edges
      rowSpacing: 0.4, // 40cm between rows
      minRowLength: 2 // Minimum panels per row
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Get roof dimensions
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const width = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(ne.lat(), sw.lng()),
      ne
    );
    const length = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(ne.lat(), sw.lng()),
      sw
    );

    // Calculate usable area accounting for setbacks
    const usableWidth = width - (finalConfig.edgeSetback * 2);
    const usableLength = length - (finalConfig.edgeSetback * 2);

    // Calculate panel dimensions and spacing
    const panelWidth = panel.dimensions.width;
    const panelHeight = panel.dimensions.height;
    const effectivePanelHeight = panelHeight * Math.cos(pitch * Math.PI / 180);
    
    // Calculate row spacing based on pitch and latitude
    const rowSpacing = this.calculateRowSpacing(
      panelHeight,
      pitch,
      bounds.getCenter().lat()
    );

    // Calculate maximum panels that can fit
    const panelsPerRow = Math.floor(usableWidth / (panelWidth + finalConfig.panelSpacing));
    const numberOfRows = Math.floor(usableLength / (effectivePanelHeight + rowSpacing));

    // Generate panel positions
    const panelPositions: google.maps.LatLng[] = [];
    const startPoint = new google.maps.LatLng(
      ne.lat() - finalConfig.edgeSetback,
      sw.lng() + finalConfig.edgeSetback
    );

    for (let row = 0; row < numberOfRows; row++) {
      for (let col = 0; col < panelsPerRow; col++) {
        const offset = this.calculatePanelOffset(
          startPoint,
          col * (panelWidth + finalConfig.panelSpacing),
          row * (effectivePanelHeight + rowSpacing),
          orientation
        );
        panelPositions.push(offset);
      }
    }

    return {
      totalPanels: panelPositions.length,
      panelsPerRow,
      numberOfRows,
      positions: panelPositions,
      spacing: {
        rows: rowSpacing,
        panels: finalConfig.panelSpacing
      },
      coverage: (panelPositions.length * panelWidth * panelHeight) / (width * length)
    };
  }

  private static calculateRowSpacing(
    panelHeight: number,
    pitch: number,
    latitude: number
  ): number {
    // Calculate optimal row spacing based on winter solstice sun angle
    const winterSolsticeAngle = this.calculateSolarAngle(latitude);
    const panelProjectedHeight = panelHeight * Math.sin(pitch * Math.PI / 180);
    const shadowLength = panelProjectedHeight / Math.tan(winterSolsticeAngle * Math.PI / 180);
    return shadowLength * 1.1; // Add 10% buffer
  }

  private static calculateSolarAngle(latitude: number): number {
    // Calculate minimum solar elevation angle on winter solstice
    const declination = -23.45; // Winter solstice declination
    return 90 - latitude - declination;
  }

  private static calculatePanelOffset(
    startPoint: google.maps.LatLng,
    xOffset: number,
    yOffset: number,
    orientation: number
  ): google.maps.LatLng {
    // Convert offset distance to lat/lng
    const latOffset = yOffset / 111111; // Approximate meters to degrees
    const lngOffset = xOffset / (111111 * Math.cos(startPoint.lat() * Math.PI / 180));

    // Rotate offset based on orientation
    const angle = orientation * Math.PI / 180;
    const rotatedLat = latOffset * Math.cos(angle) - lngOffset * Math.sin(angle);
    const rotatedLng = latOffset * Math.sin(angle) + lngOffset * Math.cos(angle);

    return new google.maps.LatLng(
      startPoint.lat() - rotatedLat,
      startPoint.lng() + rotatedLng
    );
  }

  static validateLayout(
    layout: ReturnType<typeof SolarCalculations.calculateOptimalLayout>,
    inverter: Equipment,
    panel: Equipment
  ) {
    const { totalPanels, panelsPerRow } = layout;

    // Calculate string configurations
    const maxPanelsPerString = Math.floor(inverter.specifications.maxVoltage / panel.specifications.voltage);
    const minPanelsForPower = Math.ceil(inverter.specifications.powerRating / panel.specifications.watts);

    // For string inverters
    if (inverter.specifications.type === 'String') {
      const optimalStringsCount = Math.ceil(totalPanels / maxPanelsPerString);
      const panelsPerString = Math.floor(totalPanels / optimalStringsCount);

      return {
        isValid: panelsPerString >= minPanelsForPower && panelsPerString <= maxPanelsPerString,
        suggestedConfiguration: {
          stringsCount: optimalStringsCount,
          panelsPerString,
          unusedPanels: totalPanels - (optimalStringsCount * panelsPerString)
        },
        electricalParameters: {
          stringVoltage: panelsPerString * panel.specifications.voltage,
          stringCurrent: panel.specifications.current,
          totalPower: totalPanels * panel.specifications.watts
        }
      };
    }

    // For microinverters
    return {
      isValid: true,
      suggestedConfiguration: {
        stringsCount: totalPanels,
        panelsPerString: 1,
        unusedPanels: 0
      },
      electricalParameters: {
        stringVoltage: panel.specifications.voltage,
        stringCurrent: panel.specifications.current,
        totalPower: totalPanels * panel.specifications.watts
      }
    };
  }

  static calculateShading(
    panelPositions: google.maps.LatLng[],
    obstacles: google.maps.LatLng[][],
    pitch: number,
    orientation: number
  ) {
    // Calculate shading for each panel at different times of day
    const shadingAnalysis = panelPositions.map(position => {
      const hourlyShading = Array.from({ length: 24 }, (_, hour) => {
        const sunPosition = this.calculateSunPosition(position, hour);
        return this.checkObstacles(position, sunPosition, obstacles);
      });

      return {
        position,
        hourlyShading,
        averageShading: hourlyShading.reduce((a, b) => a + b, 0) / 24
      };
    });

    return {
      panelShading: shadingAnalysis,
      totalShadingLoss: shadingAnalysis.reduce((sum, panel) => 
        sum + panel.averageShading, 0) / panelPositions.length
    };
  }

  private static calculateSunPosition(
    position: google.maps.LatLng,
    hour: number
  ): { azimuth: number; elevation: number } {
    // Simplified sun position calculation
    // In a real implementation, this would use the NREL SPA algorithm
    const latitude = position.lat();
    const dayOfYear = new Date().getDayOfYear();
    
    // Simplified calculations
    const declination = 23.45 * Math.sin((360/365) * (dayOfYear - 81) * Math.PI/180);
    const hourAngle = (hour - 12) * 15;
    
    const elevation = Math.asin(
      Math.sin(latitude * Math.PI/180) * Math.sin(declination * Math.PI/180) +
      Math.cos(latitude * Math.PI/180) * Math.cos(declination * Math.PI/180) *
      Math.cos(hourAngle * Math.PI/180)
    ) * 180/Math.PI;

    const azimuth = Math.atan2(
      Math.sin(hourAngle * Math.PI/180),
      Math.cos(hourAngle * Math.PI/180) * Math.sin(latitude * Math.PI/180) -
      Math.tan(declination * Math.PI/180) * Math.cos(latitude * Math.PI/180)
    ) * 180/Math.PI + 180;

    return { azimuth, elevation };
  }

  private static checkObstacles(
    panelPosition: google.maps.LatLng,
    sunPosition: { azimuth: number; elevation: number },
    obstacles: google.maps.LatLng[][]
  ): number {
    // Check if any obstacles block the sun
    // Returns shading percentage (0-1)
    // This is a simplified version - real implementation would use ray casting
    return 0; // Placeholder
  }
}