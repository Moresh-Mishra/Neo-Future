import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';

const HealthAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');

  const sleepData = [60, 80, 75, 90, 65, 85, 95];
  const biometricStats = [
    { label: 'Heart Rate Var.', value: '62 ms', change: '+4%', icon: 'pulse_alert', positive: true },
    { label: 'Respiration', value: '14 bpm', change: 'Stable', icon: 'air', positive: false },
    { label: 'Focus Score', value: '88/100', change: '+12%', icon: 'target', positive: true },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Manrope']">
      <TopNavBar activeTab="growth" />

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
            {/* Header & Filter */}
            <header className="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end md:gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface md:text-5xl">
                  Health Analytics
                </h1>
                <p className="max-w-lg text-sm text-on-surface-variant md:text-base">
                  Deep dive into your wellness journey. Understand the patterns that shape your mental sanctuary.
                </p>
              </div>
              <div className="flex w-fit rounded-full bg-surface-container-low p-1">
                {['Day', 'Week', 'Month'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range.toLowerCase())}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all sm:px-6 sm:text-sm ${
                      timeRange === range.toLowerCase()
                        ? 'bg-surface-container-lowest rounded-full text-sm font-semibold shadow-sm text-[#436745]'
                        : 'text-on-surface-variant hover:text-[#436745]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </header>

            {/* Bento Grid Dashboard */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
              {/* Mood Over Time (Large Chart) */}
              <section className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-4 md:col-span-8 md:rounded-[2rem] md:p-8">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-3 md:mb-12">
                  <div>
                    <h3 className="text-xl font-headline font-bold text-[#436745]">Mood Resilience</h3>
                    <p className="text-on-surface-variant text-sm">Average mood score: 7.4/10</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#436745]">
                    <span className="text-xs font-bold uppercase tracking-widest">Steady Growth</span>
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                  </div>
                </div>

                {/* Chart Visualization */}
                <div className="relative flex h-56 items-end justify-between gap-2 md:h-64 md:gap-4">
                  <div className="absolute inset-0 flex flex-col justify-between py-2 border-l border-outline-variant/20">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-full border-t border-dashed border-outline-variant/10"></div>
                    ))}
                  </div>
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path
                      d="M0,80 Q10,75 20,60 T40,65 T60,40 T80,45 T100,20"
                      fill="none"
                      stroke="url(#gradientMood)"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    <defs>
                      <linearGradient id="gradientMood" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#436745" />
                        <stop offset="100%" stopColor="#7DA47D" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute bottom-[-2rem] w-full flex justify-between text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Daily Activity (Small Bento) */}
              <section className="md:col-span-4 bg-[#dde5d9]/30 rounded-[1.5rem] p-4 flex flex-col justify-between md:rounded-[2rem] md:p-8">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[#436745]">directions_run</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold text-[#436745]">Active Minutes</h3>
                  <div className="text-4xl font-headline font-extrabold text-[#436745] mt-2">
                    420 <span className="text-sm font-medium text-[#436745]/60 uppercase">Min</span>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold text-[#436745]">
                    <span>Goal: 450 min</span>
                    <span>93%</span>
                  </div>
                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#7DA47D] rounded-full w-[93%]"></div>
                  </div>
                </div>
              </section>

              {/* Sleep Cycles (Bento) */}
              <section className="md:col-span-4 bg-surface-container-high rounded-[1.5rem] p-4 md:rounded-[2rem] md:p-8">
                <div className="flex items-center gap-3 mb-8">
                  <span className="material-symbols-outlined text-tertiary">bedtime</span>
                  <h3 className="text-lg font-headline font-bold text-tertiary">Sleep Quality</h3>
                </div>
                <div className="flex gap-2 h-40 items-end justify-between">
                  {sleepData.map((height, index) => (
                    <div
                      key={index}
                      className={`w-full rounded-t-lg ${
                        index === 6 ? 'bg-[#436745]/80' : index === 4 ? 'bg-[#436745]/60' : 'bg-[#7DA47D]/20'
                      }`}
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-tertiary font-bold text-2xl">7h 42m</p>
                  <p className="text-on-surface-variant text-xs font-medium mt-1">Weekly Average</p>
                </div>
              </section>

              {/* Insight Highlights (Wide Bento) */}
              <section className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm shadow-[#436745]/5 flex flex-col gap-5 md:flex-row md:gap-10 md:rounded-[2rem] md:p-10">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full">
                    <span className="material-symbols-outlined text-sm text-[#436745]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <span className="text-[10px] font-bold text-[#436745] uppercase tracking-widest">Mindful Correlation</span>
                  </div>
                  <h2 className="text-2xl font-headline font-extrabold text-[#436745] leading-tight md:text-3xl">
                    We noticed your mood improves on days you sleep more than 7 hours.
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    Your consistency in deep sleep stages during the early week correlates with 15% higher calmness
                    scores in your Thursday journal entries.
                  </p>
                  <button className="flex items-center gap-2 text-[#7DA47D] font-bold text-sm group">
                    Explore full correlation report
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
                <div className="w-full md:w-48 aspect-square rounded-3xl bg-surface-container overflow-hidden">
                  <img
                    alt="Serene nature abstraction"
                    className="w-full h-full object-cover opacity-80 mix-blend-multiply"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5Im8jblgaSnD0d0aSKLUiP11iBzSX-hGc1ANZUno_Rf6HNCZPbhIBa1Rgu3NiGbKnVo3qRAmZ5OTHMXDAcHjP3wOGoCxED9Efyk1_RTd866Os0ts7I8Vb48ycq6hwqyyDaED_Od6Sff2KWi1ffigvUzlTMfEmLUxqY6uhP73LJkyqP3VathPs0I9cN5VJKpSc89XrzxEiVDMCZ5yPev5_D7Yq_ZJeo7fKoQx4Pg3iIPZQOhlj_IBLqExtw333Ub6Tt0jjcpYCbaI"
                  />
                </div>
              </section>
            </div>

            {/* Deep Dive Metrics */}
            <section className="mt-10 md:mt-16">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
                <h2 className="text-2xl font-headline font-bold text-on-surface">Biometric Trends</h2>
                <button className="text-sm font-semibold text-[#7DA47D] hover:underline">View All Metrics</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {biometricStats.map((stat) => (
                  <div key={stat.label} className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-[#436745]">{stat.value}</p>
                    </div>
                    <div className={`${stat.positive ? 'text-[#436745]' : 'text-on-surface-variant'} text-right`}>
                      <p className="text-[10px] font-bold">{stat.change}</p>
                      <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HealthAnalytics;
