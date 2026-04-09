import React from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';

const Recommendations = () => {
  const nutritionalInsights = [
    {
      category: 'Brain Health',
      title: 'Walnut & Wild Berry Bowl',
      description: 'Rich in Omega-3s and antioxidants to support cognitive function and reduce morning inflammation.',
      time: '12 min',
      accentClass: 'bg-primary/10',
      labelClass: 'text-primary',
    },
    {
      category: 'Hydration',
      title: 'Cucumber & Mint Infusion',
      description: 'A gentle way to restore electrolytes and calm the digestive system before your afternoon tasks.',
      time: '5 min',
      accentClass: 'bg-secondary/10',
      labelClass: 'text-secondary',
    },
  ];

  const activities = [
    { title: 'Spinal Release Flow', duration: '15 min', intensity: 'Low Intensity', icon: 'yoga' },
    { title: 'Mindful Forest Walk', duration: '30 min', intensity: 'Medium Intensity', icon: 'nature_people' },
    { title: 'Evening Unwind Stretching', duration: '10 min', intensity: 'Gentle Intensity', icon: 'bedtime' },
  ];

  const lifestyleAdjustments = [
    {
      title: 'The Blue Light Embargo',
      description: 'Minimize screen exposure 90 minutes before sleep to stimulate natural melatonin production.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUZAefoNgRJZBeifQYE3_t3fZraHA7NGWUSGgO_jLshFUNVkUY1y5s6ZM3Og8msxjNfZsGEPeNOvIketjziW1CUQw0CQXuW5BGq3m5A1PPwxkdRZuuubCf7MiO9sWKmIhY0_rQ2nimkHzsjjr6EIvAtlwC_ikRpIpx3Ip4EVWdg9Hcd8uaVzDSbfGeHLNRavmSm9wrIvtB6F7uFTMn8hyd0dmbqkPPePwN-FC3c_-v_a48sPD5UojlYTfxsXdkhPaiAGg0X_GJ7iE',
    },
    {
      title: 'Ambient Oxygen Enrichment',
      description: 'Adding a Sansevieria plant to your workspace can naturally filter toxins and boost oxygen levels.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXebOzidumvh-H0csl_w4Sr3Ti4DcGRDh389LtBc18FDdRygi2lujviumjeCVw__RTCW5Ie5-CmzyBFInsPbLg6NEuCbJmygIzemtaqadrODdJ47MbFZItbB5WplUctlEW8-Pa9EMFFcT4HHoHTlmEm2vKymqPMJzqQ8cj2W2REWfP_XvLzKd3DItJsTgnd9uJsvvGkffENaYM_DSLOYcoV3lnR9L3YVHdRaE3JvZqnXUFtF8_4f0R8E37_OocmVytYUg_3CT2g5Y',
    },
    {
      title: 'Sunrise Reset Ritual',
      description: 'Spend 5 minutes in natural daylight upon waking to reset your circadian rhythm for better focus.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAB9Ekjc4PIaa1XA2XaDEbzNdD4Fg1CwZNp1Watrky3jqir-ftuqW4I-M28s70sc3TRLIXKVDQA8LXb_-QEEzHmeGbeAXm6WjYOgWYoXgYdOcsQkQLuATjpAOXVXX2mn7mJUe40M4vTxWZhWgQsn8qNaLdvlfO7pomaM1duzqKMJ-fFCAFFcwTHP_A21Gs6xmRbum6JTtb3s4v31tDXKmJzjIvzBlzZs8cq7Z2DSLzRuMdnmvf770AqAPVK16ZKOmMmRWiPq3qLlaE',
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-body text-on-background selection:bg-primary-container selection:text-on-primary-container">
      <TopNavBar activeTab="community" />

      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-7xl">
        {/* Hero Section */}
        <header className="mb-10 md:mb-16">
          <h1 className="mb-3 text-3xl font-headline font-extrabold tracking-tighter text-on-surface md:mb-4 md:text-5xl">
            Curated for your spirit.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-lg">
            Based on your recent focus on evening rest and mindful movement, we've tailored these paths for your
            sanctuary today.
          </p>
        </header>

        {/* Bento Grid: Recommendations */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
          {/* Nutritional Insights Section */}
          <section className="md:col-span-8 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-secondary">restaurant</span>
              <h2 className="font-headline text-xl font-bold md:text-2xl">Nutritional Insights</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
              {nutritionalInsights.map((item, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest rounded-lg p-4 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden border border-surface-container-high md:p-6"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${item.accentClass} rounded-full -mr-16 -mt-16 blur-3xl transition-colors group-hover:opacity-80`}></div>
                  <div className="flex flex-col h-full relative z-10">
                    <span className={`text-xs font-bold ${item.labelClass} tracking-widest uppercase mb-3`}>
                      {item.category}
                    </span>
                    <h3 className="font-headline text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-on-surface-variant text-sm mb-6 line-clamp-3">{item.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span> {item.time}
                      </span>
                      <button className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
                        Add to Daily Tasks <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dietary Tip - Full Width */}
            <div className="bg-surface-container-low rounded-lg p-4 flex flex-col md:flex-row items-center gap-5 border-none md:gap-8 md:p-8">
              <div className="w-full md:w-1/3">
                <img
                  alt="Fresh green salad with vibrant vegetables"
                  className="rounded-lg shadow-sm"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXukjHdlHYAIsrsU_VHULXwGmBu8yc-o8n8bKQLIsjqjfPArbNMVCj01eGeCtuPrDtMFdvZHefIwEgrEiD6xOhmKp9U8QoxvrEZt9mi3akeVzaxNMZmQWVTn3VJafvBkGsCnXWspsVAyEQ7JoqKLqWBRSJOdTKsMvx5BVLmVZ_g0ZVtt9Hj4rI3OMXC0bj4BPBDemt1HCKVqOCnDIIUvqq2h04oz5Tstem45rdtUPKkIzkUCiEvIeU05sPrLA9oi6-1AlKT4RyQLXp8"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full inline-block text-[10px] font-bold tracking-widest uppercase mb-4">
                  Pro Tip
                </div>
                <h3 className="mb-3 font-headline text-xl font-bold md:text-2xl">Mindful Chewing Ritual</h3>
                <p className="text-on-surface-variant text-md leading-relaxed mb-6">
                  Experience your food with all five senses. Chewing each bite 20 times improves nutrient absorption and
                  promotes a sense of grounding.
                </p>
                <button className="bg-primary-dim text-on-primary px-6 py-2 rounded-lg font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  Add to Daily Tasks
                </button>
              </div>
            </div>
          </section>

          {/* Activity & Movement Sidebar */}
          <section className="md:col-span-4 flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary">directions_run</span>
              <h2 className="font-headline text-xl font-bold md:text-2xl">Activity</h2>
            </div>
            <div className="flex flex-col gap-4">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest rounded-lg p-4 border border-surface-container-high transition-all hover:bg-primary-container/20 group md:p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-container p-3 rounded-lg group-hover:bg-white transition-colors">
                      <span className="material-symbols-outlined text-primary">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-headline font-bold text-on-surface">{activity.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {activity.duration} • {activity.intensity}
                      </p>
                      <button className="mt-4 text-primary text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        ADD TO TASKS <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lifestyle Adjustments - Wide Section */}
          <section className="md:col-span-12 mt-8">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-on-surface">auto_awesome</span>
              <h2 className="font-headline text-xl font-bold md:text-2xl">Lifestyle Adjustments</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-8">
              {lifestyleAdjustments.map((item, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <img
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg grayscale hover:grayscale-0 transition-all duration-500 shadow-sm"
                    src={item.image}
                  />
                  <div className="px-2">
                    <h3 className="font-headline font-bold text-xl mb-2">{item.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{item.description}</p>
                    <button className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                      Commit to task <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        </div>
      </main>

      <Footer />

      {/* FAB for Mobile */}
      <button className="fixed bottom-24 right-4 h-12 w-12 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-50 lg:hidden sm:bottom-8 sm:right-8 sm:h-14 sm:w-14">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
};

export default Recommendations;
