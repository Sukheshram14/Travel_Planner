/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: OBSERVABILITY
 * ==========================================================================================================================================================
 * 
 * Purpose: 
 * A simple utility to track how long each part of our application takes.
 * 💡 "If you can't measure it, you can't improve it."
 * 
 * ==========================================================================================================================================================
 */

const { performance } = require('perf_hooks');

const logger = {
  timers: {},

  /**
   * start(label)
   * ------------
   * Starts a timer with a specific label.
   */
  start: (label) => {
    logger.timers[label] = performance.now();
    console.log(`\n🕒 [START] ${label}...`);
  },

  /**
   * end(label)
   * ----------
   * Ends the timer and calculates the duration.
   */
  end: (label) => {
    const startTime = logger.timers[label];
    if (!startTime) {
      console.warn(`⚠️ Warning: Timer for "${label}" was never started.`);
      return;
    }
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`✅ [DONE] ${label} took ${duration} seconds.`);
    delete logger.timers[label];
    return duration;
  },

  /**
   * info(message)
   * -------------
   * Simple formatted log.
   */
  info: (message) => {
    console.log(`ℹ️ [INFO] ${message}`);
  },

  /**
   * error(label, err)
   * -----------------
   * Formatted error log.
   */
  error: (label, err) => {
    console.error(`❌ [ERROR] ${label}:`, err.message || err);
  }
};

module.exports = logger;
