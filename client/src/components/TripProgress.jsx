import React from 'react';
import { FaCheck, FaFlagCheckered, FaPlay } from 'react-icons/fa';

/**
 * TripProgress
 * ------------
 * A control panel for the active trip.
 * Allows user to "Start Trip", "End Trip", and visualize overall progress.
 */
const TripProgress = ({ trip, onStatusUpdate }) => {
    if (!trip) return null;

    const isPlanned = !trip.status || trip.status === 'planned';
    const isActive = trip.status === 'in-progress';
    const isCompleted = trip.status === 'completed';

    const handleStart = () => {
        if (window.confirm("Ready to hit the road? This will mark your trip as Active! 🚗")) {
            onStatusUpdate('in-progress');
        }
    };

    const handleComplete = () => {
        if (window.confirm("Wrap up this adventure? This will move it to your History. 📜")) {
            onStatusUpdate('completed');
        }
    };

    const handleReopen = () => {
       onStatusUpdate('in-progress');
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={styles.statusBadge(trip.status)}>
                    {isPlanned ? '📅 PLANNED' : isActive ? '🚀 LIVE OFF-ROAD' : '✅ COMPLETED'}
                </div>
                
                {isPlanned && (
                    <button onClick={handleStart} style={styles.actionBtn('start')}>
                        <FaPlay /> Start Trip
                    </button>
                )}
                
                {isActive && (
                    <button onClick={handleComplete} style={styles.actionBtn('finance')}>
                        <FaFlagCheckered /> Finish Trip
                    </button>
                )}

                {isCompleted && (
                    <button onClick={handleReopen} style={styles.ghostBtn}>
                        Re-open Trip
                    </button>
                )}
            </div>
            
            {isActive && (
                <div style={styles.liveIndicator}>
                    <div style={styles.pulseDot}></div>
                    Live Tracking Enabled
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
    },
    statusBadge: (status) => ({
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '800',
        letterSpacing: '1px',
        background: status === 'in-progress' ? 'rgba(239, 68, 68, 0.2)' : 
                   status === 'completed' ? 'rgba(34, 197, 94, 0.2)' : 
                   'rgba(99, 102, 241, 0.2)',
        color: status === 'in-progress' ? '#f87171' : 
               status === 'completed' ? '#4ade80' : 
               '#818cf8',
        border: `1px solid ${
            status === 'in-progress' ? 'rgba(239, 68, 68, 0.4)' : 
            status === 'completed' ? 'rgba(34, 197, 94, 0.4)' : 
            'rgba(99, 102, 241, 0.4)'
        }`
    }),
    actionBtn: (type) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.2rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        background: type === 'start' ? 'linear-gradient(90deg, #00f7ff, #00ff9d)' : '#334155',
        color: type === 'start' ? '#000' : '#fff',
        boxShadow: type === 'start' ? '0 0 15px rgba(0, 247, 255, 0.3)' : 'none'
    }),
    ghostBtn: {
        background: 'transparent',
        border: '1px solid #475569',
        color: '#94a3b8',
        padding: '0.4rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    liveIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: '#f87171',
        fontWeight: '600',
        background: 'rgba(239, 68, 68, 0.1)',
        padding: '0.3rem 0.8rem',
        borderRadius: '20px'
    },
    pulseDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#f87171',
        boxShadow: '0 0 0 rgba(248, 113, 113, 0.4)',
        animation: 'pulse 1.5s infinite'
    }
};

export default TripProgress;
