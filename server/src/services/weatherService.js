/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 1. FILE PATH: server/src/services/weatherService.js
 * 2. PURPOSE: Fetch weather forecast from WeatherAPI.com
 * ==========================================================================================================================================================
 */

const axios = require('axios');

// Using WeatherAPI.com (Free Tier)
// Ideally, this key should be in .env, but for simplicity in this workshop, we hardcode fallback or use env.
const API_KEY = process.env.WEATHER_API_KEY || 'YOUR_WEATHER_API_KEY'; 
const BASE_URL = 'http://api.weatherapi.com/v1/forecast.json';

/**
 * getForecast
 * -----------
 * Returns a simple forecast object for the destination.
 * @param {string} location - e.g., "Paris"
 */
const getForecast = async (location) => {
  try {
    if (!process.env.WEATHER_API_KEY) {
        console.warn("⚠️ No WEATHER_API_KEY found in .env. Skipping weather fetch.");
        return null;
    }

    const response = await axios.get(BASE_URL, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: location,
        days: 3, // Get a few days forecast
        aqi: 'no',
        alerts: 'no'
      }
    });

    const data = response.data;
    
    // Transform into a simple object for our Frontend
    return {
      location: data.location.name,
      temp_c: data.current.temp_c,
      condition: data.current.condition.text,
      icon: data.current.condition.icon, // URL to icon image
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        max_temp: day.day.maxtemp_c,
        min_temp: day.day.mintemp_c,
        condition: day.day.condition.text,
        icon: day.day.condition.icon
      }))
    };

  } catch (error) {
    console.error(`❌ Weather API Error for ${location}:`, error.message);
    return null; // Return null so the app doesn't crash, just shows no weather
  }
};

module.exports = { getForecast };
