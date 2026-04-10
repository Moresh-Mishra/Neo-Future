import React from 'react';
import '../styles/emwell.css';

// Import local images
import heroWellness from '../assets/hero-wellness.jpg';
import processJournal from '../assets/process-journal.jpg';
import testimonialJulianne from '../assets/testimonial-julianne.jpg';
import testimonialMarcus from '../assets/testimonial-marcus.jpg';

const EmWellLandingPage = ({ onNavigate }) => {
  return (
    <div className="emwell-landing-page">
      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-brand">EmWell</div>
          <div className="nav-actions">
            <button className="nav-btn login" onClick={() => onNavigate?.('login')}>Log In</button>
            <button className="nav-btn signup" onClick={() => onNavigate?.('signup')}>Sign Up</button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <h1 className="hero-title">
                Your Personal <span className="hero-accent">Sanctuary</span> for Mind and Body.
              </h1>
              <p className="hero-description">
                EmWell blends ancestral wisdom with empathetic AI to curate a wellness journey as unique as your own breath. Gentle, intentional, and entirely yours.
              </p>
              <div className="hero-actions">
                <button className="btn-primary" onClick={() => onNavigate?.('signup')}>Start Your Journey</button>
                <button className="btn-secondary">Watch the Story</button>
              </div>
            </div>
            <div className="hero-image-wrapper">
              <div className="hero-image-container">
                <img src={heroWellness} alt="Wellness Sanctuary" className="hero-image" />
              </div>
              <div className="hero-testimonial-card">
                <p className="testimonial-text">"The first app that actually feels like it's breathing with me."</p>
                <p className="testimonial-author">— Sarah K.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Section */}
        <section className="features-section">
          <div className="features-container">
            <div className="features-header">
              <span className="features-label">Core Pillars</span>
              <h2 className="features-title">Crafted for your growth.</h2>
            </div>
            <div className="features-grid">
              {/* Feature 1 */}
              <div className="feature-card">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">fitness_center</span>
                </div>
                <h3 className="feature-title">Personalized Fitness</h3>
                <p className="feature-description">
                  Custom workout plans that evolve with your circadian rhythm and energy levels. Not just exercise, but movement with purpose.
                </p>
                <a href="#" className="feature-link">
                  Explore Workouts <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>

              {/* Feature 2 */}
              <div className="feature-card featured">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">self_improvement</span>
                </div>
                <h3 className="feature-title">Mental Wellbeing</h3>
                <p className="feature-description">
                  Continuous support and mindful rituals designed to anchor you in the present. From breathwork to guided journaling.
                </p>
                <a href="#" className="feature-link">
                  Practice Mindfulness <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>

              {/* Feature 3 */}
              <div className="feature-card">
                <div className="feature-icon">
                  <span className="material-symbols-outlined">psychology</span>
                </div>
                <h3 className="feature-title">AI Companion</h3>
                <p className="feature-description">
                  An interactive 3D avatar that understands your emotions through voice tone and patterns, providing empathetic guidance 24/7.
                </p>
                <a href="#" className="feature-link">
                  Meet your Guide <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="how-it-works-section">
          <div className="how-it-works-container">
            <div className="how-it-works-image">
              <img src={processJournal} alt="The Process" className="process-image" />
            </div>
            <div className="how-it-works-content">
              <h2 className="how-it-works-title">The path to clarity is simple.</h2>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-number">01</div>
                  <div className="step-content">
                    <h4 className="step-title">Deep Discovery</h4>
                    <p className="step-description">
                      Through a brief initial session, our AI understands your current state—mental, physical, and emotional.
                    </p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">02</div>
                  <div className="step-content">
                    <h4 className="step-title">Sanctuary Sync</h4>
                    <p className="step-description">
                      We build your ritual deck: a selection of workouts, meditations, and companion check-ins synced to your schedule.
                    </p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">03</div>
                  <div className="step-content">
                    <h4 className="step-title">Living Growth</h4>
                    <p className="step-description">
                      As you evolve, EmWell evolves. Your companion learns your triumphs and challenges to better support your journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="testimonials-container">
            <div className="testimonial-item">
              <span className="material-symbols-outlined quote-icon">format_quote</span>
              <p className="testimonial-text">
                "EmWell doesn't feel like another task on my to-do list. It feels like a exhale I've been waiting to take all day. The AI companion is surprisingly intuitive."
              </p>
              <div className="testimonial-author-info">
                <img src={testimonialJulianne} alt="Julianne" className="author-avatar" />
                <div className="author-details">
                  <p className="author-name">Julianne Rivers</p>
                  <p className="author-role">Creative Director</p>
                </div>
              </div>
            </div>
            <div className="testimonial-item offset">
              <span className="material-symbols-outlined quote-icon">format_quote</span>
              <p className="testimonial-text">
                "The fitness plans are actually achievable. For the first time, I'm working out because I want to, not because an app is yelling at me to close my rings."
              </p>
              <div className="testimonial-author-info">
                <img src={testimonialMarcus} alt="Marcus" className="author-avatar" />
                <div className="author-details">
                  <p className="author-name">Marcus Thorne</p>
                  <p className="author-role">Systems Architect</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to nurture your light?</h2>
              <p className="cta-description">
                Join a community of thousands who have found their center with EmWell. Your journey begins with a single step.
              </p>
              <button className="btn-cta" onClick={() => onNavigate?.('signup')}>Get Started for Free</button>
            </div>
            <div className="cta-background-decoration">
              <div className="cta-blur-circle top-right"></div>
              <div className="cta-blur-circle bottom-left"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-brand-name">EmWell</div>
            <p className="footer-copyright">
              © 2024 EmWell. The Living Sanctuary for your Mind and Body.
            </p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Accessibility</a>
            <a href="#" className="footer-link">Contact Us</a>
          </div>
          <div className="footer-icons">
            <span className="material-symbols-outlined">language</span>
            <span className="material-symbols-outlined">favorite</span>
            <span className="material-symbols-outlined">spa</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .emwell-landing-page {
          min-height: 100vh;
          background-color: var(--background);
        }

        /* Navigation */
        .top-nav {
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 50;
          background-color: rgba(248, 250, 243, 0.7);
          backdrop-filter: blur(24px);
          transition: all 0.3s ease;
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: var(--on-surface);
        }

        .nav-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .nav-btn {
          padding: 0.5rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 9999px;
        }

        .nav-btn.login {
          background: transparent;
          color: var(--on-surface-variant);
        }

        .nav-btn.login:hover {
          color: var(--primary);
        }

        .nav-btn.signup {
          background: var(--primary-gradient, linear-gradient(145deg, #436745 0%, #375b3a 100%));
          color: var(--on-primary);
          font-weight: 600;
          transform: scale(0.95);
        }

        .nav-btn.signup:hover {
          opacity: 0.9;
        }

        /* Main Content */
        .main-content {
          padding-top: 6rem;
          overflow-x: hidden;
        }

        /* Hero Section */
        .hero-section {
          padding: 5rem 2rem 8rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
        }

        @media (min-width: 1024px) {
          .hero-container {
            grid-template-columns: 7fr 5fr;
            align-items: center;
          }
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1.1;
          color: var(--on-surface);
        }

        .hero-title .hero-accent {
          color: var(--primary);
          font-style: italic;
          font-weight: 500;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 4rem;
          }
        }

        .hero-description {
          font-size: 1.125rem;
          color: var(--on-surface-variant);
          max-width: 36rem;
          line-height: 1.6;
        }

        @media (min-width: 768px) {
          .hero-description {
            font-size: 1.25rem;
          }
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          padding-top: 1rem;
        }

        .btn-primary, .btn-cta {
          padding: 1rem 2rem;
          border-radius: 9999px;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          background: linear-gradient(145deg, #436745 0%, #375b3a 100%);
          color: var(--on-primary);
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
          transition: all 0.2s ease;
        }

        .btn-primary:hover, .btn-cta:hover {
          opacity: 0.9;
        }

        .btn-secondary {
          padding: 1rem 2rem;
          border-radius: 9999px;
          font-size: 1rem;
          font-weight: 700;
          border: 1px solid rgba(117, 125, 115, 0.2);
          background: transparent;
          color: var(--primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: var(--surface-container);
        }

        .hero-image-wrapper {
          position: relative;
        }

        .hero-image-container {
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
          transform: rotate(2deg);
          transition: transform 0.7s ease;
        }

        .hero-image-container:hover {
          transform: rotate(0deg);
        }

        .hero-image {
          width: 100%;
          aspect-ratio: 4/5;
          object-fit: cover;
        }

        .hero-testimonial-card {
          position: absolute;
          bottom: -1.5rem;
          left: -1.5rem;
          background: var(--surface-container-highest);
          padding: 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
          max-width: 200px;
        }

        .testimonial-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--on-surface);
        }

        .testimonial-author {
          font-size: 0.75rem;
          color: var(--on-surface-variant);
          margin-top: 0.5rem;
        }

        /* Features Section */
        .features-section {
          padding: 6rem 1rem;
          background: var(--surface-container-low);
          border-radius: 8rem;
          margin: 0 1rem;
        }

        @media (min-width: 768px) {
          .features-section {
            padding: 6rem 2rem;
            margin: 0 2rem;
          }
        }

        .features-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .features-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .features-label {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--primary);
          text-transform: uppercase;
        }

        .features-title {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-top: 1rem;
          color: var(--on-surface);
        }

        @media (min-width: 768px) {
          .features-title {
            font-size: 3rem;
          }
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          background: var(--surface);
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-0.5rem);
        }

        .feature-card.featured {
          background: var(--surface-container-highest);
        }

        .feature-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          font-size: 1.875rem;
        }

        .feature-card .feature-icon {
          background: var(--primary-container);
          color: var(--primary);
        }

        .feature-card.featured .feature-icon {
          background: var(--surface);
          color: var(--primary);
        }

        .feature-card:nth-child(3) .feature-icon {
          background: var(--secondary-container);
          color: var(--secondary);
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--on-surface);
        }

        .feature-description {
          color: var(--on-surface-variant);
          line-height: 1.7;
        }

        .feature-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .feature-link:hover {
          gap: 1rem;
        }

        .feature-link .material-symbols-outlined {
          transition: all 0.2s ease;
        }

        /* How It Works Section */
        .how-it-works-section {
          padding: 8rem 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .how-it-works-container {
          display: flex;
          flex-direction: column;
          gap: 4rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .how-it-works-container {
            flex-direction: row;
            gap: 4rem;
          }
        }

        .how-it-works-image {
          flex: 1;
        }

        .process-image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 2.5rem;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
        }

        .how-it-works-content {
          flex: 1;
        }

        .how-it-works-title {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 3rem;
          color: var(--on-surface);
        }

        @media (min-width: 768px) {
          .how-it-works-title {
            font-size: 3rem;
          }
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .step-item {
          display: flex;
          gap: 1.5rem;
        }

        .step-number {
          flex-shrink: 0;
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          border: 1px solid var(--outline-variant);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--primary);
        }

        .step-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--on-surface);
        }

        .step-description {
          color: var(--on-surface-variant);
          line-height: 1.6;
        }

        /* Testimonials Section */
        .testimonials-section {
          padding: 6rem 2rem;
          background: var(--surface);
        }

        .testimonials-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 4rem;
        }

        @media (min-width: 768px) {
          .testimonials-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .testimonial-item {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .testimonial-item.offset {
          margin-top: 3rem;
        }

        @media (min-width: 768px) {
          .testimonial-item.offset {
            margin-top: 6rem;
          }
        }

        .quote-icon {
          font-size: 3.75rem;
          color: var(--primary);
          opacity: 0.3;
        }

        .testimonial-text {
          font-size: 1.875rem;
          font-weight: 300;
          line-height: 1.4;
          color: var(--on-surface);
          font-style: italic;
        }

        .testimonial-author-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .author-avatar {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          object-fit: cover;
          background: var(--surface-container-high);
        }

        .author-name {
          font-weight: 700;
          color: var(--on-surface);
        }

        .author-role {
          font-size: 0.875rem;
          color: var(--on-surface-variant);
        }

        /* CTA Section */
        .cta-section {
          padding: 8rem 2rem;
        }

        .cta-container {
          max-width: 64rem;
          margin: 0 auto;
          background: var(--primary);
          color: var(--on-primary);
          border-radius: 3rem;
          padding: 4rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.06);
        }

        @media (min-width: 768px) {
          .cta-container {
            padding: 4rem;
          }
        }

        .cta-content {
          position: relative;
          z-index: 10;
        }

        .cta-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .cta-title {
            font-size: 2.5rem;
          }
        }

        .cta-description {
          font-size: 1.25rem;
          opacity: 0.8;
          max-width: 32rem;
          margin: 0 auto 2rem;
        }

        .btn-cta {
          background: var(--primary-container);
          color: var(--on-primary-container);
          padding: 1.25rem 2.5rem;
          font-size: 1.125rem;
        }

        .btn-cta:hover {
          transform: scale(1.05);
        }

        .cta-background-decoration {
          position: absolute;
          inset: 0;
        }

        .cta-blur-circle {
          position: absolute;
          width: 16rem;
          height: 16rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          filter: blur(3rem);
        }

        .cta-blur-circle.top-right {
          top: -8rem;
          right: -8rem;
        }

        .cta-blur-circle.bottom-left {
          bottom: -8rem;
          left: -8rem;
        }

        /* Footer */
        .footer {
          padding: 3rem 2rem;
          background: var(--surface-container-low);
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .footer-container {
            flex-direction: row;
            justify-content: space-between;
          }
        }

        .footer-brand {
          text-align: center;
        }

        @media (min-width: 768px) {
          .footer-brand {
            text-align: left;
          }
        }

        .footer-brand-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--on-surface);
          margin-bottom: 1rem;
        }

        .footer-copyright {
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          line-height: 1.75;
          color: var(--on-surface-variant);
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 2rem;
        }

        .footer-link {
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          line-height: 1.75;
          color: var(--on-surface-variant);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .footer-link:hover {
          text-decoration: underline;
          text-decoration-color: var(--primary-container);
          text-underline-offset: 4px;
        }

        .footer-icons {
          display: flex;
          gap: 1rem;
        }

        .footer-icons .material-symbols-outlined {
          color: var(--primary);
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .footer-icons .material-symbols-outlined:hover {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default EmWellLandingPage;
