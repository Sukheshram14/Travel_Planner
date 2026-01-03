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
 * 2. CONCEPTS USED
 * ----------------
 * - **useState**: React Hook to track form inputs.
 * - **Async/Await**: Waiting for the API to reply.
 * - **Conditional Rendering**: Showing "Loading..." vs "The Form".
 * 
 * ==========================================================================================================================================================
 */

import React, { useState } from 'react';
import { createTrip } from '../services/api';
import ItineraryDisplay from '../components/ItineraryDisplay';
import MapComponent from '../components/MapComponent'; // <--- Import for Right Panel
// import './PlannerPage.css'; 

const PlannerPage = () => {
  // 1. State Management (The "Memory" of this component)
  const [formData, setFormData] = useState({
    origin: '', // [NEW] From where?
    destination: '',
    startDate: '',
    endDate: '',
    budget: 'moderate',
    travelers: 'solo',
    interests: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // Will store the AI itinerary later
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  // 2. Event Handlers
  const handleChange = (e) => {
    // Teach: [e.target.name] is a "computed property name".
    // It updates ONLY the field that changed.
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop page refresh
    setLoading(true);

    try {
      console.log("Sending to AI...", formData);
      const response = await createTrip(formData);
      setLoading(false);

      if (response && response.status === 'success') {
        // 🌟 FIX: We now receive { trip, weather }
        // We merge them into one 'result' object for the Display Component
        const resultData = {
           ...response.data.trip, 
           weather: response.data.weather 
        };
        setResult(resultData);
      }
    } catch (err) {
      alert("Failed to plan trip. Is the Backend running?");
    } finally {
      setLoading(false);
    }
  };

  // 3. Render (The UI)
  return (
    <div className="planner-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 🚀 Header */}
      <header style={{ 
        padding: '1rem 2rem', 
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-bg)',
        zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Travel<span style={{ color: '#fff' }}>AI</span>
        </h1>
        <button onClick={toggleTheme} className="theme-toggle" style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '0.5rem 1rem', borderRadius: '20px', cursor: 'pointer' }}>
          {theme === 'dark' ? '☀️ Day Mode' : '🌙 Night Mode'}
        </button>
      </header>

      {/* 🗺️ Main Content: Split Screen */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ⬅️ Left Panel: Form & Itinerary (Scrollable) */}
        <div className="sidebar" style={{ 
          width: result ? '450px' : '100%', // Full width if no result yet
          maxWidth: result ? '450px' : '800px', // Center form if no result
          margin: result ? '0' : '0 auto', // Center form if no result
          overflowY: 'auto', 
          padding: '2rem',
          borderRight: '1px solid var(--color-border)',
          transition: 'width 0.3s ease'
        }}>
          
          {/* Form Section */}
          <div style={{ marginBottom: result ? '2rem' : '0' }}>
            {!result && <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Plan Your Next Adventure</h2>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>📍 From (Origin)</label>
                <input 
                  type="text" 
                  name="origin" 
                  value={formData.origin} 
                  onChange={handleChange} 
                  placeholder="e.g. Puducherry" 
                  style={styles.input}
                />
              </div>

              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>📍 To (Destination)</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={styles.formGroup}>
                   <label style={styles.label}>📅 Start</label>
                   <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required style={styles.input} />
                </div>
                <div className="form-group" style={styles.formGroup}>
                   <label style={styles.label}>🏁 End</label>
                   <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required style={styles.input} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>💰 Budget</label>
                  <select name="budget" value={formData.budget} onChange={handleChange} style={styles.select}>
                    <option value="cheap">Cheap (Backpacker)</option>
                    <option value="moderate">Moderate</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>👥 Travelers</label>
                  <select name="travelers" value={formData.travelers} onChange={handleChange} style={styles.select}>
                    <option value="solo">Solo</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? '🤖 Planning...' : '🚀 Plan My Trip'}
              </button>
            </form>
          </div>

          {/* Itinerary Result */}
          {result && (
            <ItineraryDisplay 
              itinerary={result.itinerary || result} // handle both structures just in case
              weather={result.weather} 
            />
          )}
        </div>

        {/* ➡️ Right Panel: The Map (Only shows when we have a Result) */}
        {result && (
          <div className="map-panel" style={{ flex: 1, position: 'relative' }}>
             <div style={{ width: '100%', height: '100%' }}>
                {(() => {
                   const activities = (result.itinerary || result).flatMap(day => day.activities);
                   const route = (result.itinerary || result).route || result.route;
                   return <MapComponent activities={activities} routeGeoJSON={route} />;
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
    gap: '1rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.5rem',
    color: 'var(--color-neon-blue)',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  input: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
  },
  select: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    width: '100%'
  },
  button: {
    marginTop: '1rem',
    padding: '1rem',
    background: 'linear-gradient(90deg, var(--color-neon-blue), var(--color-neon-cyan))',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  }
};

export default PlannerPage;
