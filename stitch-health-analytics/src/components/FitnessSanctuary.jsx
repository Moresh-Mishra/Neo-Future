import React, { useState, useEffect } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';
import ExerciseRecommender from './ExerciseRecommender';
import RLWorkoutBuilder from './RLWorkoutBuilder';

const API_BASE_URL = 'http://localhost:5001/api';

const resolveGifUrl = (gifUrl, gifPath) => {
  const rawPath = gifUrl || (gifPath ? `/api/exercise_gifs/${gifPath.split('/').pop()}` : '');
  if (!rawPath) {
    return null;
  }

  try {
    return new URL(rawPath, API_BASE_URL).toString();
  } catch (error) {
    return rawPath;
  }
};

const FitnessSanctuary = () => {
  const [selectedFocus, setSelectedFocus] = useState('Legs');
  const [selectedIntensity, setSelectedIntensity] = useState('Gentle');
  const [enableRLRecommendation, setEnableRLRecommendation] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [todayWorkout, setTodayWorkout] = useState({
    day: 'Monday',
    dayName: 'Loading...',
    muscles: [],
    exercises: [],
    isRestDay: false,
    totalDuration: '0 mins',
    totalCalories: 0,
    difficulty: 'beginner'
  });
  const [loadingTodayWorkout, setLoadingTodayWorkout] = useState(true);

  // Fetch today's workout plan
  useEffect(() => {
    const fetchTodayWorkout = async () => {
      setLoadingTodayWorkout(true);
      try {
        const difficultyMap = {
          'Gentle': 'beginner',
          'Steady': 'intermediate',
          'Vigorous': 'expert'
        };
        const difficulty = difficultyMap[selectedIntensity] || 'beginner';
        
        console.log('Fetching workout for difficulty:', difficulty);
        const response = await fetch(`http://localhost:5001/api/workout/today?difficulty=${difficulty}`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('API Response:', data);

        if (data.success) {
          // Add random timing if not present
          if (data.totalDuration === 0 || !data.totalDuration) {
            data.totalDuration = `${Math.floor(Math.random() * 30) + 30} mins`;
            data.totalCalories = Math.floor(Math.random() * 200) + 150;
          }

          data.exercises = (data.exercises || []).map((exercise) => ({
            ...exercise,
            gifUrl: resolveGifUrl(exercise.gifUrl, exercise.gif_path),
          }));
          setTodayWorkout(data);
        } else {
          // Fallback data if API fails
          setTodayWorkout({
            day: 'Monday',
            dayName: 'Upper Body Focus',
            muscles: ['pectorals', 'delts', 'triceps'],
            exercises: [],
            isRestDay: false,
            totalDuration: `${Math.floor(Math.random() * 30) + 30} mins`,
            totalCalories: Math.floor(Math.random() * 200) + 150,
            difficulty: 'beginner'
          });
        }
      } catch (error) {
        console.error('Error fetching today\'s workout:', error);
        // Fallback data if fetch fails
        setTodayWorkout({
          day: 'Monday',
          dayName: 'Upper Body Focus',
          muscles: ['pectorals', 'delts', 'triceps'],
          exercises: [],
          isRestDay: false,
          totalDuration: `${Math.floor(Math.random() * 30) + 30} mins`,
          totalCalories: Math.floor(Math.random() * 200) + 150,
          difficulty: 'beginner'
        });
      } finally {
        setLoadingTodayWorkout(false);
      }
    };

    fetchTodayWorkout();
  }, [selectedIntensity]);

  const muscleGroups = [
    { name: 'Quads', icon: 'fitness_center', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_wGH_iiOxu-viBV9qS5_TFaFMZSvpCEQHxDc7rQNt6NMj1Y2F4tq4Az8o3F7VFKor-bK9JJXlNt43oV9fuuf2dhPVZSrJH1WTeXE4a_rIf-irWrB4pZoagJkHFNWeoEDnrmhuSnToY0C3MtpIkQYGMSASLhOoOrPse9K-OHnTHKCRVfRA37IaF26OBUXUrRfyNYkyEfOpV9vB_l-KHbmV_2YgYUzxLv1kF6SQFRgTOUAY-FWTcIPZPjSHr0zGiRdy8F_8HoCifE' },
    { name: 'Hamstrings', icon: 'fitness_center', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_wGH_iiOxu-viBV9qS5_TFaFMZSvpCEQHxDc7rQNt6NMj1Y2F4tq4Az8o3F7VFKor-bK9JJXlNt43oV9fuuf2dhPVZSrJH1WTeXE4a_rIf-irWrB4pZoagJkHFNWeoEDnrmhuSnToY0C3MtpIkQYGMSASLhOoOrPse9K-OHnTHKCRVfRA37IaF26OBUXUrRfyNYkyEfOpV9vB_l-KHbmV_2YgYUzxLv1kF6SQFRgTOUAY-FWTcIPZPjSHr0zGiRdy8F_8HoCifE' },
    { name: 'Pectorals', icon: 'pool', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFNJrHDC30HhXrWj72G3G4Jsb9vtS7fWaPzP3QvVCelXk2hIp5JeszE6ZcJ8soVidJ1IHaQTlQ1a0X-2HBmAc_8OHhhHNkYZqmq5ju9uzbQ7Budf5KN8qiYYghH3qxgrWY9xZCFkb1AZsTocuUh20XK28D7_vqxyAIiEWSDXUPOP6372aeYfWmZ9AmTEXLn2PVlIanGTa87f-GOeJhmboSuH2sSLG9rKYtE0SfYsjYSHFNHKAYWprGQqZlQNEWGdlw72ZBnP5UFIk' },
    { name: 'Abs', icon: 'self_improvement', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRwYol7GIGKa1YTSPFNoa5gNSolYPSUKG7inPmPv1vZ51wbXW-4ZfvDJEBa20Rj9rzFgkM7OWCNd8NC7KsT7TZ0pzBFBOG1zsfLuEnbCPTjWmaWzVIrwyR7Is8Z6SGxAOA-GkD1AXqlJ6sx6AzBUOIHsOA92BiCKq4Tc3SLYxyKl6nh0ixgPwL0ljRLtNgQ1YQPxuchDeIj0qbA9QsYUquyt2UPpsm3G2DPpnWo2kdn1BkdLEUimfDK4-PsQINRG8NPg' },
    { name: 'Lats', icon: 'eco', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-WDAs_zkgqIHLb-cuc1uIMylKrnR1NtifKqxfksTmOW2Q1N6GOl1Nkr90GHfLtSitGV9cS2YgSUj1J_LbrLXQZmRqoHEhM8649USvsJdbdzf3VPLLEYi5BKamKrGWFjNV7O1KNIRYZHfPuUgNB-qE9VPkl53SB6b1J20ZIi8YxCr4JsFQ-qIamF1NTguAaopZ12S9yCfUj1EH4-xmiTPYLva_w6-USdv3BAtRyu_avmfjgf6j33kO0KdyX2Ex8CRYsLipk2YzCu8' },
    { name: 'Delts', icon: 'nature_people', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhMQkRln7I1vA7aVIFS2u8-0KPQDmz-kPcg_MkAdRWcTXWz3Ehp8jvtwB2Pgu9kqqQyX-DrTMdI-un1A_PHLVPdnM-OSJWRfVyMEty17Hnbl1-gP3t33i7hP1oAtxyvKxDN5e89Vq5tdvuQUZS0dECqI64IqIahKMVaODSeiHIMCCVrLjjNDGlzEKve4gnaFF4pWxvZUsbJvEVUB56Qyp-OkhgiqcIMhftyPLQsm7EWTIUo26lz9aaI0pY3MOSqTDmPG3sO3HTvYk' },
    { name: 'Triceps', icon: 'bolt', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCf1OowzTwsw-L0b3dKWGIHXIfrUXfrtbqMR49YLSteu9i2t4SqU1y-es8NdGFNmHEOJfeSmIcLFD5Vdfatrjttxbqn7CD5zE_Rf4x7ryKF-zMaD6DOVdTyfCPa40GNadGeadyw2qIw4cXXVOyHsPlKNwal3qoO9Z49NsPMpQ4NI7YBQc1keXlpaJNm9DRxiNGbPCtnRRCRFYISL-QPifRuIAQJWR7emKl4Dh9A2PItPvxnWo2kdn1BkdLEUimfDK4-PsQINRG8NPg' },
    { name: 'Biceps', icon: 'fitness_center', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCf1OowzTwsw-L0b3dKWGIHXIfrUXfrtbqMR49YLSteu9i2t4SqU1y-es8NdGFNmHEOJfeSmIcLFD5Vdfatrjttxbqn7CD5zE_Rf4x7ryKF-zMaD6DOVdTyfCPa40GNadGeadyw2qIw4cXXVOyHsPlKNwal3qoO9Z49NsPMpQ4NI7YBQc1keXlpaJNm9DRxiNGbPCtnRRCRFYISL-QPifRuIAQJWR7emKl4Dh9A2PItPvxnWo2kdn1BkdLEUimfDK4-PsQINRG8NPg' },
    { name: 'Upper Back', icon: 'eco', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-WDAs_zkgqIHLb-cuc1uIMylKrnR1NtifKqxfksTmOW2Q1N6GOl1Nkr90GHfLtSitGV9cS2YgSUj1J_LbrLXQZmRqoHEhM8649USvsJdbdzf3VPLLEYi5BKamKrGWFjNV7O1KNIRYZHfPuUgNB-qE9VPkl53SB6b1J20ZIi8YxCr4JsFQ-qIamF1NTguAaopZ12S9yCfUj1EH4-xmiTPYLva_w6-USdv3BAtRyu_avmfjgf6j33kO0KdyX2Ex8CRYsLipk2YzCu8' },
    { name: 'Glutes', icon: 'fitness_center', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAafatswgdg6s02rk2r4Auei51P1ZK3WvPEw5MKpDJKxOQbzKI794ElgxBdPyYoHbN9SJgsea0wunNKri4tnAqOHq_Hw9XmgP0t5wXGkjIaLkIf6M9ZQF3MN_7DYlQS3K5HehKLue7YdnfeS1bCepRZFdfjINSRL9Dz0Y8JPwlXmQ7uWyjIfYg80jheCerY5BtdVeRHYQXQ5WX5tHtkNBLS2iifwCPbS5KI0YMQVwW48DraGCpzJBkbGgPo79NVcfWkY9zytQ2to_o' },
  ];

  const intensityLevels = [
    { name: 'Gentle', label: 'Beginner', description: 'Focus on form, breathing, and steady foundation building.', icon: 'wb_sunny', color: 'bg-primary-container' },
    { name: 'Steady', label: 'Intermediate', description: 'Increase volume and complexity for consistent growth.', icon: 'trending_up', color: 'bg-secondary-container' },
    { name: 'Vigorous', label: 'Hardcore', description: 'High intensity pushing boundaries of endurance and power.', icon: 'local_fire_department', color: 'bg-error-container/20' },
  ];

  // Map muscle names to exercise database targets
  const muscleToTargetMap = {
    'Quads': 'quads',
    'Hamstrings': 'hamstrings',
    'Pectorals': 'pectorals',
    'Abs': 'abs',
    'Lats': 'lats',
    'Delts': 'delts',
    'Triceps': 'triceps',
    'Biceps': 'biceps',
    'Upper Back': 'upper back',
    'Glutes': 'glutes'
  };

  // Handle muscle selection for RL mode
  const toggleMuscleSelection = (muscleName) => {
    const targetMuscle = muscleToTargetMap[muscleName] || muscleName.toLowerCase();
    setSelectedMuscles(prev => {
      if (prev.includes(targetMuscle)) {
        return prev.filter(m => m !== targetMuscle);
      }
      if (prev.length >= 2) {
        return prev; // Max 2 muscles
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

  // Auto-enable RL recommendation when both muscles and difficulty are selected
  useEffect(() => {
    if (selectedMuscles.length > 0 && selectedIntensity) {
      setFitnessLevel(intensityToFitnessLevel[selectedIntensity]);
      setEnableRLRecommendation(true);
    } else {
      setEnableRLRecommendation(false);
    }
  }, [selectedMuscles, selectedIntensity]);

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

          {/* Step 1: Daily Workout Plan (Today's Generalized Schedule) */}
          <section className="space-y-6">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Section 01
              </span>
              <h2 className="text-3xl font-bold text-on-surface">Generalized Workout Plans</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Auto-generated daily workouts optimized for your fitness level
              </p>
            </div>

            {/* Difficulty Level Selector - Cards Grid */}
            <div className="space-y-4">
              <div>
                <label className="mb-3 block text-sm font-semibold text-on-surface">
                  Select Difficulty Level
                </label>
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
                          Choose <span className="material-symbols-outlined ml-1 text-[14px]">arrow_forward</span>
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Workout Plan - Generalized Weekly Schedule */}
            {loadingTodayWorkout && !todayWorkout.day ? (
              <div className="flex items-center justify-center rounded-2xl border border-outline-variant/25 bg-surface-container-low p-8">
                <p className="text-sm text-on-surface-variant">Loading today's workout...</p>
              </div>
            ) : (
              <div className="space-y-6 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 md:p-6">
                {/* Header with Day Info */}
                <div className="space-y-3 border-b border-outline-variant/20 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-wider text-primary">
                        {todayWorkout.day}
                      </p>
                      <h4 className="mt-1 text-xl font-bold text-on-surface">
                        {todayWorkout.dayName}
                      </h4>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {todayWorkout.isRestDay
                          ? 'Rest day - Focus on recovery and light stretching'
                          : `${todayWorkout.muscles.length} muscle groups • ${todayWorkout.difficulty} level`}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container">
                      <span className="material-symbols-outlined text-base text-primary">
                        {todayWorkout.isRestDay ? 'bedtime' : 'fitness_center'}
                      </span>
                    </div>
                  </div>

                  {/* Statistics */}
                  {!todayWorkout.isRestDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-primary-container/40 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Estimated Time
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary">{todayWorkout.totalDuration}</p>
                      </div>
                      <div className="rounded-lg bg-secondary-container/40 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Calories Burn
                        </p>
                        <p className="mt-1 text-sm font-bold text-secondary">~{todayWorkout.totalCalories} kcal</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rest Day Message */}
                {todayWorkout.isRestDay ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-primary-container">spa</span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        It's time to recover and rejuvenate
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Rest days are essential for muscle recovery and mental renewal. Enjoy light stretching or meditation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Exercises by Muscle Group */}
                    <div className="space-y-5">
                      {todayWorkout.muscles && todayWorkout.muscles.map((muscle, idx) => {
                        const muscleExercises = todayWorkout.exercises.filter(
                          ex => ex.muscleGroup === muscle
                        );

                        return (
                          <div key={idx} className="space-y-3">
                            {/* Muscle Group Subheading */}
                            <div className="flex items-center gap-2 px-1">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                                <span className="text-xs font-bold text-primary">✓</span>
                              </div>
                              <h5 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                                {muscle}
                              </h5>
                              <span className="text-[11px] font-semibold text-on-surface-variant">
                                {muscleExercises.length} exercise{muscleExercises.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Exercise Cards */}
                            <div className="space-y-3 pl-1">
                              {muscleExercises.map((exercise, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="group flex items-center gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-sm"
                                >
                                  {/* Exercise GIF/Image */}
                                  <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-md sm:block">
                                    <img
                                      alt={exercise.name}
                                      className="h-full w-full object-cover"
                                      src={exercise.gifUrl}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/100?text=Exercise';
                                      }}
                                    />
                                  </div>

                                  {/* Exercise Details */}
                                  <div className="flex-1 min-w-0">
                                    <h6 className="text-base font-semibold text-on-surface truncate">
                                      {exercise.name}
                                    </h6>
                                    <div className="mt-2 flex flex-wrap items-center gap-3">
                                      <span className="flex items-center text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined mr-1 text-sm">timer</span>
                                        {exercise.duration}
                                      </span>
                                      <span className="flex items-center text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined mr-1 text-sm">repeat</span>
                                        {exercise.sets}
                                      </span>
                                      <span className="flex items-center text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined mr-1 text-sm">local_fire_department</span>
                                        ~{exercise.caloriesBurn} kcal
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action Button */}
                                  <button 
                                    onClick={() => {
                                      setSelectedExercise(exercise);
                                      setShowExerciseModal(true);
                                    }}
                                    className="shrink-0 rounded-full p-2 text-primary transition-colors hover:bg-primary-container/60 hover:text-primary-dim"
                                    title="View instructions"
                                  >
                                    <span className="material-symbols-outlined text-lg">info</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Start Workout Button */}
                    <div className="flex flex-col gap-3 border-t border-outline-variant/20 pt-4 sm:flex-row sm:items-center sm:justify-end">
                      <button className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:bg-primary-dim active:scale-95 sm:w-auto">
                        Start Workout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Create Your Own Workout Plan */}
          <section className="space-y-8 min-h-screen md:min-h-[800px]">
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                Section 02
              </span>
              <h2 className="text-3xl font-bold text-on-surface">Create Your Own Workout Plan</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Customize your workout by selecting focus areas and intensity level
              </p>
            </div>

            {/* Step 2A: Select Your Focus */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-on-surface">Step 1: Select Focus Areas</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Choose up to 2 muscle groups to target</p>
              </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
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
                  className={`group relative aspect-square overflow-hidden rounded-lg border border-outline-variant/40 bg-surface-container-low transition-all duration-300 hover:border-primary/50 ${
                    selectedFocus === muscle.name ? 'border-primary bg-primary-container/20' : ''
                  }`}
                >
                  <img
                    alt={`${muscle.name} workout`}
                    className="absolute inset-0 h-full w-full object-cover opacity-55 saturate-75 transition-opacity group-hover:opacity-70"
                    src={muscle.image}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f8faf3]/60 via-[#f8faf3]/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <h4 className="text-sm font-bold text-on-surface text-center">{muscle.name}</h4>
                  </div>
                  {selectedMuscles.includes(targetMuscle) && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <span className="material-symbols-outlined text-[13px] text-on-primary">check</span>
                    </div>
                  )}
                </button>
                );
              })}
            </div>
            </div>

            {/* Step 2B: Choose Intensity */}
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-semibold text-on-surface">Step 2: Choose Intensity Level</h3>
                <p className="mt-1 text-xs text-on-surface-variant">Select your workout difficulty or energy level</p>
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
            </div>

            {/* Step 3: Select Your Exercises */}
            <div className="border-t border-outline-variant/20 pt-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-on-surface">Step 3: Select Your Exercises</h3>
                    {selectedMuscles.length === 0 ? (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Select muscles and difficulty level above to choose your exercises
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-on-surface-variant">
                        Pick your exercises and start your workout
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
                    <span className="material-symbols-outlined text-base text-primary">fitness_center</span>
                  </div>
                </div>

                {selectedMuscles.length > 0 && selectedIntensity && (
                  <div className="rounded-2xl border border-primary/30 bg-primary-container/10 p-4 md:p-6">
                    <RLWorkoutBuilder
                      selectedMuscles={selectedMuscles}
                      fitnessLevel={intensityToFitnessLevel[selectedIntensity]}
                      onComplete={(result) => {
                        console.log('Workout completed:', result);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Exercise Instructions Modal */}
      {showExerciseModal && selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-low shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-outline-variant/25 bg-surface-container-low p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-on-surface">{selectedExercise.name}</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{selectedExercise.muscleGroup}</p>
                </div>
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-outline-variant/30 hover:text-on-surface"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 p-6">
              {/* Exercise Image/GIF */}
              {selectedExercise.gifUrl && (
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={selectedExercise.gifUrl}
                    alt={selectedExercise.name}
                    className="h-64 w-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Exercise+GIF';
                    }}
                  />
                </div>
              )}

              {/* Exercise Details */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(() => {
                  const duration = selectedExercise.duration || `${Math.floor(Math.random() * 15) + 5} mins`;
                  return (
                    <div className="rounded-lg bg-primary-container/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Duration
                      </p>
                      <p className="mt-1 font-semibold text-primary">{duration}</p>
                    </div>
                  );
                })()}
                {(() => {
                  const sets = selectedExercise.sets || `${Math.floor(Math.random() * 4) + 2} Sets / ${Math.floor(Math.random() * 10) + 8} Reps`;
                  return (
                    <div className="rounded-lg bg-secondary-container/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Sets/Reps
                      </p>
                      <p className="mt-1 font-semibold text-secondary">{sets}</p>
                    </div>
                  );
                })()}
                {(() => {
                  const calories = selectedExercise.caloriesBurn || Math.floor(Math.random() * 100) + 30;
                  return (
                    <div className="rounded-lg bg-error-container/20 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">
                        Calories
                      </p>
                      <p className="mt-1 font-semibold text-error">~{calories} kcal</p>
                    </div>
                  );
                })()}
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-on-surface">Instructions</h4>
                <div className="rounded-lg bg-surface-container-lowest p-4">
                  {(() => {
                    try {
                      if (!selectedExercise.instruction) {
                        return <p className="text-sm text-on-surface-variant italic">No instructions available</p>;
                      }
                      const instructions = typeof selectedExercise.instruction === 'string'
                        ? JSON.parse(selectedExercise.instruction)
                        : selectedExercise.instruction;
                      if (Array.isArray(instructions)) {
                        return (
                          <ol className="list-decimal list-inside space-y-2 text-sm text-on-surface">
                            {instructions.map((instr, idx) => (
                              <li key={idx} className="break-words">{instr}</li>
                            ))}
                          </ol>
                        );
                      }
                      return <p className="text-sm text-on-surface">{instructions}</p>;
                    } catch {
                      return <p className="text-sm text-on-surface">{selectedExercise.instruction}</p>;
                    }
                  })()}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowExerciseModal(false)}
                className="w-full rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary-dim active:scale-95"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default FitnessSanctuary;
