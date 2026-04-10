import React, { useState } from 'react';
import '../styles/emwell.css';

// Import local images
import backgroundForest from '../assets/background-forest.jpg';

const API_URL = 'http://localhost:5000';

const LoginPage = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        onNavigate?.('daily-reflection');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Image */}
      <div className="login-background">
        <img src={backgroundForest} alt="Lush greenery" className="background-image" />
        <div className="background-overlay"></div>
      </div>

      {/* Centered Content */}
      <div className="login-content-wrapper">
        {/* Branding Section (Desktop) */}
        <div className="login-branding">
          <div className="branding-header">
            <span className="brand-name">EmWell</span>
          </div>
          <h1 className="branding-title">
            Return to your <br />
            <span className="branding-accent">natural state.</span>
          </h1>
          <p className="branding-description">
            Join our curated community focused on intentional living, mindful movement, and emotional clarity.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="login-card-header">
            <div className="mobile-branding">
              <span className="mobile-brand-name">EmWell</span>
            </div>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Continue your journey of growth.</p>
          </div>

          {/* Social Login Buttons */}
          <div className="social-login-grid">
            <button className="social-btn">
              <GoogleIcon />
              Google
            </button>
            <button className="social-btn">
              <AppleIcon />
              Apple
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <div className="divider-line"></div>
            <span className="divider-text">Or use email</span>
          </div>

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  placeholder="hello@sanctuary.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <span className="material-symbols-outlined input-icon">mail</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button type="button" className="password-toggle">
                  <span className="material-symbols-outlined">lock</span>
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkbox-label">Remember me</span>
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner">Signing in...</span>
              ) : (
                'Access Your Sanctuary'
              )}
            </button>
          </form>

          <p className="signup-prompt">
            New to EmWell?{' '}
            <a href="#" className="signup-link" onClick={(e) => { e.preventDefault(); onNavigate?.('signup'); }}>
              Sign Up
            </a>
          </p>

          {/* Privacy Notice */}
          <div className="privacy-notice">
            <span className="material-symbols-outlined filled-icon" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
            <p className="privacy-text">
              By accessing your sanctuary, you agree to our <a href="#" className="privacy-link">Terms</a> and{' '}
              <a href="#" className="privacy-link">Privacy Policy</a>. We treat your personal sanctuary with absolute respect.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow-x: hidden;
        }

        @media (min-width: 768px) {
          .login-page {
            padding: 2rem;
          }
        }

        /* Background */
        .login-background {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        .background-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(10%) brightness(0.85);
        }

        .background-overlay {
          position: absolute;
          inset: 0;
          background: var(--primary);
          mix-blend-mode: multiply;
          opacity: 0.2;
        }

        /* Content Wrapper */
        .login-content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 64rem;
          display: flex;
          flex-direction: column;
          gap: 3rem;
          align-items: center;
        }

        @media (min-width: 1024px) {
          .login-content-wrapper {
            flex-direction: row;
            align-items: flex-start;
            gap: 6rem;
          }
        }

        /* Branding Section */
        .login-branding {
          display: none;
          flex-direction: column;
          justify-content: center;
          max-width: 28rem;
          color: var(--surface);
        }

        @media (min-width: 1024px) {
          .login-branding {
            display: flex;
          }
        }

        .branding-header {
          margin-bottom: 3rem;
        }

        .brand-name {
          font-size: 1.875rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: var(--surface);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .branding-title {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: var(--surface);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 768px) {
          .branding-title {
            font-size: 3rem;
          }
        }

        .branding-accent {
          color: var(--primary-fixed);
          font-style: italic;
          font-weight: 500;
        }

        .branding-description {
          font-size: 1.125rem;
          color: var(--surface-container-low);
          line-height: 1.6;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* Login Card */
        .login-card {
          width: 100%;
          max-width: 28rem;
          background: rgba(248, 250, 243, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 4rem;
          padding: 2.5rem;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.1);
        }

        @media (min-width: 768px) {
          .login-card {
            padding: 2.5rem;
          }
        }

        .login-card-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .mobile-branding {
          display: block;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 1024px) {
          .mobile-branding {
            display: none;
          }
        }

        .mobile-brand-name {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: var(--on-surface);
        }

        .login-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--on-surface);
          margin-bottom: 0.5rem;
        }

        .login-subtitle {
          color: var(--on-surface-variant);
        }

        /* Social Login */
        .social-login-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 9999px;
          border: 1px solid rgba(117, 125, 115, 0.3);
          background: transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--on-surface);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .social-btn:hover {
          background: rgba(248, 250, 243, 0.5);
        }

        .social-btn svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* Divider */
        .divider {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .divider-line {
          position: absolute;
          width: 100%;
          height: 1px;
          background: rgba(117, 125, 115, 0.3);
        }

        .divider-text {
          position: relative;
          padding: 0 1rem;
          background: rgba(241, 245, 236, 0.9);
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--on-surface-variant);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .form-label {
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--on-surface-variant);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-left: 0.25rem;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.5);
          border: none;
          border-bottom: 2px solid rgba(117, 125, 115, 0.2);
          padding: 0.75rem 1rem;
          padding-right: 3rem;
          border-radius: 0.5rem 0.5rem 0 0;
          font-size: 1rem;
          color: var(--on-surface);
          transition: all 0.3s ease;
        }

        .form-input::placeholder {
          color: rgba(89, 97, 88, 0.4);
        }

        .form-input:focus {
          outline: none;
          border-bottom-color: var(--primary);
        }

        .input-icon {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.25rem;
          color: rgba(89, 97, 88, 0.4);
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: rgba(89, 97, 88, 0.6);
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: var(--primary);
        }

        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.5rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox {
          width: 1rem;
          height: 1rem;
          border-radius: 0.25rem;
          border: 1px solid rgba(117, 125, 115, 0.3);
          accent-color: var(--primary);
        }

        .checkbox-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--on-surface-variant);
          transition: color 0.2s ease;
        }

        .checkbox-wrapper:hover .checkbox-label {
          color: var(--on-surface);
        }

        .forgot-link {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }

        .forgot-link:hover {
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(145deg, #436745 0%, #375b3a 100%);
          color: var(--on-primary);
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.02em;
          border: none;
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0px 20px 40px rgba(45, 52, 44, 0.1);
          transition: all 0.3s ease;
          margin-top: 1.5rem;
        }

        .submit-btn:hover {
          opacity: 0.9;
        }

        .submit-btn:active {
          transform: scale(0.98);
        }

        .signup-prompt {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--on-surface-variant);
        }

        .signup-link {
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .signup-link:hover {
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        /* Privacy Notice */
        .privacy-notice {
          margin-top: 2rem;
          padding: 0.75rem;
          background: rgba(67, 103, 69, 0.05);
          border-radius: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .filled-icon {
          color: var(--primary);
          transform: scale(0.75);
          margin-top: 0.125rem;
        }

        .privacy-text {
          font-size: 0.6875rem;
          line-height: 1.5;
          color: var(--on-surface-variant);
        }

        .privacy-link {
          text-decoration: underline;
          font-weight: 600;
          color: inherit;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(234, 67, 67, 0.1);
          border: 1px solid rgba(234, 67, 67, 0.3);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #ba2626;
          margin-bottom: 1rem;
        }

        .error-message .material-symbols-outlined {
          font-size: 1.25rem;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

// Google Icon Component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
  </svg>
);

// Apple Icon Component
const AppleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.3 17.05 3.61 11.39 5.84 8.24c1.13-1.6 2.72-2.5 4.35-2.46 1.25.03 2.1.75 3.03.75.9 0 2.18-.88 3.65-.73 1.62.15 2.8.76 3.54 1.83-3.25 1.95-2.73 6.2.53 7.5-.7 1.8-1.63 3.56-2.89 5.15zM14.97 3.04c-.03 2.22-1.84 4.01-4.04 3.93.03-2.25 1.98-4.08 4.04-3.93z" fill="currentColor"></path>
  </svg>
);

export default LoginPage;
