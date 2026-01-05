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
import { createTrip, getTrip, getMyTrips, updateTripStatus, toggleActivityStatus, validateTrip } from '../services/api';
import ItineraryDisplay from '../components/ItineraryDisplay';
import MapComponent from '../components/MapComponent';
import LayerToggle from '../components/LayerToggle'; // [NEW]
import TripProgress from '../components/TripProgress'; // [NEW]
import TripStats from '../components/TripStats'; // [NEW]
import { useGeolocation } from '../hooks/useGeolocation';
import { FaMapMarkerAlt, FaCalendarAlt, FaWallet, FaUsers, FaCar, FaBolt, FaRocket } from 'react-icons/fa';

const PlannerPage = () => {
  // 1. State Management
  const [formData, setFormData] = useState({
    origin: '', 
    destination: '',
    startDate: '',
    endDate: '',
    budget: '', // Changed to empty string for numeric input
    travelers: 'solo',
    interests: '',
    travelMode: 'car',
    vehicleEngineType: 'combustion'
  });

  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState(null); // Replaced 'result'
  const [weather, setWeather] = useState(null); // NEW
  const [routeGeoJSON, setRouteGeoJSON] = useState(null); // NEW
  const [theme, setTheme] = useState('dark');
  const [formVisible, setFormVisible] = useState(true); // Replaced 'showForm'
  const [activeDay, setActiveDay] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null); // For sync
  const [error, setError] = useState(null); // NEW
  const [validationResult, setValidationResult] = useState(null); // [NEW] For feasibility check
  const [isValidating, setIsValidating] = useState(false); // [NEW] Loading state for validation
  const [discoveredHotels, setDiscoveredHotels] = useState([]); // [NEW] For map markers
  const [selectedHotelId, setSelectedHotelId] = useState(null); // [NEW] For sync
  
  // [FIX] Mobile View State (Map vs List)
  const [showMapMobile, setShowMapMobile] = useState(false); // Default to List View

  const handleMarkerClick = (id) => { // Renamed from handleActivitySelect
    setSelectedActivityId(id);
  };
  
  const { address, accuracy, loading: gpsLoading, error: gpsError, requestLocation, clearLocation } = useGeolocation();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('tripId');
    if (tripId) {
      loadTripFromId(tripId);
      setFormVisible(false); // Hide form if tripId is present
    }
  }, []);

  const loadTripFromId = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTrip(id);
      if (data && data.status === 'success') {
         const tripData = data.data.trip;
         setFormData(prev => ({
            ...prev,
            origin: tripData.origin || '',
            destination: tripData.destination || '',
            startDate: tripData.startDate ? tripData.startDate.split('T')[0] : '',
            endDate: tripData.endDate ? tripData.endDate.split('T')[0] : '',
            budget: tripData.budget || 'moderate',
            travelers: tripData.travelers || 'solo'
         }));
         setTrip(data.data.trip);
         setWeather(data.data.weather);
         setRouteGeoJSON(data.data.routeGeoJSON);
         setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load trip", error);
      setError("Failed to load the trip plan.");
      setLoading(false);
    }
  };

  // [NEW] Handle Status Updates
  const handleStatusUpdate = async (newStatus) => {
      try {
          if (!trip?._id) return;
          const updated = await updateTripStatus(trip._id, newStatus);
          setTrip(prev => ({ ...prev, status: updated.data.status }));
      } catch (err) {
          console.error("Status Update Failed", err);
          alert("Failed to update trip status.");
      }
  };

  // [NEW] Handle Activity Toggle
  const handleActivityToggle = async (activityId, isCompleted) => {
      try {
          if (!trip?._id) return;
          // Optimistic UI Update
          setTrip(prev => {
              const newCompleted = isCompleted 
                  ? [...(prev.completedActivities || []), activityId]
                  : (prev.completedActivities || []).filter(id => id !== activityId);
              return { ...prev, completedActivities: newCompleted };
          });

          await toggleActivityStatus(trip._id, activityId, isCompleted);
      } catch (err) {
          console.error("Activity Toggle Failed", err);
          // Revert on failure (could improve this)
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

  const handleSubmit = async (e, forceProceed = false, dataOverride = null) => {
    if (e) e.preventDefault();
    setError(null);
    const dataToUse = dataOverride || formData;

    // Step 1: Validation (Skip if already validated or forceProceed)
    if (!validationResult?.isPossible && !forceProceed) {
        setIsValidating(true);
        console.log("🔍 [UI] Starting AI Feasibility Check...");
        try {
            const resp = await validateTrip(dataToUse);
            if (resp.status === 'success') {
                const result = resp.data;
                console.log("📊 [UI] Feasibility Result:", result);
                setValidationResult(result);
                
                // If AI says it's possible, move to Phase 2 immediately
                if (result.isPossible) {
                    await handleGenerateTrip(dataToUse);
                }
            }
        } catch (err) {
            console.error("Validation failed", err);
            setError("Could not validate trip feasibility.");
        } finally {
            setIsValidating(false);
        }
        return;
    }

    // Step 2: Generation
    await handleGenerateTrip(dataToUse);
  };

  const handleGenerateTrip = async (dataOverride = null) => {
    const dataToUse = dataOverride || formData;
    setLoading(true);
    setError(null);
    try {
      const response = await createTrip(dataToUse);
      if (response && response.status === 'success') {
        const tripData = response.data.trip;
        if (tripData._id) {
            const newUrl = `${window.location.pathname}?tripId=${tripData._id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
        }
        setTrip(tripData);
        setWeather(response.data.weather);
        setRouteGeoJSON(response.data.routeGeoJSON);
        setFormVisible(false); // Hide form and show results
        setShowMapMobile(false); // [FIX] Default to List View on mobile when new trip generates
        setValidationResult(null); // Reset for next time
      }
    } catch (err) {
      console.error("Trip creation failed:", err);
      if (err.response?.status === 401) {
        alert("Please sign in to save trips. Redirecting to login...");
        window.location.href = '/login';
      } else {
        setError("Failed to plan trip. Please check if the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  // [FIX] Filter Itinerary for Display based on Active Day
  const displayedItinerary = activeDay 
    ? (trip?.itinerary || []).filter(d => d.dayNumber === activeDay)
    : (trip?.itinerary || []);

  const handleDayClick = (dayNum) => {
    setActiveDay(dayNum);
  };

  // [FIX] Determine visibility classes
  // Sidebar (Form/List) is active if: Form is Visible OR (Not in Map Mode)
  const isSidebarActive = formVisible || !showMapMobile;
  // Map is active if: Not in Form Mode AND In Map Mode
  const isMapActive = !formVisible && showMapMobile;

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
      {trip && (
        <button 
            onClick={() => {
                if (formVisible) {
                    setFormVisible(false); // Close form, return to result view
                } else {
                    setShowMapMobile(!showMapMobile); // Toggle Map/List
                }
            }} 
            className="mobile-toggle"
        >
          {formVisible ? '❎ Close Form' : (showMapMobile ? '📝 View Plan' : '🗺️ View Map')}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div className={`sidebar ${isSidebarActive ? 'active' : 'hidden'}`} style={{ 
            width: trip ? '450px' : '100%',
            maxWidth: trip ? '450px' : '800px',
            margin: trip ? '0' : '0 auto',
            overflowY: 'auto', 
            padding: '2rem',
            borderRight: '1px solid var(--color-border)',
            transition: 'width 0.3s ease'
          }}>
          <div style={{ marginBottom: trip ? '4rem' : '0' }}>
            {!trip && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Plan Your Next Adventure</h2>}
            {formVisible && ( // Conditionally render form
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
                    <label style={styles.label}><FaWallet size={14} color="#94a3b8"/> Budget (Total INR)</label>
                    <input 
                      type="number" 
                      name="budget" 
                      value={formData.budget} 
                      onChange={handleChange} 
                      placeholder="e.g. 50000"
                      min="1000"
                      step="1000"
                      required
                      style={styles.input} 
                    />
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

                <button 
                  type="submit" 
                  disabled={loading || isValidating} 
                  style={{...styles.button, opacity: (loading || isValidating) ? 0.7 : 1}}
                >
                  {isValidating ? '🔍 Checking Feasibility...' : (loading ? '🤖 Planning...' : '🚀 Plan Trip')}
                </button>
              </form>
            )}

            {/* [NEW] Feasibility Advice UI */}
            {validationResult && !validationResult.isPossible && !trip && (
              <div style={styles.adviceCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🤔</span>
                  <strong style={{ color: '#ffcc00' }}>AI Travel Advice</strong>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '1.2rem' }}>
                  {validationResult.advice}
                </p>
                
                {validationResult.recommendedBudget && (
                  <div style={{ background: 'rgba(0, 247, 255, 0.1)', border: '1px dashed var(--color-neon-blue)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-neon-blue)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>Recommended Budget</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{validationResult.recommendedBudget.toLocaleString()}</div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {validationResult.recommendedBudget && (
                    <button 
                       onClick={() => {
                          const updatedData = { ...formData, budget: validationResult.recommendedBudget };
                          setFormData(updatedData);
                          handleSubmit(null, true, updatedData);
                       }} 
                       style={{ ...styles.button, flex: 1, padding: '0.8rem', fontSize: '0.9rem' }}
                    >
                      Apply & Plan
                    </button>
                  )}
                  <button 
                    onClick={() => handleSubmit(null, true)} 
                    style={{ ...styles.outlineButton, flex: 1 }}
                  >
                    Plan Anyway
                  </button>
                  <button 
                    onClick={() => setValidationResult(null)} 
                    style={{ ...styles.outlineButton, borderColor: 'var(--color-neon-blue)', color: 'var(--color-neon-blue)', flex: 1 }}
                  >
                    Adjust Manual
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. TRIP VIEW (Results) */}
          {!loading && !formVisible && trip && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <button 
                    onClick={() => {
                        // Clear URL params to "reset" state cleanly if they want to plan new
                        window.history.pushState({}, '', '/plan');
                        setFormVisible(true);
                        setTrip(null);
                    }}
                    style={styles.backButton}
                  >
                    ← Plan Another Trip
                  </button>

                  <h2 style={{ margin: 0, color: '#00f7ff' }}>
                    {trip.destination} 
                    <span style={{ fontSize: '0.6em', color: '#fff', marginLeft: '10px' }}>
                        ({trip.days?.length || trip.itinerary?.length} Days)
                    </span>
                  </h2>
              </div>

              {/* [NEW] Progress & Stats */}
              <TripProgress trip={trip} onStatusUpdate={handleStatusUpdate} />
              
              {trip.status === 'completed' && <TripStats trip={trip} />}

              <div className="trip-layout" style={styles.tripLayout}>
                {/* Left: Itinerary Timeline */}
                <div className="itinerary-panel" style={styles.itineraryPanel}>
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
                    {(trip.itinerary || []).map((day) => (
                      <button 
                        key={day.dayNumber}
                        onClick={() => handleDayClick(day.dayNumber)}
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
                  <ItineraryDisplay 
                    itinerary={displayedItinerary} 
                    weather={weather}
                    routeGeoJSON={routeGeoJSON}
                    activeDay={activeDay}
                    onDayClick={handleDayClick}
                    selectedActivityId={selectedActivityId}
                    onActivitySelect={handleMarkerClick}
                    // [NEW] Props for tracking
                    tripStatus={trip.status}
                    completedActivities={trip.completedActivities || []}
                    onActivityToggle={handleActivityToggle}
                    // [NEW] Props for AI Agent & Budget
                    destination={trip.destination}
                    estimatedCosts={trip.estimatedCosts}
                    tripId={trip._id}
                    days={trip.days || trip.itinerary?.length || 3}
                    hotelBookings={trip.hotelBookings || []}
                    onHotelsLoaded={setDiscoveredHotels}
                    onBookingConfirmed={() => loadTripFromId(trip._id)}
                    selectedHotelId={selectedHotelId} // [NEW]
                    onHotelSelect={setSelectedHotelId} // [NEW]
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {trip && (
          <div className={`map-panel ${!formVisible && showMapMobile ? 'active' : 'hidden'}`} style={{ flex: 1, position: 'relative', minWidth: '300px' }}>
             <div style={{ width: '100%', height: '100%' }}>
                {(() => {
                   const fullItinerary = trip.itinerary || [];
                   const filteredItinerary = activeDay 
                     ? fullItinerary.filter(d => d.dayNumber === activeDay)
                     : fullItinerary;
                   const activitiesFiltered = filteredItinerary.flatMap(day => day.activities || []);
                   const allActivities = fullItinerary.flatMap(day => day.activities || []);
                   return (
                     <MapComponent 
                       activities={activitiesFiltered} 
                       fullActivities={allActivities} // [NEW] For global POI search
                       routeGeoJSON={routeGeoJSON} 
                       isActive={!formVisible} 
                       activeDay={activeDay}
                       selectedActivityId={selectedActivityId}
                       onMarkerClick={handleMarkerClick}
                       tripStatus={trip.status}
                       hotels={discoveredHotels}
                       bookedHotels={trip.hotelBookings || []} // [NEW] Confirmed bookings
                       selectedHotelId={selectedHotelId}
                       onHotelSelect={setSelectedHotelId}
                       destination={trip.destination} 
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
  backButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--color-neon-blue)',
    padding: '0.6rem 1.2rem',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  adviceCard: {
    background: 'rgba(255, 204, 0, 0.1)',
    border: '1px solid rgba(255, 204, 0, 0.3)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginTop: '1.5rem',
    animation: 'fadeSlideUp 0.3s ease-out'
  },
  outlineButton: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default PlannerPage;
