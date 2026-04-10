import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';
import ExerciseRecommender from './ExerciseRecommender';

const FitnessSanctuary = () => {
  const [selectedFocus, setSelectedFocus] = useState('Legs');
  const [selectedIntensity, setSelectedIntensity] = useState('Gentle');
  const [enableRLRecommendation, setEnableRLRecommendation] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [fitnessLevel, setFitnessLevel] = useState('beginner');

  const muscleGroups = [
    { name: 'Legs', icon: 'fitness_center', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_wGH_iiOxu-viBV9qS5_TFaFMZSvpCEQHxDc7rQNt6NMj1Y2F4tq4Az8o3F7VFKor-bK9JJXlNt43oV9fuuf2dhPVZSrJH1WTeXE4a_rIf-irWrB4pZoagJkHFNWeoEDnrmhuSnToY0C3MtpIkQYGMSASLhOoOrPse9K-OHnTHKCRVfRA37IaF26OBUXUrRfyNYkyEfOpV9vB_l-KHbmV_2YgYUzxLv1kF6SQFRgTOUAY-FWTcIPZPjSHr0zGiRdy8F_8HoCifE', selected: true },
    { name: 'Chest', icon: 'pool', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFNJrHDC30HhXrWj72G3G4Jsb9vtS7fWaPzP3QvVCelXk2hIp5JeszE6ZcJ8soVidJ1IHaQTlQ1a0X-2HBmAc_8OHhhHNkYZqmq5ju9uzbQ7Budf5KN8qiYYghH3qxgrWY9xZCFkb1AZsTocuUh20XK28D7_vqxyAIiEWSDXUPOP6372aeYfWmZ9AmTEXLn2PVlIanGTa87f-GOeJhmboSuH2sSLG9rKYtE0SfYsjYSHFNHKAYWprGQqZlQNEWGdlw72ZBnP5UFIk', selected: false },
    { name: 'Core', icon: 'self_improvement', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRwYol7GIGKa1YTSPFNoa5gNSolYPSUKG7inPmPv1vZ51wbXW-4ZfvDJEBa20Rj9rzFgkM7OWCNd8NC7KsT7TZ0pzBFBOG1zsfLuEnbCPTjWmaWzVIrwyR7Is8Z6SGxAOA-GkD1AXqlJ6sx6AzBUOIHsOA92BiCKq4Tc3SLYxyKl6nh0ixgPwL0ljRLtNgQ1YQPxuchDeIj0qbA9QsYUquyt2UPpsm3G2DPpnWo2kdn1BkdLEUimfDK4-PsQINRG8NPg', selected: false },
    { name: 'Back', icon: 'eco', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-WDAs_zkgqIHLb-cuc1uIMylKrnR1NtifKqxfksTmOW2Q1N6GOl1Nkr90GHfLtSitGV9cS2YgSUj1J_LbrLXQZmRqoHEhM8649USvsJdbdzf3VPLLEYi5BKamKrGWFjNV7O1KNIRYZHfPuUgNB-qE9VPkl53SB6b1J20ZIi8YxCr4JsFQ-qIamF1NTguAaopZ12S9yCfUj1EH4-xmiTPYLva_w6-USdv3BAtRyu_avmfjgf6j33kO0KdyX2Ex8CRYsLipk2YzCu8', selected: false },
    { name: 'Shoulders', icon: 'nature_people', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhMQkRln7I1vA7aVIFS2u8-0KPQDmz-kPcg_MkAdRWcTXWz3Ehp8jvtwB2Pgu9kqqQyX-DrTMdI-un1A_PHLVPdnM-OSJWRfVyMEty17Hnbl1-gP3t33i7hP1oAtxyvKxDN5e89Vq5tdvuQUZS0dECqI64IqIahKMVaODSeiHIMCCVrLjjNDGlzEKve4gnaFF4pWxvZUsbJvEVUB56Qyp-OkhgiqcIMhftyPLQsm7EWTIUo26lz9aaI0pY3MOSqTDmPG3sO3HTvYk', selected: false },
    { name: 'Arms', icon: 'bolt', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCf1OowzTwsw-L0b3dKWGIHXIfrUXfrtbqMR49YLSteu9i2t4SqU1y-es8NdGFNmHEOJfeSmIcLFD5Vdfatrjttxbqn7CD5zE_Rf4x7ryKF-zMaD6DOVdTyfCPa40GNadGeadyw2qIw4cXXVOyHsPlKNwal3qoO9Z49NsPMpQ4NI7YBQc1keXlpaJNm9DRxiNGbPCtnRRCRFYISL-QPifRuIAQJWR7emKl4Dh9A2PItPvxnWo2kdn1BkdLEUimfDK4-PsQINRG8NPg', selected: false },
  ];

  const intensityLevels = [
    { name: 'Gentle', label: 'Beginner', description: 'Focus on form, breathing, and steady foundation building.', icon: 'wb_sunny', color: 'bg-primary-container' },
    { name: 'Steady', label: 'Intermediate', description: 'Increase volume and complexity for consistent growth.', icon: 'trending_up', color: 'bg-secondary-container' },
    { name: 'Vigorous', label: 'Hardcore', description: 'High intensity pushing boundaries of endurance and power.', icon: 'local_fire_department', color: 'bg-error-container/20' },
  ];

  // Map muscle names to exercise database targets
  const muscleToTargetMap = {
    'Legs': 'quadriceps',
    'Chest': 'pectorals',
    'Core': 'abs',
    'Back': 'lats',
    'Shoulders': 'delts',
    'Arms': 'biceps'
  };

  // Handle muscle selection for RL mode
  const toggleMuscleSelection = (muscleName) => {
    const targetMuscle = muscleToTargetMap[muscleName] || muscleName.toLowerCase();
    setSelectedMuscles(prev => {
      if (prev.includes(targetMuscle)) {
        return prev.filter(m => m !== targetMuscle);
      }
      if (prev.length >= 3) {
        return prev; // Max 3 muscles
      }
      return [...prev, targetMuscle];
    });
  };

  // Map intensity to fitness level
  const intensityToFitnessLevel = {
    'Gentle': 'beginner',
    'Steady': 'intermediate',
    'Vigorous': 'expert'
  };

  // Handle starting RL recommendation
  const handleStartRLRecommendation = () => {
    setFitnessLevel(intensityToFitnessLevel[selectedIntensity]);
    setEnableRLRecommendation(true);
  };

  // Handle workout completion
  const handleWorkoutComplete = (workoutPlan) => {
    console.log('Workout completed:', workoutPlan);
    // Can add additional logic here (e.g., show celebration, save to history)
  };

  const exercises = [
    {
      name: 'Bodyweight Squats',
      duration: '10 mins',
      sets: '3 Sets / 12 Reps',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxqCZBmWuUxtedyJz2Asy3KbcghnceWUf_qml3ZHz2m0cogBNnMK7Jbiapg1Q4Jq1i1zwS4tPBHqPzZMVPLrZnebfvOY2wUotJnu6ETi9zjiWnbG0iKNpdCJSkX8gVwHjmYrjxojMnqjDxAKYUGOJS_3A2_vP-KUNhrHmOQlJFvUJyeSmTdJkC5deT6AGZuWF9DE1KzaaC_tKSChBcH-ZvSN4lNABorXP7cdXjLoKcWJgxSM9EaoStkWzY7j42-vupmD0KSmZPvs',
    },
    {
      name: 'Wall Sits',
      duration: '5 mins',
      sets: '3 Sets / 45 Sec',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM3foPtu5FCZ-0cIUN7S_tHbfsyPPDUTlj4BefE4jkNEf99c6m1Z4LWgezKAJifn9-uecJek4fRxpE549_xUTUDvMUBLo-wjDp6ygiGHaSOEBuN7jLKFo5BMpgT8tIehyaU3N2PbweuaQwOzKuNvQEkEiyOz8P1AyJlBx8tWlTrP7j0OIlTMqmyasbaOlkJZHnk3nGtRWIztCCUFnognpnVGHJTZhCH6nifBKzvDOE4SRzCQgsHSwP5aI7Bjq_VrzvU7gYwM4ripc',
    },
    {
      name: 'Walking Lunges',
      duration: '12 mins',
      sets: '2 Sets / 20 Reps',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAafatswgdg6s02rk2r4Auei51P1ZK3WvPEw5MKpDJKxOQbzKI794ElgxBdPyYoHbN9SJgsea0wunNKri4tnAqOHq_Hw9XmgP0t5wXGkjIaLkIf6M9ZQF3MN_7DYlQS3K5HehKLue7YdnfeS1bCepRZFdfjINSRL9Dz0Y8JPwlXmQ7uWyjIfYg80jheCerY5BtdVeRHYQXQ5WX5tHtkNBLS2iifwCPbS5KI0YMQVwW48DraGCpzJBkbGgPo79NVcfWkY9zytQ2to_o',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-container">
      <TopNavBar
        activeTab="fitness"
      />

      <main className="min-h-screen px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl space-y-10">
          {/* Hero Introduction */}
          <section className="space-y-2">
            <h2 className="text-4xl font-semibold tracking-tight text-on-surface md:text-5xl">Fitness Sanctuary</h2>
            <p className="max-w-2xl text-sm text-on-surface-variant md:text-base">
              Sculpt your body with intentionality. Choose your focus and intensity to begin a practice tailored to your
              current energy.
            </p>
          </section>

          {/* Step 1: Select Your Focus */}
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Step 01
                </span>
                <h3 className="text-2xl font-semibold text-on-surface">Select Your Focus</h3>
              </div>
              <p className="text-xs text-on-surface-variant">Choose one or more areas to target</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {muscleGroups.map((muscle) => {
                const targetMuscle = muscleToTargetMap[muscle.name] || muscle.name.toLowerCase();
                const isSelectedForRL = selectedMuscles.includes(targetMuscle);
                return (
                <button
                  key={muscle.name}
                  onClick={() => {
                    setSelectedFocus(muscle.name);
                    toggleMuscleSelection(muscle.name);
                  }}
                  className={`group relative aspect-[1/1.12] overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low transition-all duration-300 hover:border-primary/50 ${
                    selectedFocus === muscle.name ? 'border-primary bg-primary-container/20' : ''
                  }`}
                >
                  <img
                    alt={`${muscle.name} workout`}
                    className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-75 transition-opacity group-hover:opacity-70"
                    src={muscle.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f8faf3]/95 via-[#f8faf3]/60 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-3">
                    <span
                      className="material-symbols-outlined mb-2 text-lg"
                      style={{ color: selectedFocus === muscle.name ? '#436745' : '' }}
                    >
                      {muscle.icon}
                    </span>
                    <h4 className="text-sm font-semibold text-on-surface">{muscle.name}</h4>
                    <p className="text-[11px] text-on-surface-variant">
                      {selectedFocus === muscle.name ? 'Selected' : 'Focus area'}
                    </p>
                  </div>
                  {selectedFocus === muscle.name && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <span className="material-symbols-outlined text-[13px] text-on-primary">check</span>
                    </div>
                  )}
                  {isSelectedForRL && enableRLRecommendation && (
                    <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
                      <span className="material-symbols-outlined text-[13px] text-on-secondary">auto_awesome</span>
                    </div>
                  )}
                </button>
                );
              })}
            </div>
          </section>

          {/* Step 2: Choose Intensity */}
          <section className="space-y-5">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Step 02
              </span>
              <h3 className="text-2xl font-semibold text-on-surface">Choose Intensity</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {intensityLevels.map((level) => (
                <button
                  key={level.name}
                  onClick={() => setSelectedIntensity(level.name)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                    selectedIntensity === level.name
                      ? 'border-primary bg-primary-container/55'
                      : 'border-outline-variant/40 bg-surface-container-low hover:border-primary/45'
                  }`}
                >
                  <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${selectedIntensity === level.name ? 'bg-primary' : 'bg-surface-container-high'}`}>
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ color: selectedIntensity === level.name ? '#e9ffe5' : '' }}
                    >
                      {level.icon}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-on-surface">{level.name}</h4>
                  <p className="mb-3 text-xs text-on-surface-variant">{level.description}</p>
                  <span className="inline-flex items-center text-[11px] font-semibold text-on-surface-variant">
                    {selectedIntensity === level.name ? (
                      <>
                        Selected <span className="material-symbols-outlined ml-1 text-[14px]">check_circle</span>
                      </>
                    ) : (
                      <>
                        Choose Path <span className="material-symbols-outlined ml-1 text-[14px]">arrow_forward</span>
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: Exercise Selection - RL Integration */}
          <section className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                  Step 03
                </span>
                <h3 className="text-2xl font-semibold text-on-surface">Exercise Selection</h3>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Choose your workout mode
                </p>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Classic Mode */}
              <button
                onClick={() => setEnableRLRecommendation(false)}
                className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                  !enableRLRecommendation
                    ? 'border-primary bg-primary-container/55'
                    : 'border-outline-variant/40 bg-surface-container-low hover:border-primary/45'
                }`}
              >
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${!enableRLRecommendation ? 'bg-primary' : 'bg-surface-container-high'}`}>
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: !enableRLRecommendation ? '#e9ffe5' : '' }}
                  >
                    fitness_center
                  </span>
                </div>
                <h4 className="text-base font-semibold text-on-surface">Classic Mode</h4>
                <p className="mb-3 text-xs text-on-surface-variant">
                  Browse exercises manually for {selectedFocus}
                </p>
                <span className="inline-flex items-center text-[11px] font-semibold text-on-surface-variant">
                  {!enableRLRecommendation ? (
                    <>
                      Selected <span className="material-symbols-outlined ml-1 text-[14px]">check_circle</span>
                    </>
                  ) : (
                    <>
                      Choose <span className="material-symbols-outlined ml-1 text-[14px]">arrow_forward</span>
                    </>
                  )}
                </span>
              </button>

              {/* AI-Powered RL Mode */}
              <button
                onClick={handleStartRLRecommendation}
                className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                  enableRLRecommendation
                    ? 'border-primary bg-primary-container/55'
                    : 'border-outline-variant/40 bg-surface-container-low hover:border-primary/45'
                }`}
              >
                <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-full ${enableRLRecommendation ? 'bg-primary' : 'bg-surface-container-high'}`}>
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ color: enableRLRecommendation ? '#e9ffe5' : '' }}
                  >
                    auto_awesome
                  </span>
                </div>
                <h4 className="text-base font-semibold text-on-surface">AI-Powered RL</h4>
                <p className="mb-3 text-xs text-on-surface-variant">
                  Personalized recommendations using Q-Learning
                </p>
                <span className="inline-flex items-center text-[11px] font-semibold text-on-surface-variant">
                  {enableRLRecommendation ? (
                    <>
                      Selected <span className="material-symbols-outlined ml-1 text-[14px]">check_circle</span>
                    </>
                  ) : (
                    <>
                      Choose <span className="material-symbols-outlined ml-1 text-[14px]">arrow_forward</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* RL Recommendation Component */}
            {enableRLRecommendation && (
              <div className="rounded-2xl border border-primary/30 bg-primary-container/10 p-4">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <span className="material-symbols-outlined text-base text-on-primary">psychology</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary">AI Exercise Recommendation</h4>
                    <p className="text-xs text-on-surface-variant">
                      Your workout will be personalized based on your selections using reinforcement learning.
                      The system learns from your preferences to improve future recommendations.
                    </p>
                  </div>
                </div>

                <ExerciseRecommender
                  selectedMuscles={selectedMuscles.length > 0 ? selectedMuscles : Object.values(muscleToTargetMap).slice(0, 3)}
                  fitnessLevel={fitnessLevel}
                  onWorkoutComplete={handleWorkoutComplete}
                />
              </div>
            )}

            {/* Classic Exercise List */}
            {!enableRLRecommendation && (
              <div className="space-y-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-3 md:p-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-3 transition-shadow duration-300 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="hidden h-10 w-10 overflow-hidden rounded-md sm:block">
                        <img
                          alt={exercise.name}
                          className="h-full w-full object-cover"
                          src={exercise.image}
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-on-surface">{exercise.name}</h5>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="flex items-center text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined mr-1 text-[12px]">timer</span> {exercise.duration}
                          </span>
                          <span className="flex items-center text-[11px] text-on-surface-variant">
                            <span className="material-symbols-outlined mr-1 text-[12px]">history</span> {exercise.sets}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="rounded-full p-2 text-primary transition-colors hover:bg-primary-container">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                ))}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-primary-container px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-primary-container">
                        Estimated Effort
                      </p>
                      <p className="text-sm font-semibold text-primary">27 Min</p>
                    </div>
                    <div className="rounded-xl bg-secondary-container px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-secondary-container">
                        Calories Burn
                      </p>
                      <p className="text-sm font-semibold text-secondary">~180 kcal</p>
                    </div>
                  </div>
                  <button className="w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim sm:w-auto">
                    Start Routine
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FitnessSanctuary;
