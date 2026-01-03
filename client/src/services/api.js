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
});

export const createTrip = async (tripData) => {
  try {
    // POST /trips
    const response = await api.post('/trips', tripData);
    return response.data;
  } catch (error) {
    console.error("API Call Failed:", error); // Debugging help
    throw error; // Rethrow so the UI knows something went wrong
  }
};

export default api;
