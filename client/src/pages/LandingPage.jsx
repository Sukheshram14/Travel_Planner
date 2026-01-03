/**
 * ==========================================================================================================================================================
 * 📚 SOFTWARE ENGINEERING: TEACH-AS-YOU-BUILD
 * ==========================================================================================================================================================
 * 
 * 1. FILE PATH & HIERARCHY
 * ------------------------
 * Path: /client/src/pages/LandingPage.jsx
 * 
 * Why 'pages'?
 * - We separate 'Components' (reusable buttons, cards) from 'Pages' (full screens).
 * - A Page ties together many components to form a view.
 * 
 * 2. PURPOSE
 * ----------
 * Mission: To Wow the user and get them to click "Start Planning".
 * 
 * 3. STYLE
 * --------
 * - Uses the Neon Palette variables we defined in index.css.
 * - Uses Flexbox for centering.
 * 
 * ==========================================================================================================================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRocket, FaMapMarkedAlt, FaMagic } from 'react-icons/fa'; // Icons

const LandingPage = () => {
  const navigate = useNavigate();

  // Handle "Start" Click
  const handleStart = () => {
    // Navigate programmatically to the planner
    navigate('/plan'); 
  };

  return (
    <div className="landing-page" style={styles.container}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <h1 style={styles.title}>
          Travel <span style={{ color: 'var(--color-neon-cyan)' }}>Smarter</span>, <br />
          Not Harder.
        </h1>
        <p style={styles.subtitle}>
          AI-powered itineraries that adapt to your style, budget, and traffic.
        </p>
        
        <button className="btn btn-primary" onClick={handleStart} style={styles.ctaButton}>
          Start Planning <FaRocket style={{ marginLeft: '10px' }} />
        </button>
      </header>

      {/* Features Grid */}
      <section className="container" style={styles.features}>
        <div className="card" style={styles.featureCard}>
          <FaMagic size={30} color="var(--color-neon-green)" />
          <h3>AI Generated</h3>
          <p>Tell us what you love, and we'll build the perfect day.</p>
        </div>

        <div className="card" style={styles.featureCard}>
          <FaMapMarkedAlt size={30} color="var(--color-neon-blue)" />
          <h3>Smart Routing</h3>
          <p>Optimized paths to save you hours of travel time.</p>
        </div>
      </section>
    </div>
  );
};

// 4. Inline Key-Value Styles (For specific layout needs)
// Ideally, this moves to a CSS file, but for learning, seeing it here helps understand "JS in CSS".
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)', // Subtle gradient
  },
  hero: {
    marginBottom: '4rem',
  },
  title: {
    fontSize: '4rem',
    fontWeight: '800',
    marginBottom: '1rem',
    lineHeight: '1.1',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: 'var(--color-text-muted)',
    marginBottom: '2rem',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    width: '100%',
  },
  featureCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  }
};

export default LandingPage;

/**
 * ==========================================================================================================================================================
 * 🎓 KNOWLEDGE PROGRESS MARKERS
 * ==========================================================================================================================================================
 * 
 * What You Learned:
 * 1. **Inline Styles object**: Writing CSS as a JavaScript object `style={{ color: 'red' }}`.
 * 2. **React Icons**: Using libraries to import SVGs as components (`<FaRocket />`).
 * 3. **useNavigate Hook**: How to change URL via code instead of a `<Link>`.
 * 
 * 🚀 Try It Yourself:
 * Add a third feature card using a new Icon from `react-icons/fa`.
 * ==========================================================================================================================================================
 */
