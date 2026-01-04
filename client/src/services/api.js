/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /client/src/services/api.js
 * 
 * Why 'services'?
 * - Keeps API logic separate from UI components.
 * - If the Backend URL changes, we fix it in ONE place.
 * 
 * 2. PURPOSE
 * ----------
 * Mission: To talk to our Node.js Backend.
 * 
 * ==========================================================================================================================================================
 */

import axios from 'axios';

// 1. Create Axios Instance
// Teach: We preset the Base URL so we don't type "http://localhost:5000" every time.
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds (AI + Routing can be slow)
});

export const createTrip = async (tripData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // POST /trips
    const response = await api.post('/trips', tripData, { headers });
    return response.data;
  } catch (error) {
    console.error("API Call Failed:", error); // Debugging help
    throw error; // Rethrow so the UI knows something went wrong
  }
};

// [NEW] Get Trip by ID
export const getTrip = async (id) => {
  try {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  } catch (error) {
    console.error("API Call Failed:", error);
    throw error;
  }
};

// [NEW] Authentication APIs
export const googleLogin = async (userInfo) => {
  try {
    const response = await api.post('/users/google-login', userInfo);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const signupUser = async (name, email, password) => {
  try {
    const response = await api.post('/users/signup', { name, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// [NEW] User Trip Management
export const getMyTrips = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await api.get('/trips/my-trips', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteTrip = async (tripId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await api.delete(`/trips/${tripId}`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// [PHASE 3] Search Along Route
export const searchAlongRoute = async (query, routePoints, options = {}) => {
  try {
    const response = await api.post('/trips/search-along-route', {
      query,
      routePoints,
      maxDetourTime: options.maxDetourTime || 900 // Default 15 mins
    });
    return response.data.data;
  } catch (error) {
    console.error("❌ SAR Search Failed:", error);
    return [];
  }
};

export default api;
