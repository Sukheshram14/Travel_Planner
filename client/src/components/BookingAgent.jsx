import React, { useState, useEffect } from 'react';
import { FaRobot, FaHotel, FaStar, FaCheckCircle, FaSpinner, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { searchHotels, confirmHotelBooking } from '../services/api';

const BookingAgent = ({ destination, budget, tripId, days = 3, onHotelsLoaded, existingBookings = [], onBookingConfirmed, selectedHotelId, onHotelSelect }) => {
    const [step, setStep] = useState('idle'); // idle, searching, recommending, confirming, confirmed
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);
    const [message, setMessage] = useState("");
    
    // Confirmation modal state
    const [showModal, setShowModal] = useState(false);
    const [guestDetails, setGuestDetails] = useState({
        firstName: '',
        lastName: ''
    });

    // Check for existing bookings on mount
    useEffect(() => {
        if (existingBookings && existingBookings.length > 0) {
            setStep('confirmed');
            setBookingResult(existingBookings[0]); // Show the first booking
            setMessage(`Your hotel reservation at ${existingBookings[0].hotelDetails.name} is confirmed.`);
            
            // Show the booked hotel on the map
            if (onHotelsLoaded) {
                onHotelsLoaded([existingBookings[0].hotelDetails]);
            }
        }
    }, [existingBookings, onHotelsLoaded]);

    const startAgent = async () => {
        setStep('searching');
        setMessage(`Hi! I'm your AI Booking Assistant. Searching for the best hotels in ${destination} for your budget...`);
        
        try {
            const resp = await searchHotels(destination, budget, days);
            if (resp.status === 'success') {
                setHotels(resp.data);
                
                // Notify parent component with hotel coordinates for map markers
                if (onHotelsLoaded && resp.data.length > 0) {
                    onHotelsLoaded(resp.data);
                }
                
                setTimeout(() => {
                    setStep('recommending');
                    setMessage(`I've found ${resp.data.length} great matches! Based on your budget, these top options are available:`);
                }, 1500);
            }
        } catch (err) {
            console.error('Hotel search failed:', err);
            setMessage("Sorry, I had trouble searching for hotels. Please try again later.");
            setStep('idle');
        }
    };

    const handleBookClick = (hotel) => {
        setSelectedHotel(hotel);
        setShowModal(true);
    };

    const handleConfirmBooking = async () => {
        if (!guestDetails.firstName || !guestDetails.lastName) {
            alert('Please enter your first and last name');
            return;
        }

        setShowModal(false);
        setStep('confirming');
        setMessage(`Great choice! Confirming your stay at ${selectedHotel.name}...`);
        
        try {
            // Calculate check-in/check-out dates
            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + 7); // 7 days from now
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkOut.getDate() + days);

            const bookingData = {
                hotelDetails: selectedHotel,
                guestDetails,
                checkIn: checkIn.toISOString(),
                checkOut: checkOut.toISOString()
            };

            const resp = await confirmHotelBooking(tripId, bookingData);
            
            if (resp.status === 'success') {
                setBookingResult(resp.data.booking);
                setStep('confirmed');
                setMessage(`Success! Your reservation at ${selectedHotel.name} is confirmed.`);
                
                // Notify parent to refresh trip data (for dashboard and itinerary overview)
                if (onBookingConfirmed) {
                    onBookingConfirmed();
                }
            }
        } catch (err) {
            console.error('Booking confirmation failed:', err);
            setMessage("Booking failed. Please try again.");
            setStep('recommending');
        }
    };

    return (
        <div style={styles.agentBox}>
            <div style={styles.agentHeader}>
                <div style={styles.agentAvatar}>
                    <FaRobot />
                    <div style={styles.onlineStatus}></div>
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>AI Booking Assistant</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Powered by Gemini</div>
                </div>
            </div>

            <div style={styles.messageContent}>
                <p style={styles.agentMessage}>{message || "Ready to help you find the perfect stay."}</p>

                {step === 'idle' && (
                    <button onClick={startAgent} style={styles.startBtn}>
                        Find Hotels in {destination}
                    </button>
                )}

                {step === 'searching' && (
                    <div style={styles.loadingBox}>
                        <FaSpinner className="animate-spin" />
                        <span>Analyzing availability...</span>
                    </div>
                )}

                {step === 'recommending' && (
                    <div style={styles.hotelsGrid}>
                        {hotels.map(hotel => (
                            <div 
                                key={hotel.id} 
                                style={{
                                    ...styles.hotelCard,
                                    border: (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? '2px solid #00f7ff' : '1px solid rgba(255,255,255,0.1)',
                                    transform: (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? 'scale(1.02)' : 'scale(1)',
                                    boxShadow: (selectedHotelId === hotel.id || selectedHotelId === hotel._id) ? '0 0 15px rgba(0,247,255,0.3)' : 'none'
                                }}
                                onClick={() => onHotelSelect && onHotelSelect(hotel.id)}
                            >
                                <img src={hotel.image} alt={hotel.name} style={styles.hotelImg} />
                                <div style={styles.hotelInfo}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{hotel.name}</div>
                                        <div style={{ color: '#ffd700', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <FaStar /> {hotel.rating}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FaMapMarkerAlt size={10} />
                                        {hotel.address}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', margin: '4px 0', opacity: 0.8, lineHeight: '1.3' }}>
                                        {hotel.description.substring(0, 80)}...
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(0,247,255,0.7)', marginBottom: '6px' }}>
                                        {hotel.amenities.slice(0, 3).join(' • ')}
                                    </div>
                                    <div style={styles.priceTag}>₹{hotel.pricePerNight}<span style={{fontSize: '0.7rem', opacity: 0.6}}>/night</span></div>
                                    <button 
                                        onClick={() => handleBookClick(hotel)}
                                        style={styles.bookBtn}
                                    >
                                        Book via AI
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {step === 'confirming' && (
                    <div style={styles.loadingBox}>
                        <FaSpinner className="animate-spin" />
                        <span>Confirming reservation...</span>
                    </div>
                )}

                {step === 'confirmed' && bookingResult && (
                    <div style={styles.confirmedBox}>
                        <FaCheckCircle size={40} color="#00ff9d" />
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <div style={{ fontWeight: 'bold', color: '#00ff9d', fontSize: '1.1rem' }}>Reservation Confirmed!</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '8px' }}>
                                Guest: {bookingResult.guestDetails.firstName} {bookingResult.guestDetails.lastName}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                                Booking ID: {bookingResult.bookingConfirmationId}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                Confirmation Code: {bookingResult.confirmationCode}
                            </div>
                            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,247,255,0.1)', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem' }}>Total: ₹{bookingResult.totalCost}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{bookingResult.numberOfNights} nights</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showModal && selectedHotel && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, color: '#00f7ff' }}>Confirm Booking</h3>
                            <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(0,247,255,0.05)', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{selectedHotel.name}</div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>₹{selectedHotel.pricePerNight}/night × {days} nights</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#00f7ff', marginTop: '8px' }}>
                                    Total: ₹{selectedHotel.pricePerNight * days}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>First Name</label>
                                <input
                                    type="text"
                                    value={guestDetails.firstName}
                                    onChange={(e) => setGuestDetails({...guestDetails, firstName: e.target.value})}
                                    style={styles.input}
                                    placeholder="Enter first name"
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Last Name</label>
                                <input
                                    type="text"
                                    value={guestDetails.lastName}
                                    onChange={(e) => setGuestDetails({...guestDetails, lastName: e.target.value})}
                                    style={styles.input}
                                    placeholder="Enter last name"
                                />
                            </div>

                            <button onClick={handleConfirmBooking} style={styles.confirmBtn}>
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    agentBox: {
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0, 247, 255, 0.2)',
        borderRadius: '20px',
        padding: '1.5rem',
        marginTop: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        borderLeft: '4px solid var(--color-neon-blue)',
    },
    agentHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '12px'
    },
    agentAvatar: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00f7ff, #0096ff)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: '#0f172a',
        position: 'relative'
    },
    onlineStatus: {
        position: 'absolute',
        bottom: '2px',
        right: '2px',
        width: '10px',
        height: '10px',
        background: '#00ff9d',
        borderRadius: '50%',
        border: '2px solid #0f172a'
    },
    agentMessage: {
        fontSize: '0.95rem',
        lineHeight: '1.5',
        marginBottom: '1.5rem',
        color: '#cbd5e1'
    },
    startBtn: {
        background: 'rgba(0, 247, 255, 0.1)',
        color: '#00f7ff',
        border: '1px solid rgba(0, 247, 255, 0.3)',
        padding: '0.8rem 1.5rem',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
    },
    hotelsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
    },
    hotelCard: {
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.2s',
        cursor: 'pointer'
    },
    hotelImg: {
        width: '100%',
        height: '140px',
        objectFit: 'cover'
    },
    hotelInfo: {
        padding: '12px'
    },
    priceTag: {
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: '#00f7ff',
        margin: '8px 0'
    },
    bookBtn: {
        width: '100%',
        padding: '0.7rem',
        background: 'linear-gradient(90deg, #00f7ff, #0096ff)',
        color: '#0f172a',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.85rem',
        transition: 'all 0.2s'
    },
    loadingBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#00f7ff',
        background: 'rgba(0, 247, 255, 0.05)',
        padding: '1rem',
        borderRadius: '12px'
    },
    confirmedBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'rgba(0, 255, 157, 0.05)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 255, 157, 0.2)'
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    },
    modalContent: {
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 247, 255, 0.3)',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#fff',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '4px'
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.9rem',
        boxSizing: 'border-box'
    },
    confirmBtn: {
        width: '100%',
        padding: '0.9rem',
        background: 'linear-gradient(90deg, #00f7ff, #0096ff)',
        color: '#0f172a',
        border: 'none',
        borderRadius: '10px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.95rem'
    }
};

export default BookingAgent;
