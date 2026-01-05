import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkedAlt, FaTrash, FaSignOutAlt, FaCalendarAlt, FaFilePdf, FaHotel } from 'react-icons/fa';
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
          // Sort trips by status
            const allTrips = data.data || [];
            allTrips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTrips(allTrips);
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

  const handleDownloadPDF = (trip) => {
      if (!window.html2pdf) {
          alert("PDF library is still loading...");
          return;
      }

      // Create a temporary container for PDF generation
      const element = document.createElement('div');
      element.style.padding = '20px';
      element.style.background = '#0F172A';
      element.style.color = '#F1F5F9';
      element.style.fontFamily = "'Inter', sans-serif";

      // Build a basic printable structure
      let html = `
          <h1 style="color: #00f7ff; text-align: center;">${trip.destination} Itinerary</h1>
          <p style="text-align: center; color: #94a3b8;">${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()} | ${trip.travelers}</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;">
      `;

      if (trip.itinerary && trip.itinerary.length > 0) {
          trip.itinerary.forEach(day => {
              html += `
                  <div style="margin-bottom: 30px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                      <h3 style="color: #00f7ff; margin-top: 0;">Day ${day.dayNumber}: ${day.theme || ''}</h3>
                      <div style="display: grid; gap: 15px;">
              `;

              day.activities.forEach(act => {
                  html += `
                      <div style="padding: 10px; border-left: 3px solid #00f7ff; background: rgba(0,247,255,0.02);">
                          <strong style="display: block; color: #fff;">${act.timeSlot} - ${act.name}</strong>
                          <p style="margin: 5px 0 0; font-size: 0.9rem; color: #cbd5e1;">${act.description}</p>
                      </div>
                  `;
              });

              html += `</div></div>`;
          });
      }

      element.innerHTML = html;

      const opt = {
          margin: [10, 10],
          filename: `Trip_${trip.destination}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, backgroundColor: '#0F172A' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().from(element).set(opt).save();
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {/* Active Trips Section */}
                    {trips.some(t => t.status === 'in-progress') && (
                        <div className="section-active">
                            <h2 style={{ color: '#00f7ff', borderBottom: '1px solid rgba(0,247,255,0.3)', paddingBottom: '0.5rem' }}>🚀 On The Road</h2>
                            <div style={styles.grid}>
                                {trips.filter(t => t.status === 'in-progress').map(trip => (
                                    <TripCard key={trip._id} trip={trip} navigate={navigate} handleDelete={handleDelete} handleDownloadPDF={handleDownloadPDF} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Planned Trips Section */}
                    <div className="section-planned">
                         <h2 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>📅 Upcoming Adventures</h2>
                         <div style={styles.grid}>
                            {trips.filter(t => (t.status === 'planned' || !t.status)).map(trip => (
                                <TripCard key={trip._id} trip={trip} navigate={navigate} handleDelete={handleDelete} handleDownloadPDF={handleDownloadPDF} />
                            ))}
                         </div>
                    </div>

                    {/* Past Trips Section */}
                    {trips.some(t => t.status === 'completed') && (
                        <div className="section-completed">
                            <h2 style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>📜 Trip History</h2>
                            <div style={styles.grid}>
                                {trips.filter(t => t.status === 'completed').map(trip => (
                                    <TripCard key={trip._id} trip={trip} navigate={navigate} handleDelete={handleDelete} isPast={true} handleDownloadPDF={handleDownloadPDF} />
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
              )}
          </div>
      </div>
  );
};

const TripCard = ({ trip, navigate, handleDelete, handleDownloadPDF, isPast }) => (
    <div style={{...styles.card, opacity: isPast ? 0.7 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: isPast ? '#cbd5e1' : '#fff' }}>{trip.destination}</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    onClick={() => handleDownloadPDF(trip)}
                    style={styles.pdfIconBtn}
                    title="Download PDF"
                >
                    <FaFilePdf />
                </button>
                {trip.status === 'in-progress' && <span style={styles.badgeActive}>LIVE</span>}
            </div>
        </div>
        
        <div style={styles.cardMeta}>
             <span>{new Date(trip.startDate).toLocaleDateString()}</span>
             <span>•</span>
             <span>{trip.travelers}</span>
             <span>•</span>
             <span>{trip.budget}</span>
        </div>

        {trip.hotelBookings && trip.hotelBookings.length > 0 && (
            <div style={{ 
                marginBottom: '1rem', 
                padding: '0.5rem 0.8rem', 
                background: 'rgba(0, 247, 255, 0.1)', 
                border: '1px solid rgba(0, 247, 255, 0.3)',
                borderRadius: '6px', 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#00f7ff'
            }}>
                <FaHotel />
                <div>Hotel Booked: <strong>{trip.hotelBookings[0].hotelDetails.name}</strong></div>
            </div>
        )}

        {isPast && (
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem' }}>
                <div>✨ Activities Done: {trip.completedActivities?.length || 0}</div>
            </div>
        )}

        <div style={styles.cardActions}>
            <button 
            onClick={() => navigate(`/plan?tripId=${trip._id}`)}
            style={trip.status === 'in-progress' ? styles.resumeBtn : styles.viewBtn}
            >
            {trip.status === 'in-progress' ? 'Resume Journey' : (isPast ? 'View Details' : 'View Plan')}
            </button>
            <button 
            onClick={() => handleDelete(trip._id)}
            style={styles.deleteBtn}
            >
            <FaTrash />
            </button>
        </div>
    </div>
);

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
  },
  pdfIconBtn: {
      padding: '0.5rem',
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#ff4d4d',
      border: '1px solid rgba(255, 77, 77, 0.3)',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
  },
  resumeBtn: {
      flex: 1,
      padding: '0.5rem',
      background: 'linear-gradient(90deg, #00f7ff, #00ff9d)',
      color: '#000',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 'bold'
  },
  badgeActive: {
      background: '#ef4444',
      color: 'white',
      fontSize: '0.6rem',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: 'bold',
      animation: 'pulse 2s infinite'
  }
};

export default DashboardPage;
