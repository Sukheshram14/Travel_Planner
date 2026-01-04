import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaTrash, FaSignOutAlt, FaCalendarAlt } from 'react-icons/fa';
// TODO: Implement getMyTrips and deleteTrip in api.js first
import { getMyTrips, deleteTrip } from '../services/api'; 

const DashboardPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Check Auth
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
        navigate('/login');
        return;
    }
    
    setUser(JSON.parse(storedUser));
    fetchTrips();
  }, [navigate]);

  const fetchTrips = async () => {
      try {
          const data = await getMyTrips(); 
          setTrips(data.data || []);
      } catch (error) {
          console.error("Failed to fetch trips", error);
      } finally {
          setLoading(false);
      }
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Are you sure you want to delete this trip?")) return;
      try {
          await deleteTrip(id);
          setTrips(trips.filter(t => t._id !== id));
      } catch (error) {
          console.error("Failed to delete trip", error);
          alert("Failed to delete trip.");
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
  };

  return (
      <div style={styles.container}>
          <div style={styles.header}>
              <div style={styles.logo}>
                  <FaMapMarkedAlt size={24} color="#00f7ff" />
                  <span style={styles.logoText}>Travel Planner</span>
              </div>
              <div style={styles.userInfo}>
                  <span>Welcome, {user?.name}</span>
                  <button onClick={handleLogout} style={styles.logoutBtn}>
                      <FaSignOutAlt /> Logout
                  </button>
              </div>
          </div>

          <div style={styles.content}>
              <div style={styles.pageTitle}>
                  <h1>My Trips</h1>
                  <button onClick={() => navigate('/plan')} style={styles.newTripBtn}>
                      + Plan New Trip
                  </button>
              </div>

              {loading ? (
                  <p>Loading trips...</p>
              ) : trips.length === 0 ? (
                  <div style={styles.emptyState}>
                      <p>You haven't planned any trips yet.</p>
                      <button onClick={() => navigate('/plan')} style={styles.ctaBtn}>
                          Start Planning
                      </button>
                  </div>
              ) : (
                  <div style={styles.grid}>
                      {trips.map(trip => (
                          <div key={trip._id} style={styles.card}>
                              <h3>{trip.origin} ➝ {trip.destination}</h3>
                              <div style={styles.cardMeta}>
                                  <FaCalendarAlt /> {new Date(trip.createdAt).toLocaleDateString()}
                              </div>
                              <div style={styles.cardActions}>
                                  <button 
                                    onClick={() => navigate(`/plan?tripId=${trip._id}`)}
                                    style={styles.viewBtn}
                                  >
                                    View
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(trip._id)}
                                    style={styles.deleteBtn}
                                  >
                                    <FaTrash />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );
};

const styles = {
  container: {
      minHeight: '100vh',
      background: '#0f172a',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
  },
  header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      background: 'rgba(255,255,255,0.05)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: 'bold',
      fontSize: '1.2rem'
  },
  logoText: {
      background: 'linear-gradient(90deg, #00f7ff, #00ff9d)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
  },
  userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
  },
  logoutBtn: {
      background: 'transparent',
      border: '1px solid #475569',
      color: '#cbd5e1',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
  },
  content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
  },
  pageTitle: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
  },
  newTripBtn: {
      background: '#6366f1',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      fontWeight: '600',
      cursor: 'pointer'
  },
  emptyState: {
      textAlign: 'center',
      padding: '4rem',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '16px',
      border: '1px dashed #334155'
  },
  ctaBtn: {
      marginTop: '1rem',
      background: '#00f7ff',
      color: '#000',
      border: 'none',
      padding: '0.75rem 2rem',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer'
  },
  grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
  },
  card: {
      background: '#1e293b',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #334155'
  },
  cardMeta: {
      color: '#94a3b8',
      fontSize: '0.9rem',
      margin: '0.5rem 0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
  },
  cardActions: {
      display: 'flex',
      gap: '0.5rem'
  },
  viewBtn: {
      flex: 1,
      padding: '0.5rem',
      background: '#334155',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
  },
  deleteBtn: {
      padding: '0.5rem',
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#f87171',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
  }
};

export default DashboardPage;
