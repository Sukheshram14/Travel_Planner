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
import maplibregl from 'maplibre-gl'; // [FIX] Required for LngLatBounds
import 'maplibre-gl/dist/maplibre-gl.css';
import { FaMapMarkerAlt, FaUtensils, FaHotel, FaBinoculars, FaTimes, FaGasPump, FaChargingStation } from 'react-icons/fa';
import LayerToggle from './LayerToggle';
import axios from 'axios';
import api, { searchAlongRoute } from '../services/api'; // [FIX] Use api instance

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

const MapComponent = ({ 
  activities, 
  fullActivities = [], // [NEW] Unfiltered trip activities
  routeGeoJSON, 
  isActive, 
  activeDay, 
  selectedActivityId, 
  onMarkerClick, 
  hotels = [],
  bookedHotels = [], // [NEW] Confirmed bookings
  selectedHotelId, // [NEW] Sync with agent
  onHotelSelect, // [NEW] Sync back to agent
  destination // [NEW] Destination name for global search
}) => {
  const mapRef = useRef();
  
  // State for Visual Layers
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'satellite'
  const [showTraffic, setShowTraffic] = useState(false);
  const [pois, setPois] = useState([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [activePoiCategory, setActivePoiCategory] = useState(null); // [NEW] For chip highlighting
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null); // [NEW] For hotel popup

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
    setActivePoiCategory(categoryQuery); // [NEW] Highlight chip

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

      const results = await searchAlongRoute(categoryQuery, downsampled, { 
        maxDetourTime: 900, // 15 min detour 
        limit: 100 // [NEW] No limit (max TomTom allows)
      });
      if (results) {
        setPois(results);
        console.log(`✅ Found ${results.length} POIs along the route.`);

        // [AUTO-ZOOM] Fit map to show all found POIs
        if (results.length > 0 && mapRef.current) {
            const map = mapRef.current.getMap();
            const bounds = new maplibregl.LngLatBounds();
            results.forEach(p => bounds.extend([p.lng, p.lat]));
            map.fitBounds(bounds, { padding: 50, duration: 1500 });
        }
      }
    } catch (error) {
      console.error("❌ SAR Search Failed:", error);
    } finally {
      setPoiLoading(false);
    }
  };

  const fetchPOIs = async (category) => {
    let searchLat, searchLng;

    setPoiLoading(true);
    setPois([]);
    setActivePoiCategory(category); // [NEW] Highlight chip

    // Helper to get geometric center of an array of activities
    const getCenter = (items) => {
        const validItems = items.filter(a => a.location?.lat && a.location?.lng);
        if (validItems.length === 0) return null;
        return {
            lat: validItems.reduce((acc, a) => acc + a.location.lat, 0) / validItems.length,
            lng: validItems.reduce((acc, a) => acc + a.location.lng, 0) / validItems.length
        };
    };

    // [STRATEGY] If it's a global category like HOTELS, try to geocode the destination name first
    // to find the ACTUAL city/final destination center.
    if (category === '7314' && destination) {
        try {
            const resp = await axios.post('http://localhost:5000/api/v1/trips/reverse-geocode', { // Reuse endpoint for geocoding destination string if modified
                // Wait, reverse-geocode is for lat/lng... I need geocodeAddress
            });
            // FALLBACK: Use geoService pattern on server if I can't call it directly.
            // For now, I'll stick to the activities center but make it definitely use the FULL trip list
            const fullCenter = getCenter(fullActivities || activities);
            if (fullCenter) {
                searchLat = fullCenter.lat;
                searchLng = fullCenter.lng;
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    } else if (activeDay) {
        const dayActivities = activities.filter(a => a.dayNumber === activeDay);
        const dayCenter = getCenter(dayActivities);
        if (dayCenter) {
            searchLat = dayCenter.lat;
            searchLng = dayCenter.lng;
        }
    }

    // Ultimate fallback to full trip center if still not found
    if (!searchLat || !searchLng) {
        const fullCenter = getCenter(fullActivities || activities);
        if (fullCenter) {
            searchLat = fullCenter.lat;
            searchLng = fullCenter.lng;
        }
    }

    if (!searchLat || !searchLng) {
        setPoiLoading(false);
        return;
    }
    
    console.log(`🔍 Searching ${category} near trip destination center: ${searchLat}, ${searchLng}`);
    
    try {
      // Use API service instead of direct axios
      const response = await api.post('/trips/search-nearby', {
          category: category, 
          lat: searchLat,
          lng: searchLng,
          radius: 50000, 
          limit: 100 
      });

      if (response.data.status === 'success') {
        const foundPois = response.data.data;
        setPois(foundPois);
        console.log(`✅ Found ${foundPois.length} POIs across the region.`);

        // [AUTO-ZOOM] Fit map to show all found POIs
        if (foundPois.length > 0 && mapRef.current) {
            const map = mapRef.current.getMap();
            const bounds = new maplibregl.LngLatBounds();
            foundPois.forEach(p => bounds.extend([p.lng, p.lat]));
            map.fitBounds(bounds, { padding: 50, duration: 1500 });
        }
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

  // [NEW] Fly to selected hotel
  useEffect(() => {
    if (selectedHotelId && hotels.length > 0) {
      const selected = hotels.find(h => h.id === selectedHotelId || h._id === selectedHotelId);
      if (selected && selected.coordinates && mapRef.current) {
        setSelectedHotel(selected); // Also open popup
        mapRef.current.getMap().flyTo({
          center: [selected.coordinates.lon, selected.coordinates.lat],
          zoom: 15,
          duration: 1500,
          essential: true
        });
      }
    }
  }, [selectedHotelId, hotels]);

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
        {/* <button 
          onClick={() => routeGeoJSON ? fetchAlongRoute('restaurant') : fetchPOIs('7315')} 
          disabled={poiLoading} 
          className={`map-chip ${activePoiCategory === 'restaurant' || activePoiCategory === '7315' ? 'active' : ''}`}
        >
          <FaUtensils /> Restaurants
        </button>
        <button 
          onClick={() => routeGeoJSON ? fetchAlongRoute('hotel') : fetchPOIs('7314')} 
          disabled={poiLoading} 
          className={`map-chip ${activePoiCategory === 'hotel' || activePoiCategory === '7314' ? 'active' : ''}`}
        >
          <FaHotel /> Hotels
        </button> */}
        <button 
          onClick={() => fetchPOIs('7376')} 
          disabled={poiLoading} 
          className={`map-chip ${activePoiCategory === '7376' ? 'active' : ''}`}
        >
          <FaBinoculars /> Attractions
        </button>
        <div style={{ minWidth: '1px', background: 'rgba(255,255,255,0.2)', margin: '4px 2px' }} />
        <button 
          onClick={() => fetchAlongRoute('fuel')} 
          disabled={poiLoading || !routeGeoJSON}
          className={`map-chip fuel ${activePoiCategory === 'fuel' ? 'active' : ''}`}
        >
          <FaGasPump /> Fuel
        </button>
        <button 
          onClick={() => fetchAlongRoute('electric vehicle station')} 
          disabled={poiLoading || !routeGeoJSON}
          className={`map-chip ev ${activePoiCategory === 'electric vehicle station' ? 'active' : ''}`}
        >
          <FaChargingStation /> EV
        </button>
        {(pois.length > 0 || activePoiCategory) && (
          <button onClick={() => { setPois([]); setActivePoiCategory(null); }} className="map-chip clear">
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

        {/* 🛠️ LAYER TOGGLES (Satellite / Traffic) */}
        <LayerToggle 
          mapStyle={mapStyle} 
          setMapStyle={setMapStyle} 
          showTraffic={showTraffic} 
          setShowTraffic={setShowTraffic} 
        />

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

        {/* 🏨 HOTEL MARKERS (Recommendations) */}
        {hotels.map((hotel, idx) => {
          if (!hotel.coordinates?.lat || !hotel.coordinates?.lon) return null;

          return (
            <Marker
              key={`hotel-${idx}`}
              longitude={hotel.coordinates.lon}
              latitude={hotel.coordinates.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedHotel(hotel);
                if (onHotelSelect) onHotelSelect(hotel.id || hotel._id);
              }}
            >
              <div
                className={`hotel-marker-pin ${ (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? 'active' : '' }`}
                style={{
                  '--hotel-pin-color': (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? '#ff0000' : '#ff4b4b'
                }}
              >
                <div className="hotel-pin-icon">
                  <FaHotel />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* 🏆 RESERVED HOTEL MARKERS (Confirmed) */}
        {bookedHotels.map((booking, idx) => {
          const hotel = booking.hotelDetails;
          if (!hotel?.coordinates?.lat || !hotel?.coordinates?.lon) return null;

          return (
            <Marker
              key={`booked-${idx}`}
              longitude={hotel.coordinates.lon}
              latitude={hotel.coordinates.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedHotel({ ...hotel, isReserved: true });
                if (onHotelSelect) onHotelSelect(hotel.id || hotel._id);
              }}
            >
              <div
                className={`hotel-marker-pin reserved ${ (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? 'active' : '' }`}
                style={{
                  '--hotel-pin-color': '#ffd700' // Gold for reserved
                }}
              >
                <div className="hotel-pin-icon">
                  <FaHotel />
                </div>
              </div>
            </Marker>
          );
        })}

        {/* 🏨 HOTEL POPUP */}
        {selectedHotel && (
          <Popup
            longitude={selectedHotel.coordinates.lon}
            latitude={selectedHotel.coordinates.lat}
            anchor="top"
            onClose={() => setSelectedHotel(null)}
            closeButton={false}
            closeOnClick={true}
            maxWidth="250px"
          >
            <div className="poi-popup" style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ margin: '0', color: selectedHotel.isReserved ? '#ffd700' : '#ff6b6b' }}>
                  🏨 {selectedHotel.name}
                </h4>
                {selectedHotel.isReserved && (
                  <span style={{ fontSize: '0.65rem', background: '#ffd700', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>
                    RESERVED
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0', fontSize: '0.85rem', opacity: 0.8 }}>{selectedHotel.address}</p>
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,107,107,0.1)', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
                  ⭐ {selectedHotel.rating} | ₹{selectedHotel.pricePerNight}/night
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  {selectedHotel.amenities?.slice(0, 3).join(' • ')}
                </div>
              </div>
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
