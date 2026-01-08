/**
 * tomtomKeyManager.js
 * -------------------
 * Manages multiple TomTom API keys and provides rotation logic.
 */

const logger = require('./logger');

const keys = (process.env.TOMTOM_API_KEYS || process.env.TOMTOM_API_KEY || "")
  .split(',')
  .map(k => k.trim())
  .filter(k => k);

let currentKeyIndex = 0;

if (keys.length > 0) {
    console.log(`🔑 Loaded ${keys.length} TomTom API Keys for Rotation.`);
} else {
    console.error("❌ No TomTom API Keys found in .env");
}

/**
 * getTomTomKey()
 * --------------
 * Returns the currently active TomTom key.
 */
const getTomTomKey = () => {
  return keys[currentKeyIndex];
};

/**
 * rotateTomTomKey()
 * -----------------
 * Switches to the next available TomTom key.
 * @returns {string} - The new active key
 */
const rotateTomTomKey = () => {
    if (keys.length <= 1) return getTomTomKey();
    
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`🔄 Rotating TomTom Key. Now using Key Index: ${currentKeyIndex}`);
    return keys[currentKeyIndex];
};

/**
 * getKeyCount()
 * --------------
 */
const getKeyCount = () => keys.length;

module.exports = {
  getTomTomKey,
  rotateTomTomKey,
  getKeyCount
};
