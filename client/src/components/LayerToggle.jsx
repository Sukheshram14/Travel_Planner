import { FaLayerGroup, FaCar, FaGlobeAmericas, FaMap, FaGasPump, FaSun, FaMoon } from 'react-icons/fa';

const LayerToggle = ({ mapStyle, setMapStyle, showTraffic, setShowTraffic, showFuel, setShowFuel }) => {
  
  const cycleStyle = () => {
    if (mapStyle === 'dark') setMapStyle('light');
    else if (mapStyle === 'light') setMapStyle('satellite');
    else setMapStyle('dark');
  };

  return (
    <div style={{
      background: 'rgba(10,10,10,0.9)',
      borderRadius: '12px',
      padding: '0.6rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem',
      zIndex: 10,
      border: '1px solid #333',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
    }}>
      
      {/* 🌍 Style Switcher (Dark -> Light -> Satellite) */}
      <button 
        onClick={cycleStyle}
        title="Cycle Map Style"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.background = '#222'}
        onMouseLeave={(e) => e.target.style.background = 'transparent'}
      >
        {mapStyle === 'dark' ? <FaMoon size={18} color="#00f7ff" /> : 
         mapStyle === 'light' ? <FaSun size={18} color="#ffeb3b" /> : 
         <FaGlobeAmericas size={18} color="#4caf50" />}
      </button>

      {/* 🚦 Traffic Toggle */}
      <button 
        onClick={() => setShowTraffic(!showTraffic)}
        title="Toggle Live Traffic"
        style={{
          background: showTraffic ? 'rgba(255, 77, 77, 0.2)' : 'transparent',
          border: 'none',
          color: showTraffic ? '#ff4d4d' : '#fff',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FaCar size={18} />
      </button>

      {/* ⛽ Fuel Stations Toggle */}
      <button 
        onClick={() => setShowFuel(!showFuel)}
        title="Toggle Nearby Fuel Stations"
        style={{
          background: showFuel ? 'rgba(255, 128, 0, 0.2)' : 'transparent',
          border: 'none',
          color: showFuel ? '#ff8000' : '#fff',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FaGasPump size={18} />
      </button>

    </div>
  );
};

export default LayerToggle;
