import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5001/api';

const ExerciseRecommender = ({
  selectedMuscles = [],
  fitnessLevel = 'beginner',
  onWorkoutComplete
}) => {
  // State management
  const [userId, setUserId] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('planning'); // planning, execution, complete
  const [workoutPlan, setWorkoutPlan] = useState({});
  const [currentMuscleIndex, setCurrentMuscleIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [muscles, setMuscles] = useState([]);
  const [fitnessLevels, setFitnessLevels] = useState([]);
  const [selectionMode, setSelectionMode] = useState('rl'); // 'rl' or 'browse'
  const [showExerciseDetails, setShowExerciseDetails] = useState(null);

  // Initialize - fetch available muscles and levels
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [musclesRes, levelsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/exercises/muscles`),
          fetch(`${API_BASE_URL}/exercises/fitness-levels`)
        ]);

        const musclesData = await musclesRes.json();
        const levelsData = await levelsRes.json();

        if (musclesData.success) setMuscles(musclesData.muscles);
        if (levelsData.success) setFitnessLevels(levelsData.levels);
      } catch (err) {
        setError('Failed to load exercise data. Make sure the backend server is running.');
      }
    };

    fetchInitialData();
  }, []);

  // Generate or retrieve user ID (integer for SQL)
  const initializeUser = useCallback(async () => {
    try {
      const storedUserId = localStorage.getItem('exerciseUserId');
      if (storedUserId) {
        const userIdInt = parseInt(storedUserId, 10);
        if (!isNaN(userIdInt)) {
          setUserId(userIdInt);
          return userIdInt;
        }
      }

      // Generate a random integer user ID
      const newUserId = Math.floor(Math.random() * 1000000) + 1;
      localStorage.setItem('exerciseUserId', newUserId.toString());
      setUserId(newUserId);

      // Register user with backend
      await fetch(`${API_BASE_URL}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, name: 'Wellness User' })
      });

      return newUserId;
    } catch (err) {
      console.error('Error initializing user:', err);
      return null;
    }
  }, []);

  // Get Q-values for a state
  const getQValues = useCallback(async (state) => {
    try {
      const res = await fetch(`${API_BASE_URL}/q-values?userId=${userId}&state=${encodeURIComponent(state)}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error fetching Q-values:', err);
      return null;
    }
  }, [userId]);

  // Select exercise using ε-greedy
  const selectExercise = useCallback(async (qValues) => {
    try {
      const res = await fetch(`${API_BASE_URL}/select-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qValues })
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error selecting exercise:', err);
      return null;
    }
  }, []);

  // Update Q-tables with reward
  const updateQTable = useCallback(async (state, action, reward) => {
    try {
      await fetch(`${API_BASE_URL}/update-q-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, state, action, reward })
      });
    } catch (err) {
      console.error('Error updating Q-table:', err);
    }
  }, [userId]);

  // Fetch exercises for a target muscle
  const fetchExercisesForTarget = useCallback(async (target, difficulty = null) => {
    try {
      let url = `${API_BASE_URL}/exercises?target=${encodeURIComponent(target)}`;
      if (difficulty) {
        url += `&difficulty=${encodeURIComponent(difficulty)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.exercises : [];
    } catch (err) {
      console.error('Error fetching exercises:', err);
      return [];
    }
  }, []);

  // Build workout plan for a muscle group
  const buildMuscleWorkout = useCallback(async (muscle, mode = 'rl') => {
    const exercises = [];
    const state = `${muscle}_${fitnessLevel}`;

    if (mode === 'rl') {
      // RL Recommendation Mode
      const qData = await getQValues(state);
      if (!qData || !qData.qValues || Object.keys(qData.qValues).length === 0) {
        return [];
      }

      // Get 2 exercises using RL
      for (let i = 0; i < 2; i++) {
        const selection = await selectExercise(qData.qValues);
        if (!selection || !selection.selectedExerciseId) break;

        // Fetch the specific exercise details
        const allExercises = await fetchExercisesForTarget(muscle, fitnessLevel);
        const selectedExercise = allExercises.find(ex => ex.id === selection.selectedExerciseId);

        if (selectedExercise) {
          exercises.push(selectedExercise);
          // Remove from Q-values for next iteration
          delete qData.qValues[selection.selectedExerciseId];
        }
      }
    } else {
      // Browse Mode - get all exercises
      const allExercises = await fetchExercisesForTarget(muscle, fitnessLevel);
      return allExercises.slice(0, 6); // Return first 6 for browsing
    }

    return exercises;
  }, [fitnessLevel, getQValues, selectExercise, fetchExercisesForTarget]);

  // Start building workout plan
  const startWorkoutPlanning = useCallback(async () => {
    if (!selectedMuscles || selectedMuscles.length === 0) {
      setError('Please select at least one muscle group');
      return;
    }

    setLoading(true);
    setError(null);

    // Initialize user if not done
    const uid = userId || await initializeUser();
    if (!uid) {
      setError('Failed to initialize user');
      setLoading(false);
      return;
    }

    try {
      const plan = {};
      for (const muscle of selectedMuscles) {
        const exercises = await buildMuscleWorkout(muscle, selectionMode);
        plan[muscle] = exercises;
      }

      setWorkoutPlan(plan);
      setCurrentPhase('planning');
      setCurrentMuscleIndex(0);
      setCurrentExerciseIndex(0);
    } catch (err) {
      setError('Failed to build workout plan');
    } finally {
      setLoading(false);
    }
  }, [selectedMuscles, userId, initializeUser, buildMuscleWorkout, selectionMode]);

  // Add exercise to workout plan (planning phase)
  const addExerciseToPlan = useCallback((muscle, exercise) => {
    setWorkoutPlan(prev => {
      const updated = { ...prev };
      if (!updated[muscle]) updated[muscle] = [];
      updated[muscle] = [...updated[muscle], exercise];
      return updated;
    });
  }, []);

  // Remove exercise from plan
  const removeExerciseFromPlan = useCallback((muscle, exerciseId) => {
    setWorkoutPlan(prev => {
      const updated = { ...prev };
      if (updated[muscle]) {
        updated[muscle] = updated[muscle].filter(ex => ex.id !== exerciseId);
      }
      return updated;
    });
  }, []);

  // Handle exercise completion feedback (execution phase)
  const handleExerciseCompletion = useCallback(async (muscle, exercise, completed) => {
    const state = `${muscle}_${fitnessLevel}`;
    const reward = completed ? 2 : -1;

    // Update Q-tables
    await updateQTable(state, exercise.id, reward);

    // Move to next exercise
    const currentMuscleExercises = workoutPlan[muscle] || [];
    if (currentExerciseIndex < currentMuscleExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      // Move to next muscle
      if (currentMuscleIndex < selectedMuscles.length - 1) {
        setCurrentMuscleIndex(prev => prev + 1);
        setCurrentExerciseIndex(0);
      } else {
        // Workout complete
        setCurrentPhase('complete');
        if (onWorkoutComplete) {
          onWorkoutComplete(workoutPlan);
        }
      }
    }
  }, [currentExerciseIndex, currentMuscleIndex, selectedMuscles, workoutPlan, fitnessLevel, updateQTable, onWorkoutComplete]);

  // Start workout execution
  const startWorkoutExecution = useCallback(() => {
    setCurrentPhase('execution');
    setCurrentMuscleIndex(0);
    setCurrentExerciseIndex(0);
  }, []);

  // Reset workout
  const resetWorkout = useCallback(() => {
    setWorkoutPlan({});
    setCurrentPhase('planning');
    setCurrentMuscleIndex(0);
    setCurrentExerciseIndex(0);
    setShowExerciseDetails(null);
  }, []);

  // Get current exercise in execution phase
  const getCurrentExercise = useCallback(() => {
    if (currentPhase !== 'execution') return null;

    const currentMuscle = selectedMuscles[currentMuscleIndex];
    const exercises = workoutPlan[currentMuscle] || [];
    return exercises[currentExerciseIndex] || null;
  }, [currentPhase, currentMuscleIndex, currentExerciseIndex, selectedMuscles, workoutPlan]);

  // Render planning phase
  const renderPlanningPhase = () => {
    const totalExercises = Object.values(workoutPlan).flat().length;

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
          <h4 className="text-sm font-semibold text-on-surface mb-3">Your Workout Plan</h4>
          {selectedMuscles.map((muscle, idx) => (
            <div key={muscle} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {idx + 1}. {muscle}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {workoutPlan[muscle]?.length || 0} exercises
                </span>
              </div>
              {workoutPlan[muscle]?.map((exercise, exIdx) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2 mb-1"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">{exercise.name}</p>
                    <p className="text-xs text-on-surface-variant">{exercise.difficulty}</p>
                  </div>
                  <button
                    onClick={() => removeExerciseFromPlan(muscle, exercise.id)}
                    className="text-error hover:text-error-dim"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-outline-variant/25">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-on-surface">Total Exercises</span>
              <span className="text-sm font-semibold text-primary">{totalExercises}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={startWorkoutPlanning}
            disabled={loading}
            className="flex-1 rounded-full bg-secondary-container px-5 py-3 text-sm font-semibold text-on-secondary-container transition-colors hover:bg-secondary-container/80 disabled:opacity-50"
          >
            {loading ? 'Building Plan...' : 'Regenerate Plan'}
          </button>
          <button
            onClick={startWorkoutExecution}
            disabled={totalExercises === 0}
            className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim disabled:opacity-50"
          >
            Start Workout
          </button>
        </div>
      </div>
    );
  };

  // Render execution phase
  const renderExecutionPhase = () => {
    const currentExercise = getCurrentExercise();
    const currentMuscle = selectedMuscles[currentMuscleIndex];
    const currentMuscleExercises = workoutPlan[currentMuscle] || [];
    const progress = ((currentMuscleIndex * currentMuscleExercises.length + currentExerciseIndex) /
      (selectedMuscles.length * 2)) * 100;

    if (!currentExercise) {
      return (
        <div className="text-center py-8">
          <p className="text-on-surface-variant">No exercises to display</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-on-surface-variant">Workout Progress</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Exercise */}
        <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Muscle {currentMuscleIndex + 1} of {selectedMuscles.length}: {currentMuscle}
            </span>
            <span className="text-xs text-on-surface-variant">
              Exercise {currentExerciseIndex + 1} of {currentMuscleExercises.length}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {currentExercise.gif_path && (
              <div className="hidden sm:block h-24 w-24 overflow-hidden rounded-lg">
                <img
                  src={`/api/exercise_gifs/${currentExercise.gif_path.split('/').pop()}`}
                  alt={currentExercise.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/100?text=Exercise';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-on-surface mb-2">{currentExercise.name}</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center rounded-full bg-primary-container px-2.5 py-1 text-xs font-semibold text-on-primary-container">
                  <span className="material-symbols-outlined mr-1 text-xs">fitness_center</span>
                  {currentExercise.target}
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-1 text-xs font-semibold text-on-secondary-container">
                  <span className="material-symbols-outlined mr-1 text-xs">trending_up</span>
                  {currentExercise.difficulty}
                </span>
                {currentExercise.equipment && (
                  <span className="inline-flex items-center rounded-full bg-tertiary-container px-2.5 py-1 text-xs font-semibold text-on-tertiary-container">
                    <span className="material-symbols-outlined mr-1 text-xs">sports_gymnastics</span>
                    {currentExercise.equipment}
                  </span>
                )}
              </div>

              {currentExercise.instruction && (
                <div className="rounded-lg bg-surface-container-highest p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Instructions</p>
                  {(() => {
                    try {
                      const instructions = typeof currentExercise.instruction === 'string'
                        ? JSON.parse(currentExercise.instruction)
                        : currentExercise.instruction;
                      if (Array.isArray(instructions)) {
                        return (
                          <ol className="list-decimal list-inside space-y-1 text-sm text-on-surface">
                            {instructions.slice(0, 3).map((instr, idx) => (
                              <li key={idx}>{instr}</li>
                            ))}
                          </ol>
                        );
                      }
                    } catch {
                      return <p className="text-sm text-on-surface">{currentExercise.instruction}</p>;
                    }
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => handleExerciseCompletion(currentExercise, false)}
            className="flex-1 rounded-full bg-error-container/20 px-5 py-3 text-sm font-semibold text-error transition-colors hover:bg-error-container/30"
          >
            Skip Exercise
          </button>
          <button
            onClick={() => handleExerciseCompletion(currentExercise, true)}
            className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Complete
            </span>
          </button>
        </div>
      </div>
    );
  };

  // Render complete phase
  const renderCompletePhase = () => {
    const totalExercises = Object.values(workoutPlan).flat().length;

    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-container">
          <span className="material-symbols-outlined text-4xl text-primary">celebration</span>
        </div>

        <div>
          <h3 className="text-2xl font-semibold text-on-surface mb-2">Workout Complete!</h3>
          <p className="text-on-surface-variant">
            Great job! You've completed {totalExercises} exercises across {selectedMuscles.length} muscle groups.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-surface-container-low p-3">
            <p className="text-2xl font-semibold text-primary">{totalExercises}</p>
            <p className="text-xs text-on-surface-variant">Exercises</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3">
            <p className="text-2xl font-semibold text-secondary">{selectedMuscles.length}</p>
            <p className="text-xs text-on-surface-variant">Muscle Groups</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-3">
            <p className="text-2xl font-semibold text-tertiary">{fitnessLevel}</p>
            <p className="text-xs text-on-surface-variant">Level</p>
          </div>
        </div>

        <button
          onClick={resetWorkout}
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim"
        >
          Build New Workout
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-error-container/20 p-4 text-center">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex items-center gap-3">
            <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
            <p className="text-on-surface-variant">Building your personalized workout...</p>
          </div>
        </div>
      )}

      {/* Phase Content */}
      {!loading && (
        <>
          {currentPhase === 'planning' && Object.keys(workoutPlan).length > 0 && renderPlanningPhase()}
          {currentPhase === 'execution' && renderExecutionPhase()}
          {currentPhase === 'complete' && renderCompletePhase()}
        </>
      )}

      {/* Initial State - No Plan Yet */}
      {!loading && currentPhase === 'planning' && Object.keys(workoutPlan).length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">fitness_center</span>
          <p className="text-on-surface-variant mb-4">Ready to build your personalized workout plan</p>
          <button
            onClick={startWorkoutPlanning}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-dim"
          >
            Generate Workout Plan
          </button>
        </div>
      )}
    </div>
  );
};

export default ExerciseRecommender;
