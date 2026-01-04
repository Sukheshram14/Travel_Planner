import { useState, useEffect } from 'react';

/**
 * useGeofence
 * -----------
 * Client-Side Geofencing Hook.
 * Moniitors GPS location and triggers alerts when approaching specific targets.
 * 
 * @param {Object} currentLocation - { lat, lng } from useGeolocation
 * @param {Array} targets - Array of POIs [{ location: { lat, lng }, name, ... }]
 * @param {number} radiusKm - Alert radius in km (default 1km)
 */
export const useGeofence = (currentLocation, targets, radiusKm = 1.0) => {
  const [activeAlerts, setActiveAlerts] = useState([]); // List of POI names we are "inside"
  const [triggered, setTriggered] = useState(new Set()); // Keep track of alerts already shown (to avoid spam)

  // Haversine Distance Formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  useEffect(() => {
    if (!currentLocation || !targets || targets.length === 0) return;

    // Check each target
    targets.forEach(target => {
        if (!target.location || !target.location.lat || !target.location.lng) return;

        const dist = getDistanceFromLatLonInKm(
            currentLocation.lat,
            currentLocation.lng,
            target.location.lat,
            target.location.lng
        );

        if (dist <= radiusKm) {
            // We are INSIDE the zone
            if (!triggered.has(target.name)) {
                // New Arrival!
                setActiveAlerts(prev => [...prev, target.name]);
                setTriggered(prev => {
                    const next = new Set(prev);
                    next.add(target.name);
                    return next;
                });
            }
        }
    });

  }, [currentLocation, targets, radiusKm]);

  // Function to dismiss alert
  const dismissAlert = (name) => {
    setActiveAlerts(prev => prev.filter(alert => alert !== name));
  };

  return { activeAlerts, dismissAlert };
};
