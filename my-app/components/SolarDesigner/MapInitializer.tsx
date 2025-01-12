'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapInitializerProps {
  lat: number;
  lng: number;
  onMapLoad: (map: google.maps.Map) => void;
  onAreaSelect?: (area: number, shape: google.maps.Polygon | google.maps.Rectangle) => void;
}

export default function MapInitializer({ 
  lat, 
  lng, 
  onMapLoad, 
  onAreaSelect 
}: MapInitializerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [currentShape, setCurrentShape] = useState<google.maps.Polygon | google.maps.Rectangle | null>(null);
  const [measurementMode, setMeasurementMode] = useState<boolean>(false);

  // Initialize the map
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    // Create the map instance with satellite view
    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 20,
      mapTypeId: 'satellite',
      tilt: 0,
      maxZoom: 23,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: google.maps.ControlPosition.TOP_RIGHT
      }
    });

    setMapInstance(map);

    // Initialize the drawing manager
    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.RECTANGLE,
          google.maps.drawing.OverlayType.POLYGON
        ]
      },
      rectangleOptions: {
        fillColor: '#45b6fe',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#45b6fe',
        editable: true,
        draggable: true,
        clickable: true
      },
      polygonOptions: {
        fillColor: '#45b6fe',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#45b6fe',
        editable: true,
        draggable: true,
        clickable: true
      }
    });

    manager.setMap(map);
    setDrawingManager(manager);

    // Add overlay complete listener for when shapes are drawn
    google.maps.event.addListener(manager, 'overlaycomplete', handleOverlayComplete);

    // Add custom controls
    addCustomControls(map);

    // Add instructions
    addInstructions(map);

    // Notify parent component that map is ready
    onMapLoad(map);
  }, [lat, lng, onMapLoad]);

  // Handle completion of drawing shapes
  const handleOverlayComplete = useCallback((event: google.maps.drawing.OverlayCompleteEvent) => {
    // Remove previous shape if it exists
    if (currentShape) {
      currentShape.setMap(null);
    }

    const shape = event.overlay;
    setCurrentShape(shape);

    // Calculate area based on shape type
    let area = 0;
    if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
      const bounds = (shape as google.maps.Rectangle).getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const path = [
        ne,
        new google.maps.LatLng(ne.lat(), sw.lng()),
        sw,
        new google.maps.LatLng(sw.lat(), ne.lng())
      ];
      area = google.maps.geometry.spherical.computeArea(path);
    } else if (event.type === google.maps.drawing.OverlayType.POLYGON) {
      area = google.maps.geometry.spherical.computeArea((shape as google.maps.Polygon).getPath());
    }

    // Add event listeners for shape editing
    if (event.type === google.maps.drawing.OverlayType.POLYGON) {
      const polygon = shape as google.maps.Polygon;
      google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
        const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
        onAreaSelect?.(newArea, polygon);
      });
      google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
        const newArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
        onAreaSelect?.(newArea, polygon);
      });
    } else if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
      const rectangle = shape as google.maps.Rectangle;
      google.maps.event.addListener(rectangle, 'bounds_changed', () => {
        const bounds = rectangle.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const path = [
          ne,
          new google.maps.LatLng(ne.lat(), sw.lng()),
          sw,
          new google.maps.LatLng(sw.lat(), ne.lng())
        ];
        const newArea = google.maps.geometry.spherical.computeArea(path);
        onAreaSelect?.(newArea, rectangle);
      });
    }

    // Notify parent component of the selected area
    onAreaSelect?.(area, shape as google.maps.Polygon | google.maps.Rectangle);

    // Switch to null drawing mode after shape is complete
    if (drawingManager) {
      drawingManager.setDrawingMode(null);
    }
  }, [currentShape, drawingManager, onAreaSelect]);

  // Add custom controls to the map
  const addCustomControls = (map: google.maps.Map) => {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'custom-map-controls bg-white rounded-lg shadow-lg p-2 m-2';
    
    // View controls
    const viewControls = document.createElement('div');
    viewControls.className = 'mb-2 space-y-2';
    viewControls.innerHTML = `
      <button class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 toggle-tilt">
        Toggle 3D View
      </button>
      <button class="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 reset-view">
        Reset View
      </button>
    `;

    // Add event listeners
    const tiltButton = viewControls.querySelector('.toggle-tilt');
    if (tiltButton) {
      tiltButton.addEventListener('click', () => {
        const currentTilt = map.getTilt();
        map.setTilt(currentTilt === 0 ? 45 : 0);
      });
    }

    const resetButton = viewControls.querySelector('.reset-view');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        map.setCenter({ lat, lng });
        map.setZoom(20);
        map.setTilt(0);
      });
    }

    controlDiv.appendChild(viewControls);
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(controlDiv);
  };

  // Add instruction overlay to the map
  const addInstructions = (map: google.maps.Map) => {
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'bg-white p-3 rounded-lg shadow-lg m-2 text-sm max-w-md';
    instructionDiv.innerHTML = `
      <div class="font-medium mb-2">Quick Start Guide:</div>
      <ol class="list-decimal pl-4 space-y-1">
        <li>Use the drawing tools above to outline your roof area</li>
        <li>Select equipment in the Equipment tab</li>
        <li>Drag and drop panels onto your outlined roof area</li>
        <li>Adjust panel rotation and spacing as needed</li>
      </ol>
    `;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(instructionDiv);
  };

  // Load Google Maps script
  const loadGoogleMaps = useCallback(() => {
    // Check if script is already loaded
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api"]')) {
      return;
    }

    window.initMap = initializeMap;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry,places&callback=initMap&loading=async`;
    script.async = true;
    document.head.appendChild(script);
  }, [initializeMap]);

  // Initial setup effect
  useEffect(() => {
    if (window.google) {
      initializeMap();
    } else {
      loadGoogleMaps();
    }

    // Cleanup function
    return () => {
      if (currentShape) {
        currentShape.setMap(null);
      }
      if (drawingManager) {
        drawingManager.setMap(null);
      }
    };
  }, [initializeMap, loadGoogleMaps]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden"
      />
      {!mapInstance && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}