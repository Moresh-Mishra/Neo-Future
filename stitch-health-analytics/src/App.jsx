import React, { useEffect, useState } from 'react';
import {
  UserDashboard,
  HealthAnalytics,
  AICompanion,
  Recommendations,
  MentalWellbeing,
  FitnessSanctuary,
  EmWellLandingPage,
  LoginPage,
  SignUpPage,
} from './components';

// Simple router for demo purposes
const App = () => {
  const hashToScreen = {
    '#sanctuary': 'dashboard',
    '#dashboard': 'dashboard',
    '#growth': 'analytics',
    '#analytics': 'analytics',
    '#community': 'recommendations',
    '#recommendations': 'recommendations',
    '#forums': 'ai-companion',
    '#ai-companion': 'ai-companion',
    '#wellness': 'mental-wellbeing',
    '#mental-wellbeing': 'mental-wellbeing',
    '#mental-health': 'mental-wellbeing',
    '#fitness': 'fitness',
    '#emwell': 'emwell-landing',
    '#login': 'login',
    '#signup': 'signup',
  };

  const screenToHash = {
    dashboard: '#sanctuary',
    analytics: '#growth',
    'ai-companion': '#ai-companion',
    recommendations: '#community',
    'mental-wellbeing': '#wellness',
    fitness: '#fitness',
    'emwell-landing': '#emwell',
    login: '#login',
    signup: '#signup',
  };

  const resolveScreenFromHash = () => hashToScreen[window.location.hash] || 'emwell-landing';

  const [currentScreen, setCurrentScreen] = useState(resolveScreenFromHash);

  useEffect(() => {
    // Keep UI in sync with the URL hash so anchor links switch screens.
    const handleHashChange = () => {
      setCurrentScreen(resolveScreenFromHash());
    };

    if (!window.location.hash) {
      window.location.hash = '#emwell';
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (screen) => {
    const targetHash = screenToHash[screen] || '#emwell';
    if (window.location.hash === targetHash) {
      setCurrentScreen(screen);
      return;
    }
    window.location.hash = targetHash;
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <UserDashboard />;
      case 'analytics':
        return <HealthAnalytics />;
      case 'ai-companion':
        return <AICompanion />;
      case 'recommendations':
        return <Recommendations />;
      case 'mental-wellbeing':
        return <MentalWellbeing />;
      case 'fitness':
        return <FitnessSanctuary />;
      case 'emwell-landing':
        return <EmWellLandingPage onNavigate={navigateTo} />;
      case 'login':
        return <LoginPage onNavigate={navigateTo} />;
      case 'signup':
        return <SignUpPage onNavigate={navigateTo} />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
};

export default App;
