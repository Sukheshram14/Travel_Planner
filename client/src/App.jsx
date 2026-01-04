/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /client/src/App.jsx
 * 
 * Why 'jsx'?
 * - JSX (JavaScript XML) allows us to write HTML-like code INSIDE JavaScript.
 * - This file is the "Root Component". All other components live inside this one.
 * 
 * 2. PURPOSE
 * ----------
 * Mission: To Define the App's Layout and Routing.
 * 
 * 3. CONCEPT: ROUTING (Client-Side)
 * ---------------------------------
 * - Traditional Web: Click link -> Browser requests new HTML file -> Page Reloads (Slow).
 * - Single Page App (SPA): Click link -> JS swaps the content -> Instant (Fast).
 * - We use `react-router-dom` to handle this.
 * 
 * ==========================================================================================================================================================
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PlannerPage from './pages/PlannerPage';
import AuthPage from './pages/AuthPage'; // [NEW]
import DashboardPage from './pages/DashboardPage'; // [NEW]
import Navbar from './components/Navbar'; // [NEW]

function App() {
  return (
    <Router>
      <div className="app-layout">
        {/* Navigation Bar (Global) */}
        <Navbar />
        
        <Routes>
          {/* Route: When URL is '/', show LandingPage */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Route: When URL is '/plan', show PlannerPage */}
          <Route path="/plan" element={<PlannerPage />} /> 
          
          {/* Route: Login / Signup */}
          <Route path="/login" element={<AuthPage />} />

          {/* Route: User Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
