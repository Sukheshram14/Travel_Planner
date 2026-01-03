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
const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// ... [rest of traffic logic stays same]

const MapComponent = ({ activities, routeGeoJSON }) => {
  const mapRef = useRef();
  
  // State for Visual Layers
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'light' | 'satellite'
  const [showTraffic, setShowTraffic] = useState(false);
  const [showFuel, setShowFuel] = useState(false);
  const [fuelStations, setFuelStations] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const validActivity = activities.find(a => a.location?.lat);

  // ⛽ Fetch Fuel Stations when toggled
  useEffect(() => {
    if (showFuel && validActivity) {
      console.log("⛽ Fetching nearby fuel stations...");
      fetch(`http://localhost:5000/api/v1/trips/nearby/fuel?lat=${validActivity.location.lat}&lng=${validActivity.location.lng}`)
        .then(res => res.json())
        .then(data => setFuelStations(data))
        .catch(err => console.error("Fuel Fetch Error:", err));
    } else {
      setFuelStations([]);
    }
  }, [showFuel, validActivity]);

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

  const currentBaseStyle = mapStyle === 'light' ? STYLE_LIGHT : STYLE_DARK;

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      borderRadius: '12x', 
      overflow: 'hidden', 
      position: 'relative',
      border: '2px solid var(--color-neon-cyan)',
      background: '#0a0a0a'
    }}>
      
      {/* 🛠️ Floating Layer Controls */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <LayerToggle 
            mapStyle={mapStyle} 
            setMapStyle={setMapStyle} 
            showTraffic={showTraffic} 
            setShowTraffic={setShowTraffic} 
        />
        {/* Simple Light/Dark Toggle if needed, but LayerToggle should handle it */}
      </div>

      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={currentBaseStyle} 
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

        {/* ... [Traffic source stays same] */}

        {/* 🛣️ The Real Route (GeoJSON) */}
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

          const dayColors = ['#00f7ff', '#ff00ff', '#00ff00', '#ffff00', '#ff8000', '#ff0000', '#8000ff'];
          const markerColor = activity.dayNumber 
            ? dayColors[(activity.dayNumber - 1) % dayColors.length]
            : '#00f7ff';

          return (
            <React.Fragment key={idx}>
              <Marker 
                longitude={lng} 
                latitude={lat} 
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setSelectedActivity(activity);
                }}
              >
                <div className="custom-marker" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <span style={{ 
                    background: markerColor, 
                    color: '#000', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '9px', 
                    fontWeight: 'bold', 
                    marginBottom: '2px'
                  }}>
                    {activity.dayNumber ? `D${activity.dayNumber}-${activity.orderInDay}` : (idx + 1)}
                  </span>
                  <FaMapMarkerAlt size={22} color={markerColor} />
                </div>
              </Marker>

              {selectedActivity === activity && (
                <Popup
                  longitude={lng}
                  latitude={lat}
                  anchor="top"
                  onClose={() => setSelectedActivity(null)}
                  closeButton={true}
                  closeOnClick={false}
                  maxWidth="300px"
                >
                  <div style={{ color: '#000', padding: '5px' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{activity.name}</h4>
                    <p style={{ fontSize: '0.8rem', margin: '0 0 10px 0' }}>{activity.description}</p>
                    {/* Image placeholder that opens search */}
                    <div 
                      onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(activity.name + " " + (activity.location?.address || ""))}`, "_blank")}
                      style={{ 
                        width: '100%', 
                        height: '100px', 
                        background: '#eee', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px dashed #ccc'
                      }}
                    >
                      <FaCamera size={24} color="#999" />
                      <span style={{ marginLeft: '10px', fontSize: '0.7rem' }}>Click for Photos</span>
                    </div>
                    {activity.location?.gMapLink && (
                      <a 
                        href={activity.location.gMapLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-neon-blue)', textDecoration: 'none', fontWeight: 'bold' }}
                      >
                        Navigate with GPS ↗
                      </a>
                    )}
                  </div>
                </Popup>
              )}
            </React.Fragment>
          );
        })}

      </Map>
    </div>
  );
};

export default MapComponent;
