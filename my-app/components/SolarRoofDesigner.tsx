// components/SolarRoofDesigner.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SolarRoofDesignerProps {
  lat: number;
  lng: number;
  onUpdate: (designData: DesignData) => void;
}

interface DesignData {
  systemSize: number;
  annualProduction: number;
  estimatedCost: number;
  panelCount: number;
  roofArea: number;
}

export default function SolarRoofDesigner({ lat, lng, onUpdate }: SolarRoofDesignerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activePolygons, setActivePolygons] = useState<google.maps.Polygon[]>([]);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds
  const [showLeadForm, setShowLeadForm] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    loadGoogleMapsWithLibraries();
  }, [lat, lng]);

  const loadGoogleMapsWithLibraries = () => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      initializeMap();
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;
  
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 20,
      mapTypeId: 'satellite',
      tilt: 0,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true
    });
  
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON]
      },
      polygonOptions: {
        fillColor: '#0047FF',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#0047FF',
        editable: true,
        draggable: true
      }
    });
  
    drawingManager.setMap(mapInstance);
  
    // Use handlePolygonComplete for new polygons
    google.maps.event.addListener(drawingManager, 'polygoncomplete', handlePolygonComplete);
  
    setMap(mapInstance);
    setIsLoading(false);
  };
  
  const handlePolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    // Add the new polygon to state
    setActivePolygons(prev => {
      const newPolygons = [...prev, polygon];
      
      // Setup listeners
      const path = polygon.getPath();
      
      // Handle path edits
      path.addListener('set_at', () => {
        updateCalculations([...newPolygons]);
      });
      
      path.addListener('insert_at', () => {
        updateCalculations([...newPolygons]);
      });
      
      // Handle polygon deletion
      polygon.addListener('rightclick', () => {
        polygon.setMap(null);
        const remainingPolygons = newPolygons.filter(p => p !== polygon);
        setActivePolygons(remainingPolygons);
        updateCalculations(remainingPolygons);
      });
  
      // Calculate with the new polygon
      updateCalculations(newPolygons);
      return newPolygons;
    });
  }, []);
  
  const updateCalculations = useCallback((polygons: google.maps.Polygon[]) => {
    let totalArea = 0;
    
    // Calculate total area from all polygons
    polygons.forEach(polygon => {
      if (polygon && polygon.getPath()) {
        const area = google.maps.geometry.spherical.computeArea(polygon.getPath());
        totalArea += area;
      }
    });
  
    // Calculations
    const panelArea = 1.6; // m²
    const utilizationFactor = 0.9;
    const maxPanels = Math.floor((totalArea * utilizationFactor) / panelArea);
    
    const wattsPerPanel = 400;
    const systemSize = (maxPanels * wattsPerPanel) / 1000; // kW
    const averageSunHours = 4.5;
    const annualProduction = systemSize * averageSunHours * 365;
    const costPerWatt = 2.8;
    const estimatedCost = systemSize * 1000 * costPerWatt;
  
    // Only update if we have valid numbers
    if (systemSize > 0 && annualProduction > 0) {
      onUpdate({
        systemSize,
        annualProduction,
        estimatedCost,
        panelCount: maxPanels,
        roofArea: totalArea
      });
    }
  }, [onUpdate]);

  return (
    <div className="space-y-4 bg-gray-100">
      {/* Lead Magnet Section */}
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-full" 
          style={{ visibility: isLoading ? 'hidden' : 'visible' }}
        />
      </div>

      <Card className="bg-white">
        <CardContent className="p-4">
          <p className="text-sm text-gray-600">
            Draw polygons on your roof to design your solar panel layout. 
            Right-click a polygon to delete it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}