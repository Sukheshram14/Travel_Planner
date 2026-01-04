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

import React, { useRef } from 'react';
import { FaUtensils, FaCamera, FaBed, FaMapMarkerAlt, FaCheckCircle, FaRegCircle, FaFilePdf } from 'react-icons/fa';
import MapComponent from './MapComponent';
import BookingAgent from './BookingAgent'; // [NEW] AI Agent integration

// Helper: Choose icon based on activity type
const getIcon = (type) => {
  switch (type) {
    case 'food': return <FaUtensils color="var(--color-neon-blue)" />;
    case 'relax': return <FaBed color="var(--color-neon-teal)" />;
    default: return <FaCamera color="var(--color-neon-cyan)" />;
  }
};

const ItineraryDisplay = ({ 
  itinerary, 
  weather, 
  routeGeoJSON, 
  activeDay, 
  onDayClick, 
  selectedActivityId, 
  onActivitySelect,
  tripStatus, // [NEW]
  completedActivities = [], // [NEW]
  onActivityToggle, // [NEW]
  // [NEW] Explicit props from Trip object
  destination,
  estimatedCosts,
  tripId, // [NEW] For hotel booking
  days, // [NEW] Trip duration
  hotelBookings = [], // [NEW] Existing bookings
  onHotelsLoaded, // [NEW] Callback for map markers
  onBookingConfirmed, // [NEW] Callback for booking sync
  selectedHotelId, // [NEW] For sync
  onHotelSelect // [NEW] For sync
}) => {
  const pdfRef = useRef(null); // [NEW] for PDF export
  const scrollRef = useRef(null); // [NEW]
  // [NEW] Auto-scroll to selected activity
  React.useEffect(() => {
    if (selectedActivityId) {
      const element = document.getElementById(`activity-${selectedActivityId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedActivityId]);

  const handleDownloadPDF = () => {
    const element = pdfRef.current;
    if (!element) return;

    const opt = {
      margin: [10, 10],
      filename: `${itinerary.tripName || 'Travel_Itinerary'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0F172A' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf global from index.html script
    if (window.html2pdf) {
      window.html2pdf().from(element).set(opt).save();
    } else {
      alert("PDF library still loading, please try again in a second.");
    }
  };

  if (!itinerary || !itinerary.length) return null;

  return (
    <div ref={pdfRef} className="itinerary-timeline" style={{ marginTop: '2rem', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--color-neon-green)', margin: 0 }}>
          {itinerary.tripName || "Your Futuristic Plan 🚀"}
        </h2>
        <button 
          onClick={handleDownloadPDF}
          style={styles.pdfBtn}
          title="Download as PDF for offline use"
        >
          <FaFilePdf /> PDF
        </button>
      </div>

      {hotelBookings && hotelBookings.length > 0 && (
        <div style={{ 
          background: 'rgba(0, 247, 255, 0.1)', 
          padding: '1rem', 
          borderRadius: '8px', 
          borderLeft: '4px solid #00f7ff', 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong style={{ color: '#00f7ff' }}>🏨 Hotel Reserved</strong>
            <div style={{ fontSize: '1.1rem', marginTop: '4px' }}>{hotelBookings[0].hotelDetails.name}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{hotelBookings[0].hotelDetails.address}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{hotelBookings[0].totalCost}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{hotelBookings[0].numberOfNights} nights</div>
          </div>
        </div>
      )}

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
      {estimatedCosts && (
          <div style={{ background: 'rgba(255, 215, 0, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ffd700', marginBottom: '1rem' }}>
            <strong style={{ color: '#ffd700' }}>💰 Estimated Budget (INR)</strong>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <div>Accommodation: ₹{estimatedCosts.accommodation || 0}</div>
              <div>Food: ₹{estimatedCosts.food || 0}</div>
              <div>Activities: ₹{estimatedCosts.activities || 0}</div>
              <div>Transport: ₹{estimatedCosts.transport || 0}</div>
              <div style={{ fontWeight: 'bold', color: '#ffd700' }}>Total: ₹{estimatedCosts.total || 0}</div>
            </div>
          </div>
      )}
      
      {/* AI Booking Agent Section */}
      <BookingAgent 
        destination={destination || "your destination"} 
        budget={estimatedCosts?.accommodation || 5000} 
        tripId={tripId}
        days={days || 3}
        existingBookings={hotelBookings}
        onHotelsLoaded={onHotelsLoaded}
        onBookingConfirmed={onBookingConfirmed}
        selectedHotelId={selectedHotelId} // [NEW]
        onHotelSelect={onHotelSelect} // [NEW]
      />

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

                        {/* [NEW] Checkbox for Active Trips */}
                        {tripStatus === 'in-progress' && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onActivityToggle(activity.id || activity.name, !completedActivities.includes(activity.id || activity.name));
                                }}
                                style={{
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: completedActivities.includes(activity.id || activity.name) ? '#4ade80' : '#475569',
                                    fontSize: '1.2rem',
                                    transition: 'all 0.2s',
                                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                                    paddingLeft: '1rem',
                                    marginLeft: '0.5rem'
                                }}
                                title={completedActivities.includes(activity.id || activity.name) ? "Mark as not visited" : "Mark as visited"}
                            >
                                {completedActivities.includes(activity.id || activity.name) ? <FaCheckCircle /> : <FaRegCircle />}
                            </div>
                        )}
                        
                        {/* Only show "Completed" badge if trip is completed or history */}
                        {(tripStatus === 'completed' || tripStatus === 'history') && completedActivities.includes(activity.id || activity.name) && (
                             <div style={{ color: '#4ade80', fontSize: '1.2rem', padding: '0.5rem' }} title="Visited">
                                <FaCheckCircle />
                             </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{ 
                        marginTop: '0.8rem', 
                        paddingTop: '0.8rem', 
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-start'
                      }}></div>
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
  pdfBtn: {
    background: 'rgba(255, 50, 50, 0.1)',
    color: '#ff4d4d',
    border: '1px solid rgba(255, 50, 50, 0.3)',
    padding: '0.6rem 1.2rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)'
  }
};

export default ItineraryDisplay;
