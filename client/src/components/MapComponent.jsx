/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 1. FILE PATH: client/src/components/MapComponent.jsx
 * 2. PURPOSE: Visualize trip in 3D using MapLibre (Open Source Vector Maps).
 * ==========================================================================================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { FaMapMarkerAlt } from 'react-icons/fa';
import LayerToggle from './LayerToggle';

// 🎨 MAP STYLES
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
// For Satellite, we will overlay a Raster Layer, as Esri doesn't provide a free Vector Style JSON easily.
const ESRI_SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// 🚦 TRAFFIC API (TomTom)
const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY; 
const TRAFFIC_URL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`;

const MapComponent = ({ activities, routeGeoJSON }) => {
  const mapRef = useRef();
  
  // State for Visual Layers
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'satellite'
  const [showTraffic, setShowTraffic] = useState(false);

  console.log("🗺️ MapComponent Data:", { activitiesCount: activities?.length, hasRoute: !!routeGeoJSON });

  // 1. Calculate Center
  const validActivity = activities.find(a => a.location?.lat);
  const initialViewState = {
    longitude: validActivity ? validActivity.location.lng : 2.3522,
    latitude: validActivity ? validActivity.location.lat : 48.8566,
    zoom: 12,
    pitch: 45, 
    bearing: 0
  };

  // 🚀 RESIZE & AUTO-FLY: Recenter map whenever activities change
  useEffect(() => {
    if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map) {
          map.resize();
          if (validActivity) {
            console.log("✈️ Flying to new destination...");
            map.flyTo({
              center: [validActivity.location.lng, validActivity.location.lat],
              duration: 2000,
              essential: true
            });
          }
        }
    }
  }, [activities]);

  // 2. Route Layer Style (Dynamic Colors per Day)
  const routeLayerStyle = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#00f7ff'], 
      'line-width': 4,
      'line-opacity': 0.9
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      position: 'relative',
      border: '2px solid var(--color-neon-cyan)', // 🚩 DEBUG BORDER
      background: '#0a0a0a'
    }}>
      
      {/* 🛠️ Floating Layer Controls */}
      <LayerToggle 
        mapStyle={mapStyle} 
        setMapStyle={setMapStyle} 
        showTraffic={showTraffic} 
        setShowTraffic={setShowTraffic} 
      />

      <Map
        ref={mapRef}
        onLoad={() => console.log("✅ Map Loaded Successfully")}
        onError={(e) => console.error("❌ Map Error:", e.error)}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        // If Satellite, we still use a base style (Dark) but overlay the Raster Image on top
        mapStyle={STYLE_DARK} 
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* 🛰️ SATELLITE LAYER (Conditional) */}
        {mapStyle === 'satellite' && (
          <Source id="satellite-source" type="raster" tiles={[ESRI_SATELLITE_URL]} tileSize={256}>
            <Layer 
              id="satellite-layer" 
              type="raster" 
              paint={{ 'raster-opacity': 1 }}
            />
          </Source>
        )}

        {/* 🚦 TRAFFIC LAYER (Conditional) */}
        {showTraffic && TOMTOM_KEY && (
          <Source id="traffic-source" type="raster" tiles={[TRAFFIC_URL]} tileSize={256}>
            <Layer 
              id="traffic-layer" 
              type="raster" 
              paint={{ 'raster-opacity': 0.7 }}
            />
          </Source>
        )}

        {/* 🛣️ The Real Route (GeoJSON) - FeatureCollection support */}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* 📍 Markers */}
        {activities.map((activity, idx) => {
          const lat = activity.location?.lat;
          const lng = activity.location?.lng;
          if (!lat || !lng) return null;

          // Define Marker Color (Cycle or use day info)
          const dayColors = ['#00f7ff', '#ff00ff', '#00ff00', '#ffff00', '#ff8000', '#ff0000', '#8000ff'];
          const markerColor = activity.dayNumber 
            ? dayColors[(activity.dayNumber - 1) % dayColors.length]
            : (mapStyle === 'satellite' ? '#ffeb3b' : '#00f7ff');

          return (
            <Marker 
              key={idx} 
              longitude={lng} 
              latitude={lat} 
              anchor="bottom"
            >
              <div className="custom-marker" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <span style={{ 
                  background: markerColor, 
                  color: '#000', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  marginBottom: '2px',
                  boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                }}>
                  {activity.dayNumber ? `D${activity.dayNumber}-${activity.orderInDay || (idx + 1)}` : (idx + 1)}
                </span>
                <FaMapMarkerAlt size={22} color={markerColor} style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.8))' }}/>
              </div>
            </Marker>
          );
        })}

      </Map>
    </div>
  );
};

export default MapComponent;
