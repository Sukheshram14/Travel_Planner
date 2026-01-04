import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRocket, FaSignInAlt, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // [NEW] Profile Dropdown State
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsMenuOpen(false);
        setIsProfileOpen(false);
        navigate('/');
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleProfile = () => setIsProfileOpen(!isProfileOpen);

    return (
        <nav style={styles.nav} className="navbar">
            <div style={styles.logo} onClick={() => { setIsMenuOpen(false); navigate('/'); }}>
                <FaRocket color="#00f7ff" />
                <span style={styles.logoText} className="navbar-logo-text">TravelPlanner</span>
            </div>

            {/* Mobile Menu Toggle */}
            <div 
                className="navbar-toggle" 
                style={styles.mobileToggle} 
                onClick={toggleMenu}
            >
                {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </div>

            <div className={`navbar-links ${isMenuOpen ? 'open' : ''}`} style={{
                ...styles.links,
                ...(isMenuOpen ? styles.mobileLinksOpen : {})
            }}>
                <div style={styles.navItems}>
                    <Link to="/" style={styles.link} onClick={() => setIsMenuOpen(false)}>Home</Link>
                    <Link to="/plan" style={styles.link} onClick={() => setIsMenuOpen(false)}>Plan Trip</Link>
                </div>
                
                {user ? (
                    <div style={styles.userSectionWrapper}>
                        {/* Profile Dropdown Container */}
                        <div style={styles.profileContainer} onClick={toggleProfile}>
                            <div style={styles.profileTrigger}>
                                <FaUserCircle size={28} color="#a5b4fc" />
                                <span style={styles.userName}>{user.name}</span>
                            </div>
                            
                            {/* Dropdown Menu */}
                            {isProfileOpen && (
                                <div style={styles.dropdownMenu}>
                                    <Link to="/dashboard" style={styles.dropdownItem} onClick={() => setIsMenuOpen(false)}>My Trips</Link>
                                    <div style={styles.dropdownItem}>Profile</div>
                                    <div style={styles.dropdownItem}>Settings</div>
                                    <div style={styles.dropdownDivider}></div>
                                    <button onClick={handleLogout} style={styles.dropdownLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <Link to="/login" style={styles.loginBtn} onClick={() => setIsMenuOpen(false)}>
                        <FaSignInAlt /> Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 2rem', // Increased padding
        background: 'rgba(15, 23, 42, 0.95)', // Slightly more opaque
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 2000,
        boxSizing: 'border-box',
        height: '70px' // Taller header
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        fontSize: '1.4rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: 'white',
        zIndex: 2001
    },
    logoText: {
        background: 'linear-gradient(90deg, #fff, #a5b4fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.5px'
    },
    mobileToggle: {
        display: 'none',
        color: 'white',
        cursor: 'pointer',
        zIndex: 2001,
        padding: '0.5rem' // More hit area
    },
    links: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        marginLeft: 'auto' // Align to right
    },
    navItems: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
    },
    mobileLinksOpen: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(15px)',
        padding: '2rem',
        gap: '2.5rem',
        boxSizing: 'border-box',
        zIndex: 2000,
        transition: 'all 0.3s ease-in-out'
    },
    link: {
        color: 'rgba(255, 255, 255, 0.8)',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'all 0.2s',
        fontSize: '1rem',
        letterSpacing: '0.5px',
        ':hover': {
            color: '#fff'
        }
    },
    loginBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        padding: '0.6rem 1.5rem',
        borderRadius: '50px',
        textDecoration: 'none',
        fontWeight: '600',
        fontSize: '0.95rem',
        transition: 'all 0.2s',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    userSectionWrapper: {
        position: 'relative',
        marginLeft: '1rem'
    },
    profileContainer: {
        position: 'relative',
        cursor: 'pointer'
    },
    profileTrigger: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        padding: '0.4rem 0.8rem',
        borderRadius: '30px',
        transition: 'background 0.2s',
        ':hover': {
             background: 'rgba(255, 255, 255, 0.05)'
        }
    },
    userName: {
        color: '#e2e8f0',
        fontSize: '1rem',
        fontWeight: '500'
    },
    dropdownMenu: {
        position: 'absolute',
        top: '120%',
        right: 0,
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '0.5rem',
        minWidth: '200px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.2rem',
        zIndex: 2002
    },
    dropdownItem: {
        padding: '0.8rem 1rem',
        color: '#cbd5e1',
        textDecoration: 'none',
        fontSize: '0.95rem',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        ':hover': {
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#fff'
        }
    },
    dropdownDivider: {
        height: '1px',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: '0.4rem 0'
    },
    dropdownLogout: {
        padding: '0.8rem 1rem',
        color: '#ef4444',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        fontSize: '0.95rem',
        fontWeight: '600',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        ':hover': {
            background: 'rgba(239, 68, 68, 0.1)'
        }
    }
};

export default Navbar;
