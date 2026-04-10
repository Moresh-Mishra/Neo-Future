import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const defaultNavLinks = [
  { name: 'Home', href: '#sanctuary', id: 'sanctuary' },
  { name: 'Health', href: '#growth', id: 'growth' },
  { name: 'Avatar', href: '#forums', id: 'forums' },
  { name: 'Fitness', href: '#fitness', id: 'fitness' },
  { name: 'Wellness', href: '#wellness', id: 'wellness' },
  { name: 'Community', href: '#community', id: 'community' },
];

const mobileIcons = {
  sanctuary: 'spa',
  growth: 'energy_savings_leaf',
  community: 'groups',
  fitness: 'fitness_center',
  forums: 'forum',
  wellness: 'self_improvement',
};

const TopNavBar = ({ activeTab = 'sanctuary', links = defaultNavLinks }) => {
  const desktopNavRef = useRef(null);
  const desktopLinkRefs = useRef({});
  const isFirstIndicatorPaint = useRef(true);
  const [desktopIndicator, setDesktopIndicator] = useState({ left: 0, width: 0, visible: false });
  const [animateIndicator, setAnimateIndicator] = useState(false);
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu]);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    // Close menu
    setShowProfileMenu(false);
    
    // Redirect to login
    window.location.hash = '#login';
  };

  const updateDesktopIndicator = () => {
    const navElement = desktopNavRef.current;
    const activeElement = desktopLinkRefs.current[activeTab];

    if (!navElement || !activeElement) {
      setDesktopIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }

    setDesktopIndicator({
      left: activeElement.offsetLeft,
      width: activeElement.offsetWidth,
      visible: true,
    });
  };

  useLayoutEffect(() => {
    if (isFirstIndicatorPaint.current) {
      setAnimateIndicator(false);
    } else {
      setAnimateIndicator(true);
    }

    const raf = requestAnimationFrame(() => {
      updateDesktopIndicator();
      isFirstIndicatorPaint.current = false;
    });

    return () => cancelAnimationFrame(raf);
  }, [activeTab, links]);

  useEffect(() => {
    window.addEventListener('resize', updateDesktopIndicator);
    return () => window.removeEventListener('resize', updateDesktopIndicator);
  }, [activeTab]);

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#dde5d9]/70 bg-[#f8faf3]/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dde5d9] text-[#436745] shadow-sm">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                spa
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-semibold tracking-tight text-[#436745]">EmWell</div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-[#596158]">Your Friend</div>
            </div>
          </div>

          <div ref={desktopNavRef} className="relative hidden min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto rounded-full border border-[#dde5d9] bg-white/60 px-2 py-1 shadow-sm md:flex">
            <span
              className={`pointer-events-none absolute top-1/2 h-[calc(100%-0.5rem)] -translate-y-1/2 rounded-full bg-[#436745] shadow-sm ${animateIndicator ? 'transition-all duration-300 ease-out' : ''}`}
              style={{
                left: desktopIndicator.left,
                width: desktopIndicator.width,
                opacity: desktopIndicator.visible ? 1 : 0,
              }}
            />
            {links.map((link) => {
              const isActive = activeTab === link.id;

              return (
                <a
                  key={link.id}
                  href={link.href}
                  ref={(element) => {
                    if (element) {
                      desktopLinkRefs.current[link.id] = element;
                    }
                  }}
                  className={`relative z-10 shrink-0 rounded-full px-3 py-2 text-center text-xs font-medium tracking-tight transition-colors sm:px-4 sm:text-sm ${
                    isActive
                      ? 'text-[#f8faf3]'
                      : 'text-[#596158] hover:text-[#436745]'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#dde5d9] bg-white text-[#596158] shadow-sm transition-colors hover:text-[#436745] sm:flex">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>
            
            {/* Profile Button with Dropdown */}
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-10 w-10 flex items-center justify-center rounded-full border border-[#dde5d9] bg-white text-[#436745] shadow-sm transition-all hover:bg-[#f0f5ec]"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && user && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white border border-[#dde5d9] shadow-lg overflow-hidden z-50">
                  {/* User Info Section */}
                  <div className="p-4 bg-[#f8faf3] border-b border-[#dde5d9]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 rounded-full bg-[#dde5d9] flex items-center justify-center text-[#436745]">
                        <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#436745]">{user.name || 'User'}</p>
                      </div>
                    </div>
                    
                    {/* User Details */}
                    <div className="space-y-2 text-sm">
                      {user.email && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#596158] mt-0.5" style={{ fontVariationSettings: "'FILL' 0" }}>mail</span>
                          <span className="text-[#596158] break-all">{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-[16px] text-[#596158] mt-0.5" style={{ fontVariationSettings: "'FILL' 0" }}>phone</span>
                          <span className="text-[#596158]">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-sm font-medium text-[#e74c3c] hover:bg-[#fee] transition-colors flex items-center gap-2 justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-outline-variant/10 bg-surface/90 px-4 py-3 backdrop-blur-xl md:hidden">
        {links.map((link) => {
          const isActive = activeTab === link.id;

          return (
            <a
              key={link.id}
              href={link.href}
              className={`flex min-w-0 flex-col items-center gap-1 text-center ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{mobileIcons[link.id] || 'circle'}</span>
              <span className="text-[10px] font-semibold">{link.name}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
};

export default TopNavBar;
