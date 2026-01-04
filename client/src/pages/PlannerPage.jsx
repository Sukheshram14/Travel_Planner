/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /client/src/pages/PlannerPage.jsx
 * 
 * Purpose:
 * The "Input Page". Users tell us what they want.
 * 
 * ==========================================================================================================================================================
 */

import React, { useState, useEffect } from 'react';
import { createTrip, getTrip } from '../services/api';
import ItineraryDisplay from '../components/ItineraryDisplay';
import MapComponent from '../components/MapComponent';
import { useGeolocation } from '../hooks/useGeolocation';
import { FaMapMarkerAlt, FaCalendarAlt, FaWallet, FaUsers, FaCar, FaBolt, FaRocket } from 'react-icons/fa';

const PlannerPage = () => {
  // 1. State Management
  const [formData, setFormData] = useState({
    origin: '', 
    destination: '',
    startDate: '',
    endDate: '',
    budget: 'moderate',
    travelers: 'solo',
    interests: '',
    travelMode: 'car',
    vehicleEngineType: 'combustion'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [showForm, setShowForm] = useState(true);
  const [activeDay, setActiveDay] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null); // [NEW] For sync
  
  const handleActivitySelect = (id) => {
    setSelectedActivityId(id);
  };
  
  const { address, accuracy, loading: gpsLoading, error: gpsError, requestLocation, clearLocation } = useGeolocation();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('tripId');
    if (tripId) {
      loadTripFromId(tripId);
    }
  }, []);

  const loadTripFromId = async (id) => {
    try {
      setLoading(true);
      const response = await getTrip(id);
      if (response && response.status === 'success') {
         const trip = response.data.trip;
         setFormData(prev => ({
            ...prev,
            origin: trip.origin || '',
            destination: trip.destination || '',
            startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
            endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
            budget: trip.budget || 'moderate',
            travelers: trip.travelers || 'solo'
         }));
         setResult({
            ...trip,
            weather: response.data.weather,
            routeGeoJSON: response.data.routeGeoJSON
         });
      }
    } catch (err) {
      console.error("Failed to load saved trip", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (address) {
      setFormData(prev => ({ ...prev, origin: address }));
    }
  }, [address]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createTrip(formData);
      if (response && response.status === 'success') {
        const trip = response.data.trip;
        if (trip._id) {
            const newUrl = `${window.location.pathname}?tripId=${trip._id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }
        setResult({
           ...trip, 
           weather: response.data.weather,
           routeGeoJSON: response.data.routeGeoJSON
        });
      }
    } catch (err) {
      console.error("Trip creation failed:", err);
      if (err.response?.status === 401) {
        alert("Please sign in to save trips. Redirecting to login...");
        window.location.href = '/login';
      } else {
        alert("Failed to plan trip. Please check if the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  // [FIX] Filter Itinerary for Display based on Active Day
  const displayedItinerary = activeDay 
    ? (result?.itinerary || []).filter(d => d.dayNumber === activeDay)
    : (result?.itinerary || []);

  return (
    <div className="planner-page" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: 'var(--color-bg)',
      color: 'var(--color-text)',
        position: 'relative',
        paddingTop: '60px'
    }}>
      {result && (
        <button onClick={() => setShowForm(!showForm)} className="mobile-toggle">
          {showForm ? '🗺️ View Map' : '📝 View Plan'}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div className={`sidebar ${showForm ? 'active' : 'hidden'}`} style={{ 
            width: result ? '500px' : '100%',
            maxWidth: result ? '500px' : '800px',
            margin: result ? '0' : '0 auto',
            overflowY: 'auto', 
            padding: '2rem',
            borderRight: '1px solid var(--color-border)',
            transition: 'width 0.3s ease'
          }}>
          <div style={{ marginBottom: result ? '4rem' : '0' }}>
            {!result && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Plan Your Next Adventure</h2>}
            <form onSubmit={handleSubmit} style={styles.form}>
              
              {/* Origin */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaMapMarkerAlt size={14} color="var(--color-neon-blue)"/> From (Origin) <span style={{color:'var(--color-neon-blue)'}}>*</span>
                    </div>
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    name="origin" 
                    value={formData.origin} 
                    onChange={(e) => {
                      handleChange(e);
                      // Auto-capitalize first letter for cleaner look
                      if(e.target.value.length === 1) e.target.value = e.target.value.toUpperCase();
                      if (address) clearLocation();
                    }}
                    placeholder="e.g. Puducherry" 
                    style={{ ...styles.input, width: '100%', paddingRight: '80px' }} 
                  />
                  <button 
                    type="button"
                    onClick={requestLocation}
                    disabled={gpsLoading}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      color: 'var(--color-neon-blue)', // Plain text/icon color
                      border: 'none', // No border
                      padding: '4px',
                      cursor: gpsLoading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = 1}
                    onMouseLeave={(e) => e.target.style.opacity = 0.8}
                  >
                     {gpsLoading ? 'Detecting...' : <><FaRocket size={12}/> GPS</>}
                  </button>
                </div>
              </div>

              {/* Destination */}
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaMapMarkerAlt size={14} color="var(--color-neon-blue)"/> To (Destination) <span style={{color:'var(--color-neon-blue)'}}>*</span>
                    </div>
                </label>
                <input 
                    type="text" 
                    name="destination" 
                    value={formData.destination} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. Munnar" 
                    style={styles.input} 
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={styles.formGroup}>
                   <label style={styles.label}><FaCalendarAlt size={14} color="#94a3b8"/> Start Date <span style={{color:'var(--color-neon-blue)'}}>*</span></label>
                   <input 
                     type="date" 
                     name="startDate" 
                     value={formData.startDate} 
                     onChange={handleChange} 
                     required 
                     style={{ ...styles.input, colorScheme: 'dark' }} 
                   />
                </div>
                <div className="form-group" style={styles.formGroup}>
                   <label style={styles.label}><FaCalendarAlt size={14} color="#94a3b8"/> End Date <span style={{color:'var(--color-neon-blue)'}}>*</span></label>
                   <input 
                     type="date" 
                     name="endDate" 
                     value={formData.endDate} 
                     onChange={handleChange} 
                     required 
                     style={{ ...styles.input, colorScheme: 'dark' }} 
                   />
                </div>
              </div>

              {/* Budget & Travelers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                 <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}><FaWallet size={14} color="#94a3b8"/> Budget</label>
                  <div style={styles.selectWrapper}>
                    <select name="budget" value={formData.budget} onChange={handleChange} style={styles.select}>
                        <option value="cheap">Cheap</option>
                        <option value="moderate">Moderate</option>
                        <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}><FaUsers size={14} color="#94a3b8"/> Travelers</label>
                  <div style={styles.selectWrapper}>
                    <select name="travelers" value={formData.travelers} onChange={handleChange} style={styles.select}>
                        <option value="solo">Solo</option>
                        <option value="couple">Couple</option>
                        <option value="family">Family</option>
                        <option value="friends">Friends</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode & Engine */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}><FaCar size={14} color="#94a3b8"/> Mode</label>
                  <div style={styles.selectWrapper}>
                    <select name="travelMode" value={formData.travelMode || 'car'} onChange={handleChange} style={styles.select}>
                        <option value="car">Car</option>
                        <option value="motorcycle">Motorcycle</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}><FaBolt size={14} color="#94a3b8"/> Engine</label>
                  <div style={styles.selectWrapper}>
                    <select name="vehicleEngineType" value={formData.vehicleEngineType || 'combustion'} onChange={handleChange} style={styles.select}>
                        <option value="combustion">Combustion</option>
                        <option value="electric">Electric (EV)</option>
                    </select>
                   </div>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? '🤖 Planning...' : '🚀 Plan Trip'}
              </button>
            </form>
          </div>

          {result && (
            <div 
              className="custom-scrollbar"
              style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto', 
              padding: '8px 4px 16px 4px', 
              marginBottom: '1rem', // Added margin
              flexWrap: 'nowrap', 
              alignItems: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <button 
                onClick={() => setActiveDay(null)}
                className={`map-chip ${activeDay === null ? 'active' : ''}`}
                style={{ 
                   fontSize: '0.9rem', 
                   padding: '8px 16px', 
                   whiteSpace: 'nowrap',
                   flex: '0 0 auto', 
                   border: activeDay === null ? 'none' : '1.5px solid rgba(255,255,255,0.3)', 
                   borderRadius: '20px',
                   background: activeDay === null ? 'var(--color-neon-blue)' : 'transparent',
                   color: activeDay === null ? '#000' : '#fff',
                   fontWeight: activeDay === null ? '700' : '500',
                   cursor: 'pointer',
                   transition: 'all 0.2s ease'
                }}
              >
                All Days
              </button>
              {(result.itinerary || []).map((day) => (
                <button 
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`map-chip ${activeDay === day.dayNumber ? 'active' : ''}`}
                  style={{ 
                    fontSize: '0.9rem', 
                    padding: '8px 16px',
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto', 
                    border: activeDay === day.dayNumber ? 'none' : '1.5px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    background: activeDay === day.dayNumber ? 'var(--color-neon-blue)' : 'transparent',
                    color: activeDay === day.dayNumber ? '#000' : '#fff',
                    fontWeight: activeDay === day.dayNumber ? '700' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Day {day.dayNumber}
                </button>
              ))}
            </div>
          )}

          {result && (
            <ItineraryDisplay 
              itinerary={displayedItinerary} 
              weather={result.weather} 
              routeGeoJSON={result.routeGeoJSON}
              activeDay={activeDay}
              onDayClick={(dayNum) => setActiveDay(dayNum)}
              selectedActivityId={selectedActivityId}
              onActivitySelect={handleActivitySelect}
            />
          )}
        </div>

        {result && (
          <div className={`map-panel ${!showForm ? 'active' : 'hidden'}`} style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
             <div style={{ width: '100%', height: '100%' }}>
                {(() => {
                   const fullItinerary = result.itinerary || [];
                   const filteredItinerary = activeDay 
                     ? fullItinerary.filter(d => d.dayNumber === activeDay)
                     : fullItinerary;
                   const activitiesFiltered = filteredItinerary.flatMap(day => day.activities || []);
                   return (
                     <MapComponent 
                       activities={activitiesFiltered} 
                       routeGeoJSON={result.routeGeoJSON} 
                       isActive={!showForm} 
                       activeDay={activeDay}
                       selectedActivityId={selectedActivityId}
                       onMarkerClick={handleActivitySelect}
                     />
                   );
                })()}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '24px', // Consistent 24px grid
    background: 'rgba(15, 23, 42, 0.4)', 
    backdropFilter: 'blur(12px)',
    padding: '2rem', 
    paddingBottom: '3rem', 
    borderRadius: '24px', 
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    boxSizing: 'border-box'
  },
  formGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8px', // Slightly tight for label-input pairing
    width: '100%'
  },
  label: { 
    fontSize: '0.9rem', 
    fontWeight: '500', 
    color: '#cbd5e1', 
    marginLeft: '2px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    gap: '8px',
    letterSpacing: '0.02em'
  },
  input: { 
    background: 'rgba(2, 6, 23, 0.6)', // Slightly darker for contrast vs select
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '12px', 
    padding: '12px 16px', // Standard height
    color: '#e2e8f0', // High contrast text
    fontSize: '1rem', 
    outline: 'none',
    transition: 'all 0.2s',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  selectWrapper: {
    position: 'relative',
    width: '100%'
  },
  // Add chevron via CSS background or just rely on browser default properly styled
  select: { 
    background: 'rgba(2, 6, 23, 0.6)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '12px', 
    padding: '12px 16px', 
    color: '#e2e8f0', 
    fontSize: '0.95rem',
    outline: 'none', 
    cursor: 'pointer', 
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none', // Remove native arrow
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    backgroundSize: '1em'
  },
  button: { 
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    color: '#fff', 
    padding: '1rem', // Reduced height slightly
    borderRadius: '16px', 
    fontSize: '1.05rem', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: '1px', 
    cursor: 'pointer', 
    marginTop: '0.5rem', 
    boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)', // Reduced shadow
    border: 'none',
    transition: 'transform 0.2s',
    width: '100%'
  },
};

export default PlannerPage;
