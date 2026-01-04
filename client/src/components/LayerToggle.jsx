import React from 'react';
import { FaLayerGroup, FaCar, FaGlobeAmericas, FaMap } from 'react-icons/fa';

const LayerToggle = ({ mapStyle, setMapStyle, showTraffic, setShowTraffic }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem', // Below NavigationControl (which is usually top-right)
      marginTop: '40px', // Offset for standard NavControl
      background: 'rgba(0,0,0,0.8)',
      borderRadius: '8px',
      padding: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 10
    }}>
      
      {/* 🌍 Style Switcher */}
      <button 
        onClick={() => setMapStyle(prev => prev === 'dark' ? 'satellite' : 'dark')}
        title="Toggle Satellite View"
        style={{
          background: mapStyle === 'satellite' ? 'var(--color-neon-blue)' : 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {mapStyle === 'dark' ? <FaGlobeAmericas size={20} /> : <FaMap size={20} />}
      </button>

      {/* 🚦 Traffic Toggle */}
      <button 
        onClick={() => setShowTraffic(!showTraffic)}
        title="Toggle Live Traffic"
        style={{
          background: showTraffic ? '#ff4d4d' : 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <FaCar size={20} />
      </button>

    </div>
  );
};

export default LayerToggle;
