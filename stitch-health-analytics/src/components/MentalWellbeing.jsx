import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';
import heroForest from '../assets/background-forest.jpg';
import resourceBreathing from '../assets/process-journal.jpg';

const MentalWellbeing = () => {
  const [selectedMood, setSelectedMood] = useState(null);

  const moodOptions = [
    { emoji: '🧘', label: 'Calm' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '😐', label: 'Neutral' },
    { emoji: '😔', label: 'Low' },
    { emoji: '🌊', label: 'Fluid' },
  ];

  const meditationCategories = [
    {
      icon: 'energy_savings_leaf',
      title: 'Stress Relief',
      description: 'Release tension with focused breathing and muscle relaxation techniques.',
      sessions: '12 Sessions',
      bgColor: 'bg-[#dde5d9]',
      textColorClass: 'text-[#2f4b3a]',
      mutedTextClass: 'text-[#3e5b4a]',
    },
    {
      icon: 'bedtime',
      title: 'Better Sleep',
      description: 'Gentle soundscapes and narrations to guide you into restorative rest.',
      sessions: '8 Sessions',
      bgColor: 'bg-tertiary-container',
      textColorClass: 'text-[#2f4b3a]',
      mutedTextClass: 'text-[#3e5b4a]',
    },
    {
      icon: 'center_focus_strong',
      title: 'Focus',
      description: 'Sharpen your mind and eliminate distractions through presence.',
      sessions: '15 Sessions',
      bgColor: 'bg-[#dde5d9]',
      textColorClass: 'text-[#2f4b3a]',
      mutedTextClass: 'text-[#3e5b4a]',
    },
    {
      icon: 'bolt',
      title: 'Quick Reset',
      description: 'Short, powerful sessions for a mental refresh during your busy day.',
      sessions: '20 Sessions',
      bgColor: 'bg-secondary-fixed',
      textColorClass: 'text-[#22472f]',
      mutedTextClass: 'text-[#355a40]',
    },
  ];

  const resources = [
    {
      type: 'Article',
      title: 'The Science of Deep Breathing',
      description: 'Understanding how autonomic nervous system regulation affects your mental clarity.',
      image: resourceBreathing,
    },
    {
      type: 'Interactive',
      title: 'Box Breathing Visualizer',
      description: 'A simple tool to help you reset in high-stress moments with guided 4-count cycles.',
      isAnimated: true,
    },
    {
      type: 'Professional',
      title: 'Connect with licensed practitioners',
      description: 'Connect with licensed practitioners for personalized 1-on-1 support.',
      isCTA: true,
    },
  ];

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar activeTab="wellness" />

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-10 md:space-y-16">
            {/* Hero Section */}
            <section className="group relative h-[300px] overflow-hidden rounded-xl md:h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 to-transparent z-10"></div>
              <img
                alt="Serene forest"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={heroForest}
              />
              <div className="relative z-20 flex h-full max-w-2xl flex-col justify-center px-5 text-white md:px-12">
                <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#7DA47D] mb-4">Featured Session</span>
                <h1 className="mb-4 text-3xl font-headline font-extrabold leading-tight tracking-tight md:text-5xl">
                  Awakening the Inner Calm
                </h1>
                <p className="mb-6 text-sm font-body leading-relaxed text-slate-100/90 md:mb-8 md:text-lg">
                  A 15-minute journey through gentle mindfulness and deep resonance, designed to clear the morning haze.
                </p>
                <div className="flex flex-wrap items-center gap-3 md:gap-6">
                  <button className="group/play flex items-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#436745] shadow-xl shadow-black/20 transition-all hover:bg-[#f8faf3] md:gap-3 md:px-8 md:py-4">
                    <span
                      className="material-symbols-outlined text-2xl transition-transform group-hover/play:scale-110 md:text-3xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_circle
                    </span>
                    Start Meditation
                  </button>
                  <span className="text-xs font-medium text-slate-200 md:text-sm">15 min • Guided</span>
                </div>
              </div>
            </section>

            {/* Meditation Categories & Mood Log */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
              {/* Meditation Library */}
              <div className="md:col-span-8 space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface md:text-3xl">Explore Library</h2>
                    <p className="text-on-surface-variant font-body">Find the right frequency for your state of mind.</p>
                  </div>
                  <button className="text-[#7DA47D] font-semibold text-sm hover:underline">View All</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {meditationCategories.map((category, index) => (
                    <div
                      key={index}
                      className={`${category.bgColor} ${category.textColorClass} p-6 rounded-xl hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-[#7DA47D]/20`}
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                        style={{ color: 'currentColor' }}
                      >
                        <span className="material-symbols-outlined">{category.icon}</span>
                      </div>
                      <h3 className="text-xl font-headline font-bold mb-2">{category.title}</h3>
                      <p className={`text-sm mb-6 ${category.mutedTextClass}`}>{category.description}</p>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold uppercase tracking-widest ${category.mutedTextClass}`}>
                          {category.sessions}
                        </span>
                        <span className="material-symbols-outlined text-[#7DA47D] opacity-0 group-hover:opacity-100 transition-opacity">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood Logging Interface */}
              <div className="md:col-span-4 bg-white p-4 rounded-xl border border-[#7DA47D]/10 flex flex-col h-full shadow-sm md:p-8">
                <div className="mb-6 md:mb-8">
                  <h2 className="text-2xl font-headline font-bold mb-1">Check-in</h2>
                  <p className="text-sm text-on-surface-variant">How is your sanctuary today?</p>
                </div>

                <div className="mb-6 grid grid-cols-5 gap-2 md:mb-8 md:gap-3">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.label}
                      onClick={() => setSelectedMood(mood.label)}
                      className={`flex flex-col items-center gap-2 group ${
                        selectedMood === mood.label ? 'scale-105' : ''
                      }`}
                    >
                      <div
                        className={`w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-colors ${
                          selectedMood === mood.label ? 'bg-[#dde5d9]' : 'bg-surface-container hover:bg-[#dde5d9]'
                        }`}
                      >
                        {mood.emoji}
                      </div>
                      <span className="text-[10px] uppercase tracking-tighter font-bold text-on-surface-variant group-hover:text-[#436745]">
                        {mood.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mb-6 flex-1 md:mb-8">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 block">
                    Journal Notes
                  </label>
                  <textarea
                    className="w-full h-40 bg-surface-container text-[#243b2e] rounded-lg border-none p-4 text-sm focus:ring-2 focus:ring-[#7DA47D]/20 placeholder:text-[#5b6b60]"
                    placeholder="Type your thoughts here..."
                  />
                </div>

                <button className="w-full bg-[#436745] text-white py-4 rounded-full font-bold hover:bg-[#355a40] transition-all">
                  Save Reflection
                </button>
              </div>
            </section>

            {/* Supportive Resources Section */}
            <section className="space-y-6 md:space-y-8">
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface md:text-3xl">Supportive Resources</h2>
                <p className="text-on-surface-variant font-body">Curated guidance for your continuous growth.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-8">
                {resources.map((resource, index) => (
                  <div key={index} className="group cursor-pointer">
                    {resource.image && (
                      <div className="relative h-48 rounded-xl overflow-hidden mb-4">
                        <img
                          alt={resource.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={resource.image}
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[#436745]">
                            {resource.type}
                          </span>
                        </div>
                      </div>
                    )}
                    {resource.isAnimated && (
                      <div className="relative h-48 rounded-xl overflow-hidden mb-4 bg-[#dde5d9] flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-white/30 animate-pulse border-4 border-white/40 flex items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-[#22472f]">air</span>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-white/90 backdrop-blur text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest text-[#436745]">
                            {resource.type}
                          </span>
                        </div>
                      </div>
                    )}
                    {resource.isCTA && (
                      <div className="h-48 rounded-xl bg-surface-container-high p-8 flex flex-col justify-between border border-transparent hover:border-[#7DA47D]/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-error-container rounded-full flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-xl">support_agent</span>
                          </div>
                          <span className="text-sm font-bold uppercase tracking-widest text-on-surface">
                            Professional Care
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-4">
                            Connect with licensed practitioners for personalized 1-on-1 support.
                          </p>
                          <button className="text-[#7DA47D] font-bold text-sm flex items-center gap-2 group/btn">
                            View Help Contacts
                            <span
                              className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform"
                            >
                              open_in_new
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    {!resource.isCTA && !resource.isAnimated && (
                      <>
                        <h4 className="text-lg font-headline font-bold text-on-surface group-hover:text-[#7DA47D] transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{resource.description}</p>
                      </>
                    )}
                    {!resource.isCTA && resource.isAnimated && (
                      <>
                        <h4 className="text-lg font-headline font-bold text-on-surface group-hover:text-[#7DA47D] transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{resource.description}</p>
                      </>
                    )}
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

export default MentalWellbeing;
