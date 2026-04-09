import React from 'react';

const navItems = [
  { name: 'Sanctuary', href: '#sanctuary', id: 'sanctuary', icon: 'spa' },
  { name: 'Growth', href: '#growth', id: 'growth', icon: 'energy_savings_leaf' },
  { name: 'Fitness', href: '#fitness', id: 'fitness', icon: 'fitness_center' },
  { name: 'Forums', href: '#forums', id: 'forums', icon: 'forum' },
];

const MobileBottomNav = ({ activeTab = 'sanctuary' }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant/10 bg-surface/90 px-4 py-3 backdrop-blur-xl md:hidden">
      {navItems.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <span className="text-[10px] font-semibold">{item.name}</span>
          </a>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;