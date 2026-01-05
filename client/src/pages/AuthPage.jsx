import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { googleLogin } from '../services/api'; // We'll create this next
import { FaGoogle, FaGlobeAmericas } from 'react-icons/fa';

/**
 * ==========================================================================================================================================================
 * 📚 AUTH PAGE (Google Only)
 * ==========================================================================================================================================================
 * 
 * Purpose:
 * Simple, secure login using Google.
 * 
 * Flow:
 * 1. User clicks "Sign in with Google".
 * 2. Firebase handles the popup and credentials.
 * 3. We get a User Object from Firebase.
 * 4. We send this to our Backend to create a session/JWT.
 * 
 * ==========================================================================================================================================================
 */

const AuthPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Firebase Popup
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            console.log("🔥 Firebase Success:", user.email);

            // 2. Send to Backend to Sync/Create Account
            // We send the UID so the backend can verify/trust it (or verify the ID token for strict security)
            const data = await googleLogin({
                email: user.email,
                name: user.displayName,
                googleId: user.uid,
                avatar: user.photoURL
            });

            console.log("✅ Backend Sync Success:", data);

            // 3. Save Session
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // 4. Redirect
            navigate('/');

        } catch (err) {
            console.error("❌ Login Failed:", err);
            setError(err.message || 'Google Sign-In failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <FaGlobeAmericas size={40} color="#00f7ff" />
                    <h1 style={styles.title}>Travera</h1>
                    <p style={styles.subtitle}>
                        Your personal AI travel companion. <br/>
                        Sign in to save your trips.
                    </p>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                <button 
                    onClick={handleGoogleSignIn} 
                    disabled={loading} 
                    style={styles.googleButton}
                >
                    <FaGoogle />
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <div style={styles.footer}>
                    <p>Powered by Gemini AI & TomTom</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #000 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: "'Inter', sans-serif"
    },
    card: {
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '3rem',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    header: {
        marginBottom: '2.5rem'
    },
    title: {
        fontSize: '2rem',
        margin: '1rem 0 0.5rem 0',
        background: 'linear-gradient(90deg, #fff, #a5b4fc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    },
    subtitle: {
        color: '#94a3b8',
        fontSize: '0.95rem',
        lineHeight: '1.5'
    },
    googleButton: {
        background: 'white',
        color: '#1f2937',
        width: '100%',
        padding: '1rem',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '600',
        fontSize: '1rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        transition: 'transform 0.1s, box-shadow 0.2s',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    error: {
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        padding: '0.75rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        fontSize: '0.9rem'
    },
    footer: {
        marginTop: '2.5rem',
        fontSize: '0.8rem',
        color: '#64748b'
    }
};

export default AuthPage;



