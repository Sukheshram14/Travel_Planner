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

const ItineraryDisplay = ({ itinerary, weather }) => {
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

      {/* Map Moved to Parent for Split-Screen Layout */}

      {/* Loop through Days */}
      {itinerary.map((day) => (
        <div key={day.dayNumber} className="day-container" style={styles.dayContainer}>
          
          {/* Day Header */}
          <div style={styles.dayHeader}>
            <h3 style={{ margin: 0 }}>Day {day.dayNumber}</h3>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {day.theme}
            </span>
          </div>

          {/* Activities List */}
          <div className="activities-list" style={styles.grid}>
            {day.activities.map((activity, index) => (
              <div key={index} className="card" style={styles.activityCard}>
                <div style={styles.iconWrapper}>
                  {getIcon(activity.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={styles.timeSlot}>{activity.timeSlot}</div>
                  <h4 style={styles.activityName}>{activity.name}</h4>
                  <p style={styles.description}>{activity.description}</p>
                  
                  {/* Google Maps Link */}
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.searchQuery || activity.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.mapLink}
                  >
                    <FaMapMarkerAlt /> View on Map
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
};

const styles = {
  dayContainer: {
    marginBottom: '2rem',
    borderLeft: '4px solid var(--color-neon-blue)',
    paddingLeft: '1.5rem',
    position: 'relative',
  },
  dayHeader: {
    marginBottom: '1rem',
  },
  grid: {
    display: 'grid',
    gap: '1rem',
  },
  activityCard: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
    transition: 'transform 0.2s',
  },
  iconWrapper: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '0.8rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlot: {
    fontSize: '0.85rem',
    color: 'var(--color-neon-teal)',
    fontWeight: 'bold',
    marginBottom: '0.2rem',
  },
  activityName: {
    fontSize: '1.1rem',
    marginBottom: '0.3rem',
    color: '#fff',
  },
  description: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
    marginBottom: '0.5rem',
  },
  mapLink: {
    fontSize: '0.85rem',
    color: 'var(--color-neon-blue)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
  }
};

export default ItineraryDisplay;
