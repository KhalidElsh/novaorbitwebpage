'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Equipment } from '@/types/solar';
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";

interface PanelObject {
  id: string;
  position: google.maps.LatLng;
  rotation: number;
  panel: Equipment;
}

interface StringConfiguration {
  id: string;
  panels: PanelObject[];
  inverter: Equipment;
}

interface PanelDesignerProps {
  map: google.maps.Map | null;
  selectedPanel: Equipment;
  selectedInverter: Equipment;
  roofShape?: google.maps.Polygon | google.maps.Rectangle;
  roofArea?: number;
  onUpdate: (configuration: StringConfiguration[]) => void;
}

export default function PanelDesigner({
  map,
  selectedPanel,
  selectedInverter,
  roofShape,
  roofArea,
  onUpdate
}: PanelDesignerProps) {
  const [panelObjects, setPanelObjects] = useState<PanelObject[]>([]);
  const [strings, setStrings] = useState<StringConfiguration[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const dragPanelRef = useRef<HTMLDivElement>(null);
  const ghostPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (map) {
      setupOverlay();
      setupDragAndDrop();
    }
  }, [map, selectedPanel]);

  const setupOverlay = () => {
    if (!map) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
    }

    const overlay = new google.maps.OverlayView();
    overlayRef.current = overlay;

    overlay.onAdd = () => {
      const layer = document.createElement('div');
      layer.style.position = 'absolute';
      overlay.getPanes()?.overlayLayer.appendChild(layer);
    };

    overlay.draw = () => {
      renderAllPanels();
    };

    overlay.setMap(map);
  };

  const setupDragAndDrop = () => {
    if (!map || !dragPanelRef.current) return;

    // Create ghost panel for drag preview
    ghostPanelRef.current = document.createElement('div');
    ghostPanelRef.current.className = 'fixed pointer-events-none bg-blue-500/50 border-2 border-blue-500 z-50';
    ghostPanelRef.current.style.width = `${selectedPanel.dimensions.width * 50}px`;
    ghostPanelRef.current.style.height = `${selectedPanel.dimensions.height * 50}px`;
    document.body.appendChild(ghostPanelRef.current);

    const dragPanel = dragPanelRef.current;
    
    dragPanel.addEventListener('dragstart', (e) => {
      setIsDragging(true);
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.setDragImage(ghostPanelRef.current!, 0, 0);
      }
    });

    map.getDiv().addEventListener('dragover', (e) => {
      e.preventDefault();
      if (ghostPanelRef.current) {
        ghostPanelRef.current.style.left = `${e.clientX}px`;
        ghostPanelRef.current.style.top = `${e.clientY}px`;
        ghostPanelRef.current.style.transform = `rotate(${rotation}deg)`;
      }
    });

    map.getDiv().addEventListener('drop', (e) => {
      e.preventDefault();
      setIsDragging(false);
      
      const mapDiv = map.getDiv();
      const rect = mapDiv.getBoundingClientRect();
      const point = new google.maps.Point(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      
      const latLng = overlay2LatLng(point);
      if (latLng && (!roofShape || isPointInShape(latLng))) {
        addPanel(latLng);
      }
    });

    return () => {
      if (ghostPanelRef.current) {
        document.body.removeChild(ghostPanelRef.current);
      }
    };
  };

  const overlay2LatLng = (pixel: google.maps.Point): google.maps.LatLng | null => {
    if (!map || !overlayRef.current) return null;
    
    const projection = overlayRef.current.getProjection();
    if (!projection) return null;

    return projection.fromContainerPixelToLatLng(pixel);
  };

  const isPointInShape = (point: google.maps.LatLng): boolean => {
    if (!roofShape) return true;
    
    if (roofShape instanceof google.maps.Rectangle) {
      return roofShape.getBounds().contains(point);
    }
    return google.maps.geometry.poly.containsLocation(point, roofShape);
  };

  const addPanel = (position: google.maps.LatLng) => {
    const newPanel: PanelObject = {
      id: Date.now().toString(),
      position,
      rotation,
      panel: selectedPanel
    };

    setPanelObjects(prev => [...prev, newPanel]);
    updateStrings([...panelObjects, newPanel]);
  };

  const renderPanel = useCallback((panel: PanelObject) => {
    if (!map || !overlayRef.current) return;

    const overlay = overlayRef.current;
    const projection = overlay.getProjection();
    if (!projection) return;

    const position = projection.fromLatLngToDivPixel(panel.position);
    if (!position) return;

    const div = document.createElement('div');
    div.className = 'absolute pointer-events-auto';
    div.style.width = `${selectedPanel.dimensions.width * 50}px`;
    div.style.height = `${selectedPanel.dimensions.height * 50}px`;
    div.style.left = `${position.x}px`;
    div.style.top = `${position.y}px`;
    div.style.transform = `translate(-50%, -50%) rotate(${panel.rotation}deg)`;
    div.style.backgroundColor = 'rgba(0, 71, 255, 0.5)';
    div.style.border = '2px solid #0047FF';
    div.style.cursor = 'move';

    // Make panel draggable with marker
    const marker = new google.maps.Marker({
      position: panel.position,
      map,
      draggable: true,
      visible: false
    });

    marker.addListener('drag', (e: google.maps.MouseEvent) => {
      if (!roofShape || isPointInShape(e.latLng)) {
        panel.position = e.latLng;
        overlay.draw();
      }
    });

    marker.addListener('dragend', () => {
      updateStrings(panelObjects);
    });

    // Right-click to delete
    div.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      setPanelObjects(prev => {
        const newPanels = prev.filter(p => p.id !== panel.id);
        updateStrings(newPanels);
        return newPanels;
      });
      marker.setMap(null);
    });

    overlay.getPanes()?.overlayLayer.appendChild(div);
  }, [map, selectedPanel.dimensions, roofShape]);

  const renderAllPanels = useCallback(() => {
    if (!overlayRef.current) return;

    const pane = overlayRef.current.getPanes()?.overlayLayer;
    if (!pane) return;

    while (pane.firstChild) {
      pane.removeChild(pane.firstChild);
    }

    panelObjects.forEach(renderPanel);
  }, [panelObjects, renderPanel]);

  const calculateOptimalLayout = async () => {
    if (!roofShape || !roofArea) return;
    
    setIsCalculating(true);
    try {
      // Calculate optimal panel placement
      const panelWidth = selectedPanel.dimensions.width;
      const panelHeight = selectedPanel.dimensions.height;
      const panelArea = panelWidth * panelHeight;
      const spacing = 0.1; // 10% spacing between panels
      
      const maxPanels = Math.floor(roofArea / (panelArea * (1 + spacing)));
      
      let bounds: google.maps.LatLngBounds;
      if (roofShape instanceof google.maps.Rectangle) {
        bounds = roofShape.getBounds();
      } else {
        bounds = new google.maps.LatLngBounds();
        roofShape.getPath().forEach(point => bounds.extend(point));
      }
      
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latSpan = ne.lat() - sw.lat();
      const lngSpan = ne.lng() - sw.lng();
      
      const rows = Math.ceil(Math.sqrt(maxPanels));
      const cols = Math.ceil(maxPanels / rows);
      
      const newPanels: PanelObject[] = [];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lat = sw.lat() + (latSpan * (row + 0.5) / rows);
          const lng = sw.lng() + (lngSpan * (col + 0.5) / cols);
          const position = new google.maps.LatLng(lat, lng);
          
          if (isPointInShape(position)) {
            newPanels.push({
              id: `${row}-${col}`,
              position,
              rotation,
              panel: selectedPanel
            });
          }
        }
      }
      
      setPanelObjects(newPanels);
      updateStrings(newPanels);
    } finally {
      setIsCalculating(false);
    }
  };

  const updateStrings = (panels: PanelObject[]) => {
    const newStrings: StringConfiguration[] = [];
    let remainingPanels = [...panels];

    while (remainingPanels.length > 0) {
      const startPanel = remainingPanels[0];
      const stringPanels = [startPanel];
      remainingPanels = remainingPanels.slice(1);

      // Find nearby panels with similar orientation
      for (let i = 0; i < remainingPanels.length; i++) {
        const panel = remainingPanels[i];
        const lastPanel = stringPanels[stringPanels.length - 1];

        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          lastPanel.position,
          panel.position
        );

        if (distance < 1 && Math.abs(lastPanel.rotation - panel.rotation) < 5) {
          stringPanels.push(panel);
          remainingPanels.splice(i, 1);
          i--;
        }
      }

      newStrings.push({
        id: Date.now().toString(),
        panels: stringPanels,
        inverter: selectedInverter
      });
    }

    setStrings(newStrings);
    onUpdate(newStrings);
  };

  return (
    <Card className="absolute bottom-4 left-4 w-80 bg-white shadow-lg">
      <CardContent className="p-4">
        {!roofShape && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            Please outline your roof area using the drawing tools above before placing panels.
          </div>
        )}
        {roofShape && !selectedPanel && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            Select your equipment in the Equipment tab before placing panels.
          </div>
        )}
        <div className="space-y-4">
          {/* Panel Template for Dragging */}
          {roofShape && selectedPanel && (
            <div 
              ref={dragPanelRef}
              draggable
              className="w-20 h-12 bg-blue-500/50 border-2 border-blue-500 cursor-move flex items-center justify-center text-sm text-white font-medium select-none"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              Drag to place
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Panel Rotation</label>
            <Slider
              value={[rotation]}
              onValueChange={(values) => setRotation(values[0])}
              min={0}
              max={360}
              step={15}
            />
            <div className="text-xs text-gray-600 text-right">{rotation}°</div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setPanelObjects([]);
                setStrings([]);
                onUpdate([]);
              }}
              variant="outline"
              className="w-full"
            >
              Clear All
            </Button>
            {roofArea && roofShape && (
              <Button
                onClick={calculateOptimalLayout}
                variant="outline"
                className="w-full"
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Auto-Layout'
                )}
              </Button>
            )}
          </div>

          {/* System Information */}
          {panelObjects.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-semibold">System Configuration</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Total Panels:</div>
                <div>{panelObjects.length}</div>
                
                <div className="text-gray-600">System Size:</div>
                <div>
                  {((panelObjects.length * selectedPanel.specifications.watts) / 1000).toFixed(2)} kW
                </div>
                
                <div className="text-gray-600">Strings:</div>
                <div>{strings.length}</div>
              </div>

              {/* String Details */}
              <div className="mt-4 space-y-2">
                {strings.map((string, index) => (
                  <div key={string.id} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <span>String {index + 1}:</span>
                      <span>{string.panels.length} panels</span>
                    </div>
                    <div className="text-xs text-gray-600 flex justify-between items-center">
                      <span>Power:</span>
                      <span>
                        {(string.panels.length * string.panels[0].panel.specifications.watts / 1000).toFixed(1)} kW
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 flex justify-between items-center">
                      <span>Inverter:</span>
                      <span>{string.inverter.model}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}