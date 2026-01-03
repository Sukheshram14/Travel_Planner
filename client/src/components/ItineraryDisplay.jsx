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

      {/* Pro Sections: Stay & Famous Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {itinerary.suggestedStay && (
          <div style={{ background: 'rgba(255, 128, 0, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 128, 0, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FaBed color="#ff8000" /> <strong style={{color: '#ff8000'}}>Recommended Stay:</strong>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{itinerary.suggestedStay}</span>
            <br/>
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(itinerary.suggestedStay + " " + (itinerary.destination || ""))}`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '0.8rem', color: '#ff8000', textDecoration: 'none', borderBottom: '1px dashed #ff8000', marginTop: '5px', display: 'inline-block' }}
            >
              Check Availability ↗
            </a>
          </div>
        )}
        
        {itinerary.famousThings && itinerary.famousThings.length > 0 && (
          <div style={{ background: 'rgba(255, 235, 59, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 235, 59, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FaCamera color="#fdd835" /> <strong style={{color: '#fdd835'}}>Local Specialties:</strong>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {itinerary.famousThings.map((thing, i) => (
                <span key={i} style={{ background: 'rgba(255, 235, 59, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem', color: '#fff' }}>
                   {thing}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Moved to Parent for Split-Screen Layout */}

      {/* Loop through Days */}
      {(itinerary.days || itinerary.itinerary || itinerary).map((day) => (
        <div key={day.dayNumber} className="day-container" style={styles.dayContainer}>
          
          {/* Day Header */}
          <div style={styles.dayHeader}>
            <h3 style={{ margin: 0, color: 'var(--color-neon-blue)' }}>Day {day.dayNumber}</h3>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: '500' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.timeSlot}>{activity.timeSlot}</div>
                    {activity.estimatedCostINR !== undefined && (
                      <div style={{ fontSize: '0.85rem', color: '#4caf50', fontWeight: 'bold' }}>
                        Est: ₹{activity.estimatedCostINR}
                      </div>
                    )}
                  </div>
                  
                  <h4 style={styles.activityName}>{activity.name}</h4>
                  <p style={styles.description}>{activity.description}</p>
                  
                  {/* Google Maps Link */}
                  <a 
                    href={activity.location?.gMapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.searchQuery || activity.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.mapLink}
                  >
                    <FaMapMarkerAlt /> Open in G-Maps
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
