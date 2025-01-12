// types/solar.ts

export interface Equipment {
    id: string;
    manufacturer: string;
    model: string;
    specifications: Record<string, any>;
    dimensions: {
      width: number;
      height: number;
      depth?: number;
    };
  }
  
  export interface DesignData {
    systemSize: number;
    annualProduction: number;
    estimatedCost: number;
    panelCount: number;
    roofArea: number;
    selectedEquipment: {
      panels: Equipment[];
      inverters: Equipment[];
      batteries: Equipment[];
    };
  }
  
  export interface SolarRoofDesignerProps {
    lat: number;
    lng: number;
    onUpdate: (designData: DesignData) => void;
  }