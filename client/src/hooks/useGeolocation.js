import { useState } from 'react';
import axios from 'axios';

/**
 * useGeolocation Hook
 * -------------------
 * React hook for GPS-based location detection with reverse geocoding.
 * 
 * Features:
 * - Request browser geolocation permission
 * - Get current GPS coordinates
 * - Automatically convert coordinates to human-readable address
 * - Handle permission denied/errors gracefully
 */
export const useGeolocation = () => {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [address, setAddress] = useState('');
  const [accuracy, setAccuracy] = useState(null); // Margin of error in meters
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'granted', 'denied', 'prompt'

  const requestLocation = async () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setPermissionStatus('denied');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setAccuracy(acc);
        setPermissionStatus('granted');

        // Reverse geocode to get address
        try {
          const response = await axios.post('http://localhost:5000/api/v1/trips/reverse-geocode', {
            lat: latitude,
            lng: longitude
          });
          
          if (response.data.status === 'success') {
            // Use 'formatted' for exact street address, fallback to 'address' (City, State)
            setAddress(response.data.data.formatted || response.data.data.address);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          // Fallback to coordinates if reverse geocoding fails
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Location error occurred.';
        switch(err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please enable it in browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Location signal unavailable. Try moving to a better area.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = err.message || 'Unknown location error.';
        }
        setError(errorMessage);
        setPermissionStatus('denied');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0 // Force fresh GPS reading (Accuracy > Speed)
      }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    setAddress('');
    setAccuracy(null);
    setError(null);
  };

  return { 
    location, 
    address, 
    accuracy,
    loading, 
    error, 
    permissionStatus, 
    requestLocation,
    clearLocation
  };
};
