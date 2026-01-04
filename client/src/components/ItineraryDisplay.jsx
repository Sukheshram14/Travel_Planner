/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /client/src/components/ItineraryDisplay.jsx
 * 
 * Purpose:
 * To turn the "ugly" JSON data into a beautiful "Timeline".
 * 
 * 2. CONCEPTS USED
 * ----------------
 * - **Mapping**: transforming an array of data (days) into an array of UI elements (cards).
 * - **Key Prop**: React needs a unique ID for every item in a list to render efficiently.
 * - **Conditional Styling**: Changing colors based on activity type (Food vs. Museum).
 * 
 * ==========================================================================================================================================================
 */

import React from 'react';
import { FaUtensils, FaCamera, FaBed, FaMapMarkerAlt } from 'react-icons/fa';
import MapComponent from './MapComponent';

// Helper: Choose icon based on activity type
const getIcon = (type) => {
  switch (type) {
    case 'food': return <FaUtensils color="var(--color-neon-blue)" />;
    case 'relax': return <FaBed color="var(--color-neon-teal)" />;
    default: return <FaCamera color="var(--color-neon-cyan)" />;
  }
};

const ItineraryDisplay = ({ itinerary, weather, routeGeoJSON, activeDay, onDayClick, selectedActivityId, onActivitySelect }) => {
  // [NEW] Auto-scroll to selected activity
  React.useEffect(() => {
    if (selectedActivityId) {
      const element = document.getElementById(`activity-${selectedActivityId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedActivityId]);

  if (!itinerary || !itinerary.length) return null;

  return (
    <div className="itinerary-timeline" style={{ marginTop: '2rem' }}>
      <h2 style={{ color: 'var(--color-neon-green)', marginBottom: '1rem', textAlign: 'center' }}>
        {itinerary.tripName || "Your Futuristic Plan 🚀"}
      </h2>

      {/* Weather & Advice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {itinerary.travelAdvice && (
          <div style={{ background: 'rgba(0, 174, 255, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-blue)' }}>
            <strong>🛫 Travel Advice:</strong> <br/> {itinerary.travelAdvice}
          </div>
        )}
        
        {weather && (
           <div style={{ background: 'rgba(0, 255, 82, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--color-green)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <img src={weather.icon} alt="Weather" style={{ width: '48px' }} />
             <div>
               <strong>Forecast:</strong> <br/> {weather.condition}, {weather.temp_c}°C
             </div>
           </div>
        )}
      </div>

      {/* Budget Estimation */}
      {itinerary.estimatedCosts && (
        <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ffd700', marginBottom: '1rem' }}>
          <strong style={{ color: '#ffd700' }}>💰 Estimated Budget (INR)</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <div>Accommodation: ₹{itinerary.estimatedCosts.accommodation || 0}</div>
            <div>Food: ₹{itinerary.estimatedCosts.food || 0}</div>
            <div>Activities: ₹{itinerary.estimatedCosts.activities || 0}</div>
            <div>Transport: ₹{itinerary.estimatedCosts.transport || 0}</div>
            <div style={{ fontWeight: 'bold', color: '#ffd700' }}>Total: ₹{itinerary.estimatedCosts.total || 0}</div>
          </div>
        </div>
      )}

      {/* Famous Attractions */}
      {itinerary.famousAttractions && itinerary.famousAttractions.length > 0 && (
        <div style={{ background: 'rgba(255, 0, 255, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ff00ff', marginBottom: '1rem' }}>
          <strong style={{ color: '#ff00ff' }}>🎭 Top Attractions</strong>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
            {itinerary.famousAttractions.slice(0, 5).map((attr, idx) => (
              <div key={idx} style={{ fontSize: '0.9rem' }}>
                <strong>{idx + 1}. {attr.name}</strong>
                <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)' }}>{attr.description}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#ff00ff' }}>
                  ⏰ {attr.bestTime} • ✨ {attr.specialty}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loop through Days */}
      {itinerary.map((day) => {
        // Find the route feature for this day
        const dayRoute = routeGeoJSON?.features?.find(f => f.properties.day === day.dayNumber);
        const legs = dayRoute?.geometry?.metadata?.legs || [];

        return (
          <div key={day.dayNumber} className="day-container" style={styles.dayContainer}>
            
            {/* Day Header */}
            <div 
              style={{
                ...styles.dayHeader,
                cursor: 'pointer',
                opacity: activeDay && activeDay !== day.dayNumber ? 0.6 : 1,
                borderBottom: activeDay === day.dayNumber ? '2px solid var(--color-neon-blue)' : 'none'
              }}
              onClick={() => onDayClick?.(day.dayNumber)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <h3 style={{ margin: 0 }}>Day {day.dayNumber}</h3>
                <span style={styles.optimizedBadge}>
                  ✨ Optimized
                </span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
                {day.theme}
              </span>
            </div>

            {/* Activities List */}
            <div className="activities-list" style={styles.grid}>
              {day.activities.map((activity, index) => {
                const isSelected = selectedActivityId === activity.name;
                return (
                  <React.Fragment key={index}>
                    <div 
                      id={`activity-${activity.name}`} // ID for scrolling
                      className="card" 
                      style={{
                        ...styles.activityCard,
                        border: isSelected ? '2px solid var(--color-neon-blue)' : styles.activityCard.border,
                        background: isSelected ? 'rgba(0, 247, 255, 0.05)' : styles.activityCard.background,
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => onActivitySelect?.(activity.name)}
                    >
                      <div style={styles.iconWrapper}>
                        {getIcon(activity.type)}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={styles.timeSlot}>{activity.timeSlot}</div>
                        <h4 style={styles.activityName}>{activity.name}</h4>
                        <p style={styles.description}>{activity.description}</p>
                        
                        {/* Enhanced Google Maps Navigation */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {activity.location?.lat && activity.location?.lng ? (
                            <button
                            onClick={() => {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${activity.location.lat},${activity.location.lng}&destination_place_id=${encodeURIComponent(activity.name)}`;
                              window.open(url, '_blank');
                            }}
                            style={styles.navigateBtn}
                          >
                            📍 Navigate
                          </button>
                        ) : (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.searchQuery || activity.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.mapLink}
                          >
                            <FaMapMarkerAlt /> View on Map
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🚗 Travel Indicator */}
                  {index < day.activities.length - 1 && legs[index] && (
                    <div style={styles.travelTimeIndicator}>
                      <div style={styles.travelLine}></div>
                      <span style={styles.travelLabel}>
                        ⚡ {Math.ceil(legs[index].duration / 60)} min
                      </span>
                      <div style={styles.travelLine}></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            </div>

            {/* Accommodation Booking Links */}
            <div style={styles.bookingSection}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#00f7ff' }}>
                🏨 Book Accommodation
              </h4>
              <div style={styles.bookingButtons}>
                <button
                  onClick={() => {
                    const checkIn = new Date(day.date || Date.now()).toISOString().split('T')[0];
                    const checkOut = new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0];
                    const destination = encodeURIComponent(itinerary[0]?.activities?.[0]?.location?.address || 'destination');
                    window.open(`https://www.booking.com/searchresults.html?ss=${destination}&checkin=${checkIn}&checkout=${checkOut}`, '_blank');
                  }}
                  style={styles.bookingBtn}
                >
                  Booking.com
                </button>
                <button
                  onClick={() => {
                    const checkIn = new Date(day.date || Date.now()).toISOString().split('T')[0];
                    const checkOut = new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0];
                    window.open(`https://www.makemytrip.com/hotels/`, '_blank');
                  }}
                  style={styles.bookingBtn}
                >
                  MakeMyTrip
                </button>
                <button
                  onClick={() => {
                    window.open(`https://www.goibibo.com/hotels/`, '_blank');
                  }}
                  style={styles.bookingBtn}
                >
                  Goibibo
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  dayContainer: {
    marginBottom: '3rem',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  dayHeader: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  activityCard: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'flex-start',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease',
  },
  iconWrapper: {
    background: 'rgba(0, 247, 255, 0.1)',
    minWidth: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  timeSlot: {
    fontSize: '0.8rem',
    color: 'var(--color-neon-blue)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '0.4rem',
  },
  activityName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#fff',
  },
  description: {
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.6',
    marginBottom: '1rem',
  },
  navigateBtn: {
    background: 'rgba(0, 247, 255, 0.1)',
    color: '#00f7ff',
    border: '1px solid rgba(0, 247, 255, 0.3)',
    padding: '0.6rem 1.2rem',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  travelTimeIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '0.5rem 0',
    paddingLeft: '3rem',
  },
  travelLine: {
    width: '2px',
    height: '20px',
    background: 'linear-gradient(to bottom, var(--color-neon-blue), transparent)',
  },
  travelLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  bookingSection: {
    marginTop: '2rem',
    padding: '1.5rem',
    background: 'rgba(0, 247, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 247, 255, 0.1)',
  },
  bookingButtons: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
  },
  bookingBtn: {
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  optimizedBadge: {
    background: 'linear-gradient(90deg, rgba(0, 247, 255, 0.2), rgba(0, 150, 255, 0.2))',
    color: '#00f7ff',
    fontSize: '0.7rem',
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    border: '1px solid rgba(0, 247, 255, 0.3)',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: 'fit-content',
  },
};

export default ItineraryDisplay;
