import React, { useState, useEffect } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';

const UserDashboard = () => {
  const [user, setUser] = useState(null);

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
  const moodData = [
    { day: 'Mon', value: 24, fill: 'bg-[#7DA47D]/40' },
    { day: 'Tue', value: 32, fill: 'bg-[#7DA47D]/40' },
    { day: 'Wed', value: 28, fill: 'bg-[#7DA47D]/60' },
    { day: 'Thu', value: 40, fill: 'bg-gradient-to-t from-[#436745] to-[#7DA47D]' },
    { day: 'Fri', value: 24, fill: 'bg-[#7DA47D]/40' },
    { day: 'Sat', value: 20, fill: 'bg-[#7DA47D]/30' },
    { day: 'Sun', value: 36, fill: 'bg-[#7DA47D]/50' },
  ];

  const healthStats = [
    { label: 'Sleep Quality', value: '82%', icon: 'bedtime', color: '#436745', progress: 82 },
    { label: 'Activity', value: '6,430 steps', icon: 'directions_run', color: '#7DA47D', progress: 64 },
    { label: 'Hydration', value: '1.2L / 2L', icon: 'water_drop', color: '#7DA47D', progress: 60 },
  ];

  const recommendations = [
    {
      category: 'Mental Health',
      title: '10-minute mindfulness',
      description: 'A gentle grounding practice to center your thoughts before the day begins.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiOWCsrCaWq7pqrmbLt1Tr9HqyRlvIfK_1uTLtPIzYUhw8oTyVquV_qaxLemDJ51KbiMgzaPCvr3OXTIzXGZchJKEU76l67L_t6c5MoJvEB9CLbrDAHbvpmbbJ9-xKeHScYjGPWSFGZCgvTGERicRRt6S_MZaqk1p8xZWUsK-1vorSsmfIFpmaUBt7e-VTQdwb-F4z_I-XFRgDGKlsoahR20IvIDmLXEUxlvtF8vqbxMwgSLr16ak_bWaOo5sLXje8oOfxJostkMU',
      action: 'Start Session',
      icon: 'play_circle',
    },
    {
      category: 'Nutrition',
      title: 'Nutrient-rich lunch idea',
      description: "The 'Sanctuary Bowl': Quinoa, roasted roots, and seasonal greens for sustained energy.",
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB00DT5lQ_F51LVzp_9PIy7Wxp3j4ZHLx49rLrn2M0J_J93BFG0oTN1qKM4NUyCP8L1m1gAhmvV45t70azeLjFFE_lbBYzREuqn1BJ-UEJWuIhZ8kRG23ALxttv2AmAiP-_gxP6D1ygxCP3LXSKsN1oDg4XHOnwpT8ldtyhyiG8uMAznzchcEDszWrE-D9MbnqE1UBD-Sr66IeHr7BSw1281tixF7eVDjdFDPJn9BkXKl_dWRGXmzP70OFQNkf65SxUVfngmUzN0Ng',
      action: 'View Recipe',
      icon: 'restaurant',
    },
    {
      category: 'Breathing',
      title: 'Breathing Meter',
      description: 'Take a 2-minute conscious breathing break to reset your nervous system.',
      isGradient: true,
      action: 'Begin Now',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Manrope']">
      <TopNavBar activeTab="sanctuary" />

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl">
          {/* Welcome Section */}
          <section className="mb-10 md:mb-14">
            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              Take a moment for yourself today, {user?.name || 'Guest'}.
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-lg">
              Welcome back to your sanctuary. Your personal wellness path is ready for exploration.
              Today is a great day to focus on mindful breathing and hydration.
            </p>
          </section>

          {/* Bento Grid Dashboard */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
            {/* Mood Tracker Card */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-stone-100 flex flex-col md:p-8">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
                <div>
                  <h2 className="mb-1 text-xl font-bold md:text-2xl">Weekly Resonance</h2>
                  <p className="text-sm text-on-surface-variant">Your emotional landscape over the last 7 days</p>
                </div>
                <div className="bg-primary-container text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                  Consistent Calm
                </div>
              </div>

              <div className="flex-1 min-h-[240px] relative flex items-end justify-between gap-2 pt-4">
                {moodData.map((item) => (
                  <div key={item.day} className="flex flex-col items-center gap-2 w-full">
                    <div className="w-full bg-primary-container/30 rounded-t-lg h-24 relative overflow-hidden">
                      <div className={`absolute bottom-0 w-full ${item.fill} transition-all`} style={{ height: `${item.value}px` }}></div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${item.day === 'Thu' ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Snapshot Card */}
            <div className="md:col-span-4 bg-surface-container-low rounded-xl p-4 flex flex-col gap-6 md:p-8 md:gap-8">
              <h2 className="text-xl font-bold">Vital Pulse</h2>
              <div className="flex flex-col gap-6">
                {healthStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <span className="material-symbols-outlined" style={{ color: stat.color }}>
                        {stat.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                          {stat.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: stat.color }}>
                          {stat.value}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                        <div className="h-full" style={{ background: stat.color, width: `${stat.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-auto bg-white/50 p-4 rounded-xl">
                <p className="text-xs leading-relaxed italic text-on-surface-variant">
                  "The rhythm of the body is the first step toward the harmony of the mind."
                </p>
              </div>
            </div>

            {/* Daily Recommendations Grid */}
            <div className="mt-2 md:col-span-12 md:mt-4">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
                <h2 className="text-2xl font-extrabold md:text-3xl">Nourish & Restore</h2>
                <button className="text-sm font-bold text-primary flex items-center gap-2 hover:underline">
                  View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-stone-100 ${
                      rec.isGradient
                        ? 'bg-gradient-to-br from-[#436745] to-[#7DA47D] p-6 text-white md:p-8'
                        : 'bg-surface-container-lowest p-5 md:p-6'
                    }`}
                  >
                    {!rec.isGradient && (
                      <div className="h-48 overflow-hidden mb-4">
                        <img
                          alt={rec.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={rec.image}
                        />
                      </div>
                    )}

                    {!rec.isGradient && (
                      <span className="text-[10px] font-bold bg-primary-container text-primary px-2 py-1 rounded uppercase tracking-widest">
                        {rec.category}
                      </span>
                    )}

                    {rec.isGradient && (
                      <>
                        <span className="material-symbols-outlined text-4xl mb-6">flare</span>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl"></div>
                      </>
                    )}

                    <h3 className={`text-xl font-bold mt-3 mb-2 ${rec.isGradient ? 'text-white' : ''}`}>
                      {rec.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${rec.isGradient ? 'text-white/90' : 'text-on-surface-variant'}`}>
                      {rec.description}
                    </p>

                    {rec.isGradient ? (
                      <>
                        <div className="w-full h-24 flex items-center justify-center my-6">
                          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                        <button className="w-full bg-white text-[#436745] py-3 rounded-full font-bold text-sm hover:bg-opacity-90 transition-all">
                          {rec.action}
                        </button>
                      </>
                    ) : (
                      <button className="mt-6 flex items-center gap-2 text-primary font-bold text-sm">
                        {rec.action} <span className="material-symbols-outlined text-sm">{rec.icon}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-10"></div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
