import React from 'react';
import { FaMoneyBillWave, FaClock, FaRoute, FaCheckCircle } from 'react-icons/fa';

const TripStats = ({ trip }) => {
    if (!trip) return null;

    // Calculate Stats
    const totalActivities = trip.itinerary.reduce((acc, day) => acc + day.activities.length, 0);
    const completedCount = trip.completedActivities?.length || 0;
    const completionRate = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;
    
    // Calculate Duration
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate Costs (Estimated for now)
    const estimatedCost = trip.actualCosts?.total || trip.budget; 

    return (
        <div style={styles.container}>
            <div style={styles.statItem}>
                <div style={styles.iconWrapper}><FaClock /></div>
                <div>
                    <div style={styles.label}>Duration</div>
                    <div style={styles.value}>{days} Days</div>
                </div>
            </div>

            <div style={styles.statItem}>
                <div style={styles.iconWrapper}><FaCheckCircle /></div>
                <div>
                    <div style={styles.label}>Progress</div>
                    <div style={styles.value}>{completionRate}%</div>
                </div>
            </div>

            <div style={styles.statItem}>
                <div style={styles.iconWrapper}><FaMoneyBillWave /></div>
                <div>
                    <div style={styles.label}>Total Cost</div>
                    <div style={styles.value}>
                        {typeof estimatedCost === 'number' ? `₹${estimatedCost.toLocaleString()}` : estimatedCost}
                    </div>
                </div>
            </div>

            <div style={styles.statItem}>
                <div style={styles.iconWrapper}><FaRoute /></div>
                <div>
                    <div style={styles.label}>Activities</div>
                    <div style={styles.value}>{completedCount} / {totalActivities}</div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '2rem'
    },
    statItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    iconWrapper: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'rgba(0, 247, 255, 0.1)',
        color: '#00f7ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem'
    },
    label: {
        fontSize: '0.8rem',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    value: {
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#fff'
    }
};

export default TripStats;
