import React from 'react';

const defaultNavItems = [
  { name: 'Dashboard', icon: 'dashboard', id: 'dashboard', href: '#dashboard' },
  { name: 'Analytics', icon: 'analytics', id: 'analytics', href: '#analytics' },
  { name: 'AI Companion', icon: 'forum', id: 'ai-companion', href: '#ai-companion' },
  { name: 'Fitness', icon: 'fitness_center', id: 'fitness', href: '#fitness' },
  { name: 'Community', icon: 'groups', id: 'community', href: '#community' },
];

const SideNavBar = ({
  activeItem = 'dashboard',
  items = defaultNavItems,
  title = 'Workspace',
  subtitle = 'Guide your wellness journey',
  ctaLabel = 'Begin Focus',
}) => {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-[#dde5d9] bg-[#f1f5ec]/95 pt-24 backdrop-blur-sm lg:flex lg:flex-col">
      <div className="px-6 pb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#436745]">{title}</p>
        <p className="mt-1 text-xs text-[#596158]">{subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 text-sm">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all duration-300 ${
              activeItem === item.id
                ? 'bg-[#dde5d9] text-[#436745] shadow-sm translate-x-1'
                : 'text-[#596158] hover:bg-[#dde5d9]/55 hover:text-[#436745] hover:translate-x-1'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: activeItem === item.id ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            {item.name}
          </a>
        ))}
      </nav>

      <div className="mt-auto p-6">
        <button className="w-full rounded-full bg-[#436745] px-4 py-3 font-semibold text-[#f8faf3] shadow-lg shadow-[#436745]/20 transition-colors hover:bg-[#355a40]">
          {ctaLabel}
        </button>
      </div>
    </aside>
  );
};

export default SideNavBar;
