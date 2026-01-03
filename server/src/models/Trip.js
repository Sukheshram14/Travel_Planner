/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /server/src/models/Trip.js
 * 
 * Why here?
 * 'models' folder contains the "blueprints" for our data.
 * In MERN (Mongodb, Express, React, Node), this is the 'M' layer connection.
 * 
 * 2. PURPOSE & RESPONSIBILITIES
 * -----------------------------
 * Mission: To define exactly what a "Trip" looks like in our database.
 * 
 * 💡 Real-World Analogy: A "Form Template" at a Doctor's office.
 * - You can't just scribble on a napkin. You need to fill out: Name, Age, Symptoms.
 * - This file forces the data to follow that structure before we save it.
 * 
 * 3. CONCEPTS & TECHNOLOGY
 * ------------------------
 * - **Mongoose**: A library that makes MongoDB easier to use. It adds "Structure" (Schemas) to a "Structureless" (NoSQL) database.
 * - **Schema**: The definition of the data structure (fields, types, required).
 * - **Model**: The actual tool we use to Create, Read, Update, Delete (CRUD) documents based on the Schema.
 * 
 * ==========================================================================================================================================================
 */

const mongoose = require('mongoose');

// 4. Schema Definition
// --------------------
// We break down a 'Trip' into logical pieces.

const ActivitySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Eiffel Tower"
  type: { type: String, default: 'attraction' }, 
  location: {
    lat: Number,
    lng: Number,
    address: String,
    gMapLink: String // 💡 Deep link for navigation
  },
  timeSlot: String,
  description: String,
  estimatedCostINR: Number, // 💡 Renamed for local clarity
  dayNumber: Number,   
  orderInDay: Number   
});

const DaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  theme: String,
  activities: [ActivitySchema]
});

const TripSchema = new mongoose.Schema({
  // Metadata
  userId: { 
    type: String, 
    required: false, 
    index: true 
  },
  
  // User Inputs
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  budget: { type: String, enum: ['cheap', 'moderate', 'luxury'], required: true },
  travelers: { type: String, enum: ['solo', 'couple', 'family', 'friends'], default: 'solo' },
  
  // Pro Fields
  famousThings: [String],
  suggestedStay: String,
  
  // The Generated Itinerary
  itinerary: [DaySchema],
  
  // Status
  isGenerated: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now }
});

/**
 * 5. Connection to App Flow
 * -------------------------
 * Controller -> Creates a `new Trip({...})`
 * Model -> Validates data against `TripSchema`
 * MongoDB -> Saves the JSON document
 */

const Trip = mongoose.model('Trip', TripSchema);

module.exports = Trip;

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Component-Based Data**: We didn't dump everything in one big object. We made `ActivitySchema` and `DaySchema` components.
 * 2. **Enums**: `enum: ['cheap', 'moderate']` restricts values. If you try to save "super-expensive", Mongoose will throw an error.
 * 3. **Indexing**: `index: true` optimizes search performance.
 * 
 * 🚀 Try It Yourself:
 * Add a `notes` field to the TripSchema so users can write personal reminders.
 * ==========================================================================================================================================================
 */
