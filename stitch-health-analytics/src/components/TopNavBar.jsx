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
            <button className="h-10 w-10 overflow-hidden rounded-full border border-[#dde5d9] bg-white shadow-sm">
              <img
                alt="User avatar"
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              />
            </button>
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
