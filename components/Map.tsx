

import React, { useRef, useImperativeHandle, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import type { Landmark } from '../types';
import MonumentIcon from './icons/MonumentIcon';
import MountainIcon from './icons/MountainIcon';
import WaterDropIcon from './icons/WaterDropIcon';

// Inform TypeScript that the global 'L' object from the Leaflet CDN is available.
declare var L: any;

interface MapProps {
  landmarks: Landmark[];
  activeIndex: number;
  onSelectLandmark: (id: number) => void;
  onMapClick: (coords: [number, number]) => void;
}

export interface MapHandles {
  reset: () => void;
  invalidateSize: () => void;
}

const getIcon = (iconType: Landmark['iconType']) => {
  let iconComponent;
  switch (iconType) {
    case 'monument':
      iconComponent = <MonumentIcon />;
      break;
    case 'nature':
      iconComponent = <MountainIcon />;
      break;
    case 'water':
      iconComponent = <WaterDropIcon />;
      break;
    default:
      iconComponent = <MonumentIcon />;
  }
  return L.divIcon({
    html: renderToString(iconComponent),
    className: 'custom-leaflet-icon',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  });
};


const Map = React.forwardRef<MapHandles, MapProps>(({ landmarks, activeIndex, onSelectLandmark, onMapClick }, ref) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null); // Holds the Leaflet map instance
  const markersRef = useRef<any[]>([]); // Holds the Leaflet marker instances
  const polylineRef = useRef<any>(null); // Holds the Leaflet polyline instance
  const polylineAnimTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  
  // Initialize the map on component mount
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: landmarks[0].coords,
        zoom: 7,
        zoomControl: false, // Disable default zoom control for a cleaner UI
        attributionControl: false, // Disable the attribution control
      });

      // Updated the map style to the standard OpenStreetMap theme for a more detailed, classic look as requested.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        // Increasing the buffer pre-loads more tiles around the viewport,
        // which helps prevent gray areas from showing during fast pans or fly-to animations.
        keepBuffer: 8,
      }).addTo(map);

      map.on('click', (e: any) => {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      });

      mapRef.current = map;
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [landmarks, onMapClick]);

  // Set default cursor style
  useEffect(() => {
    const mapContainer = mapRef.current?.getContainer();
    if (mapContainer) {
        mapContainer.style.cursor = 'grab';
    }
  }, []);


  // Update markers when landmarks change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear any existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const newMarkers: any[] = [];
    landmarks.slice(1).forEach(landmark => {
      const icon = getIcon(landmark.iconType);
      const marker = L.marker(landmark.coords, { icon }).addTo(mapRef.current);
      marker.bindPopup(`<b>${landmark.name}</b><br>${landmark.description.substring(0, 100)}...`);
      marker.on('click', () => onSelectLandmark(landmark.id));
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

  }, [landmarks, onSelectLandmark]);

  // Animate polyline drawing
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous timeouts and polyline
    polylineAnimTimeoutsRef.current.forEach(clearTimeout);
    polylineAnimTimeoutsRef.current = [];
    if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
    }

    const coordinates = landmarks.slice(1).map(landmark => landmark.coords);

    if (coordinates.length > 1) {
        const animatedPolyline = L.polyline([], {
            color: '#fcd34d', // amber-300
            weight: 3,
            opacity: 0.8,
            dashArray: '8, 8',
        }).addTo(mapRef.current);
        polylineRef.current = animatedPolyline;

        let i = 0;
        const addPoint = () => {
            if (i < coordinates.length) {
                animatedPolyline.addLatLng(coordinates[i]);
                i++;
                const timeoutId = setTimeout(addPoint, 50); // Animation delay
                polylineAnimTimeoutsRef.current.push(timeoutId);
            }
        };
        addPoint();
    }
    
    return () => {
        polylineAnimTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [landmarks]);

  // Animate map view when activeIndex changes. Replaced custom animation with Leaflet's
  // optimized flyTo method to prevent tiles from disappearing on fast transitions.
  useEffect(() => {
    if (!mapRef.current || !landmarks[activeIndex]) return;

    // A brief delay ensures other UI updates (like the sidebar) have started,
    // reducing rendering conflicts with the map animation.
    const animationTimeout = setTimeout(() => {
      if (!mapRef.current) return;

      // This call helps fix rendering glitches by ensuring Leaflet knows the correct container size.
      mapRef.current.invalidateSize();

      const targetLandmark = landmarks[activeIndex];
      if (!targetLandmark) {
          console.error("Animation aborted: target landmark is undefined.");
          return;
      }
      
      const zoomLevel = activeIndex === 0 ? 7 : 13;
      const duration = 1.0; // A faster, more responsive duration.

      mapRef.current.flyTo(targetLandmark.coords, zoomLevel, {
          animate: true,
          duration: duration,
      });

      // Open the marker's popup towards the end of the flight animation.
      if (activeIndex > 0) {
          const markerIndex = landmarks.slice(1).findIndex(l => l.id === targetLandmark.id);
          if (markersRef.current[markerIndex]) {
              setTimeout(() => {
                  if (mapRef.current) { // Ensure map instance still exists
                      markersRef.current[markerIndex]?.openPopup();
                  }
              }, duration * 750); // Open at 75% of animation time
          }
      } else {
          mapRef.current.closePopup();
      }

    }, 50); 

    return () => {
      clearTimeout(animationTimeout);
    };
  }, [activeIndex, landmarks]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (mapRef.current) {
        mapRef.current.flyTo(landmarks[0].coords, 7);
      }
    },
    invalidateSize: () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize(true);
      }
    }
  }));

  return (
    <>
      {/* Inject custom styles for Leaflet popups and icons */}
      <style>{`
        /* Popup Styling */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background: rgba(17, 24, 39, 0.8); /* bg-gray-900 with opacity */
          color: #d1d5db; /* text-gray-300 */
          border-radius: 0.375rem;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .leaflet-popup-content {
          margin: 14px;
          font-family: sans-serif;
        }
        .leaflet-popup-content b {
            color: #ffffff;
        }
        a.leaflet-popup-close-button {
          color: #d1d5db !important;
          padding: 8px 8px 0 0;
        }
        
        /* Custom Icon Styling */
        .custom-leaflet-icon {
          background: transparent;
          border: none;
        }
        .custom-leaflet-icon svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        }
      `}</style>
      <div ref={mapContainerRef} className="absolute inset-0 z-10 w-full h-full" />
    </>
  );
});

export default Map;