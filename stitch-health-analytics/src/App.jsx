import React, { useEffect, useState } from 'react';
import {
  UserDashboard,
  HealthAnalytics,
  AICompanion,
  Recommendations,
  MentalWellbeing,
  FitnessSanctuary,
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
  };

  const screenToHash = {
    dashboard: '#sanctuary',
    analytics: '#growth',
    'ai-companion': '#ai-companion',
    recommendations: '#community',
    'mental-wellbeing': '#wellness',
    fitness: '#fitness',
  };

  const resolveScreenFromHash = () => hashToScreen[window.location.hash] || 'dashboard';

  const [currentScreen, setCurrentScreen] = useState(resolveScreenFromHash);

  useEffect(() => {
    // Keep UI in sync with the URL hash so anchor links switch screens.
    const handleHashChange = () => {
      setCurrentScreen(resolveScreenFromHash());
    };

    if (!window.location.hash) {
      window.location.hash = '#sanctuary';
    }

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateTo = (screen) => {
    const targetHash = screenToHash[screen] || '#dashboard';
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
