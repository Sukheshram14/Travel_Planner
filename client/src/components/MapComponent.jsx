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
import { FaMapMarkerAlt, FaUtensils, FaHotel, FaBinoculars, FaTimes, FaGasPump, FaChargingStation } from 'react-icons/fa';
import LayerToggle from './LayerToggle';
import axios from 'axios';
import { searchAlongRoute } from '../services/api';

// 🚦 TRAFFIC API (TomTom) & KEY
const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_API_KEY; 
const TRAFFIC_URL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`;
const INCIDENT_URL = `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`;

// 🎨 MAP STYLES
// 🚀 TOMTOM PROPRIETARY MAP STYLES (Merged Style API)
// Using Merged API often avoids the raw JSON typos found in direct style links
const STYLE_MAIN = `https://api.tomtom.com/style/1/style/22.2.1-9?key=${TOMTOM_KEY}&map=basic_main&traffic_incidents=incidents_day&traffic_flow=flow_relative0`;
const STYLE_NIGHT = `https://api.tomtom.com/style/1/style/22.2.1-9?key=${TOMTOM_KEY}&map=basic_night&traffic_incidents=incidents_night&traffic_flow=flow_relative0-dark`;
// For Satellite, TomTom provides raster tiles
const TOMTOM_SATELLITE_URL = `https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.jpg?key=${TOMTOM_KEY}`;

const MapComponent = ({ activities, routeGeoJSON, isActive, activeDay, selectedActivityId, onMarkerClick }) => {
  const mapRef = useRef();
  
  // State for Visual Layers
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'satellite'
  const [showTraffic, setShowTraffic] = useState(false);
  const [pois, setPois] = useState([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [selectedPoi, setSelectedPoi] = useState(null);

  // 🚀 RESIZE: When the map panel becomes visible, we MUST trigger a resize
  // This is because the map container height might have been 0 when hidden
  useEffect(() => {
    if (isActive && mapRef.current) {
      setTimeout(() => {
        const map = mapRef.current.getMap();
        if (map) {
          console.log("📏 Triggering Map Resize...");
          map.resize();
        }
      }, 100);
    }
  }, [isActive]);

  console.log("🗺️ MapComponent Data:", { activitiesCount: activities?.length, hasRoute: !!routeGeoJSON });

  const fetchAlongRoute = async (categoryQuery) => {
    if (!routeGeoJSON) return;

    setPoiLoading(true);
    setPois([]);

    try {
      // Flatten all coordinates from all features in routeGeoJSON
      // TomTom SAR expects { lat, lon }
      const points = [];
      routeGeoJSON.features.forEach(feature => {
        if (feature.geometry?.coordinates) {
          feature.geometry.coordinates.forEach(coord => {
            points.push({ lat: coord[1], lon: coord[0] });
          });
        }
      });

      // Downsample points if too many (TomTom limit 30k, but we want speed)
      const step = Math.max(1, Math.floor(points.length / 100));
      const downsampled = points.filter((_, idx) => idx % step === 0);

      const results = await searchAlongRoute(categoryQuery, downsampled, { maxDetourTime: 900 }); // 15 min detour
      if (results) {
        setPois(results);
      }
    } catch (error) {
      console.error("❌ SAR Search Failed:", error);
    } finally {
      setPoiLoading(false);
    }
  };

  const fetchPOIs = async (category) => {
    // [FIX] Determine the center point for search
    // If a specific day is valid, try to find a location from that day's activities.
    // Otherwise fallback to the first activity of the whole trip.
    let searchLat, searchLng;

    if (activeDay) {
        const dayActivities = activities.filter(a => a.dayNumber === activeDay);
        if (dayActivities.length > 0 && dayActivities[0].location) {
            searchLat = dayActivities[0].location.lat;
            searchLng = dayActivities[0].location.lng;
        }
    } 
    
    // Fallback if no active day or active day has no locs
    if (!searchLat && activities.length > 0 && activities[0].location) {
         searchLat = activities[0].location.lat;
         searchLng = activities[0].location.lng;
    }

    if (!searchLat || !searchLng) return;
    
    setPoiLoading(true);
    setPois([]);
    
    try {
      const response = await axios.post(`http://localhost:5000/api/v1/trips/search-nearby`, {
          category: category, 
          lat: searchLat,
          lng: searchLng,
          radius: 5000
      });

      if (response.data.status === 'success') {
        setPois(response.data.data);
      }
    } catch (error) {
      console.error("❌ POI Search Failed:", error);
    } finally {
      setPoiLoading(false);
    }
  };

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

  // [NEW] Fly to selected activity
  useEffect(() => {
    if (selectedActivityId && activities) {
      const selected = activities.find(a => a.name === selectedActivityId);
      if (selected && selected.location && mapRef.current) {
        mapRef.current.getMap().flyTo({
          center: [selected.location.lng, selected.location.lat],
          zoom: 14,
          duration: 1500,
          essential: true
        });
      }
    }
  }, [selectedActivityId, activities]);

  // 2. Route Layer Style (Dynamic Colors & Opacity)
  const routeLayerStyle = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#00f7ff'], 
      'line-width': 4,
      'line-opacity': activeDay 
        ? ['case', ['==', ['get', 'day'], activeDay], 0.9, 0.15] 
        : 0.8
    }
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%', 
      borderRadius: '12px', 
      overflow: 'hidden', 
      position: 'relative',
      background: '#0a0a0a',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)' // ✨ Nice shadow instead of border
    }}>
      
      {/* 🔍 Google-Style POV/POI Chips */}
      <div className="map-chips-container" style={{
        position: 'absolute',
        top: '10px',
        left: '0',
        width: '100%',
        zIndex: 100,
        display: 'flex',
        gap: '12px',
        padding: '10px 16px', // Horizontal padding for edge safety
        overflowX: 'auto',
        scrollbarWidth: 'none', /* Firefox */
        msOverflowStyle: 'none', /* IE/Edge */
        alignItems: 'center',
        // background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)', // Optional: slight top shade for contrast
        background: 'transparent'
      }}>
        <button onClick={() => fetchPOIs('7315')} disabled={poiLoading} className={`map-chip ${selectedPoi === '7315' ? 'active' : ''}`}>
          <FaUtensils /> Restaurants
        </button>
        <button onClick={() => fetchPOIs('7314')} disabled={poiLoading} className="map-chip">
          <FaHotel /> Hotels
        </button>
        <button onClick={() => fetchPOIs('7376')} disabled={poiLoading} className="map-chip">
          <FaBinoculars /> Attractions
        </button>
        <div style={{ minWidth: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 2px' }} />
        <button 
          onClick={() => fetchAlongRoute('fuel')} 
          disabled={poiLoading || !routeGeoJSON}
          className="map-chip fuel"
        >
          <FaGasPump /> Fuel
        </button>
        <button 
          onClick={() => fetchAlongRoute('electric vehicle station')} 
          disabled={poiLoading || !routeGeoJSON}
          className="map-chip ev"
        >
          <FaChargingStation /> EV
        </button>
        {pois.length > 0 && (
          <button onClick={() => setPois([])} className="map-chip clear">
            <FaTimes /> Clear
          </button>
        )}
      </div>

      <Map
        ref={mapRef}
        onLoad={() => console.log("✅ Map Loaded Successfully")}
        onError={(e) => console.error("❌ Map Error:", e.error)}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle === 'satellite' ? undefined : (mapStyle === 'dark' ? STYLE_NIGHT : STYLE_MAIN)} 
        attributionControl={false}
      >
        {/* <NavigationControl position="bottom-right" showCompass={false} /> Removed for custom controls */}
        
        {/* 🎛️ CUSTOM ZOOM CONTROLS */}
        <div style={{
           position: 'absolute',
           bottom: '30px', 
           right: '20px',
           display: 'flex',
           flexDirection: 'column',
           gap: '8px', 
           zIndex: 1000
        }}>
           <button 
             onClick={() => mapRef.current?.zoomIn()}
             className="map-control-btn"
             style={styles.mapControlBtn}
             aria-label="Zoom In"
           >
             <span style={{fontSize: '24px', lineHeight: '1'}}>+</span>
           </button>
           <button 
             onClick={() => mapRef.current?.zoomOut()}
             className="map-control-btn"
             style={styles.mapControlBtn}
             aria-label="Zoom Out"
           >
             <span style={{fontSize: '24px', lineHeight: '1'}}>−</span>
           </button>
        </div>

        {/* 🛰️ SATELLITE LAYER */}
        {mapStyle === 'satellite' && (
          <Source id="satellite-source" type="raster" tiles={[TOMTOM_SATELLITE_URL]} tileSize={256}>
            <Layer id="satellite-layer" type="raster" paint={{ 'raster-opacity': 1 }} />
          </Source>
        )}

        {/* 🚦 TRAFFIC LAYER */}
        {showTraffic && TOMTOM_KEY && (
          <>
            <Source id="traffic-flow-source" type="raster" tiles={[TRAFFIC_URL]} tileSize={256}>
              <Layer id="traffic-flow-layer" type="raster" paint={{ 'raster-opacity': 0.6 }} />
            </Source>
            <Source id="traffic-incident-source" type="raster" tiles={[INCIDENT_URL]} tileSize={256}>
              <Layer id="traffic-incident-layer" type="raster" paint={{ 'raster-opacity': 0.9 }} />
            </Source>
          </>
        )}

        {/* 🛣️ Route Layer */}
        {routeGeoJSON && (
          <Source id="route-source" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {activities.map((activity, idx) => {
          let lat = activity.location?.lat;
          let lng = activity.location?.lng;
          if (!lat || !lng) return null;

          // [Simple Jitter] If multiple markers are at the exact same spot, offset them slightly
          // Determine if any previous marker has the same lat/lng
          const overlapCount = activities.slice(0, idx).filter(a => 
             Math.abs(a.location?.lat - lat) < 0.0001 && Math.abs(a.location?.lng - lng) < 0.0001
          ).length;

          if (overlapCount > 0) {
             const angle = (overlapCount * 2 * Math.PI) / 6; // Spread in a circle
             const offset = 0.0003 * (1 + Math.floor(overlapCount / 6)); // Radius increases
             lat += Math.sin(angle) * offset;
             lng += Math.cos(angle) * offset;
          }

          const dayColors = ['#00f7ff', '#ff00ff', '#00ff00', '#ffff00', '#ff8000', '#ff0000', '#8000ff'];
          const markerColor = activity.dayNumber 
            ? dayColors[(activity.dayNumber - 1) % dayColors.length]
            : '#00f7ff';

          // Show label if it's the active day or if no active day is selected (and not too many markers)
          const showLabel = !activeDay || activeDay === activity.dayNumber;
          const isSelected = selectedActivityId === activity.name;

          return (
            <Marker 
              key={idx} 
              longitude={lng} 
              latitude={lat} 
              anchor="bottom"
              style={{ zIndex: isSelected ? 100 : 'auto' }} // Bring selected to front
              onClick={(e) => {
                e.originalEvent.stopPropagation(); // Prevent map click
                onMarkerClick?.(activity.name);
              }}
            >
              <div 
                className={`premium-marker ${showLabel ? 'show-label' : ''}`} 
                style={{ 
                  '--marker-color': markerColor,
                  transform: isSelected ? 'scale(1.3)' : 'scale(1)', // Highlights selected
                  border: isSelected ? '2px solid #rgb(255 255 255 / 0%)' : 'none',
                  zIndex: isSelected ? 100 : 1
                }}
                title={activity.name}
              >
                <div className="marker-dot">
                  <div className="marker-label">
                    {activeDay === activity.dayNumber ? activity.orderInDay || (idx + 1) : `D${activity.dayNumber}`}
                  </div>
                </div>
                <div className="marker-shadow"></div>
              </div>
            </Marker>
          );
        })}

        {/* 🌟 POI Markers */}
        {pois.map((poi, idx) => (
          <Marker key={`poi-${idx}`} longitude={poi.lng} latitude={poi.lat} anchor="bottom">
            <div 
              onClick={() => setSelectedPoi(poi)}
              className="poi-marker"
              style={{ 
                '--poi-color': poi.category?.toLowerCase().includes('charging') ? '#10b981' : (poi.category?.toLowerCase().includes('fuel') ? '#f59e0b' : '#ff8000')
              }}
            >
              <div className="poi-icon">
                {poi.category?.toLowerCase().includes('charging') ? <FaChargingStation /> : 
                 (poi.category?.toLowerCase().includes('fuel') ? <FaGasPump /> : <FaMapMarkerAlt />)}
              </div>
            </div>
          </Marker>
        ))}

        {/* ℹ️ POI Popup */}
        {selectedPoi && (
          <Popup
            longitude={selectedPoi.lng}
            latitude={selectedPoi.lat}
            anchor="top"
            onClose={() => setSelectedPoi(null)}
            closeButton={false}
            closeOnClick={true}
            maxWidth="200px"
          >
            <div className="poi-popup">
              <h4>{selectedPoi.name}</h4>
              <p>{selectedPoi.address}</p>
              {selectedPoi.detourTime && (
                <span className="detour-badge">
                  ⚡ +{Math.round(selectedPoi.detourTime / 60)} min
                </span>
              )}
            </div>
          </Popup>
        )}

      </Map>
    </div>
  );
};

const styles = {
  poiBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    background: 'transparent',
    color: '#fff',
    border: '1px solid #444',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  mapControlBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.6)', 
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#00f7ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
    fontWeight: 'bold'
  }
};

export default MapComponent;
