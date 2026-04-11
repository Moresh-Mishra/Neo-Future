import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5001/api';
const REWARD_COMPLETED = 2;
const REWARD_SKIPPED = -1;

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

const RLWorkoutBuilder = ({ selectedMuscles, fitnessLevel, onComplete }) => {
  const [currentPhase, setCurrentPhase] = useState('selection'); // selection, executing, complete
  const [currentMuscleIndex, setCurrentMuscleIndex] = useState(0);
  const [availableExercises, setAvailableExercises] = useState({});
  const [selectedExercises, setSelectedExercises] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [completionFeedback, setCompletionFeedback] = useState({});
  const [expandedMuscles, setExpandedMuscles] = useState({}); // Track which muscles have expanded view

  // Initialize user
  useEffect(() => {
    const initUser = () => {
      try {
        // Get authenticated user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.user_id) {
          setUserId(user.user_id);
          console.log('✓ Using authenticated user ID:', user.user_id);
        } else {
          console.warn('⚠️ No authenticated user found. User must be logged in.');
          setError('Please log in to access the fitness sanctuary.');
        }
      } catch (err) {
        console.error('Error retrieving user:', err);
        setError('Unable to retrieve user information.');
      }
    };
    initUser();
  }, []);

  // Fetch available exercises for each muscle
  useEffect(() => {
    if (selectedMuscles && selectedMuscles.length > 0) {
      fetchExercisesForMuscles();
    }
  }, [selectedMuscles, fitnessLevel]);

  const fetchExercisesForMuscles = async () => {
    setLoading(true);
    setError(null);
    try {
      const exercises = {};

      for (const muscle of selectedMuscles) {
        const res = await fetch(
          `${API_BASE_URL}/exercises?target=${encodeURIComponent(muscle)}&difficulty=${encodeURIComponent(fitnessLevel)}`
        );
        const data = await res.json();

        if (data.success && data.exercises) {
          const normalized = data.exercises.map((exercise) => ({
            ...exercise,
            gifUrl: resolveGifUrl(exercise.gifUrl, exercise.gif_path),
          }));
          // Take up to 5 exercises for selection
          exercises[muscle] = normalized.slice(0, 5);
        } else {
          exercises[muscle] = [];
        }
      }

      setAvailableExercises(exercises);

      // Initialize empty selections
      const initialSelections = {};
      for (const muscle of selectedMuscles) {
        initialSelections[muscle] = null;
      }
      setSelectedExercises(initialSelections);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const toggleViewAll = async (muscle) => {
    const isExpanded = expandedMuscles[muscle];
    
    if (!isExpanded) {
      // Fetch all exercises when expanding
      try {
        const res = await fetch(
          `${API_BASE_URL}/exercises?target=${encodeURIComponent(muscle)}&difficulty=${encodeURIComponent(fitnessLevel)}`
        );
        const data = await res.json();

        if (data.success && data.exercises) {
          const normalized = data.exercises.map((exercise) => ({
            ...exercise,
            gifUrl: resolveGifUrl(exercise.gifUrl, exercise.gif_path),
          }));
          setAvailableExercises(prev => ({
            ...prev,
            [muscle]: normalized // Show all exercises
          }));
        }
      } catch (err) {
        console.error('Error fetching all exercises:', err);
      }
    } else {
      // Collapse back to top 5
      try {
        const res = await fetch(
          `${API_BASE_URL}/exercises?target=${encodeURIComponent(muscle)}&difficulty=${encodeURIComponent(fitnessLevel)}`
        );
        const data = await res.json();

        if (data.success && data.exercises) {
          const normalized = data.exercises.map((exercise) => ({
            ...exercise,
            gifUrl: resolveGifUrl(exercise.gifUrl, exercise.gif_path),
          }));
          setAvailableExercises(prev => ({
            ...prev,
            [muscle]: normalized.slice(0, 5) // Show only top 5
          }));
        }
      } catch (err) {
        console.error('Error fetching exercises:', err);
      }
    }

    setExpandedMuscles(prev => ({
      ...prev,
      [muscle]: !isExpanded
    }));
  };

  const handleSelectExercise = (muscle, exercise) => {
    // Ensure exercise has duration, sets, and calories values
    const enrichedExercise = {
      ...exercise,
      duration: exercise.duration || `${Math.floor(Math.random() * 15) + 5} mins`,
      sets: exercise.sets || `${Math.floor(Math.random() * 4) + 2} Sets / ${Math.floor(Math.random() * 10) + 8} Reps`,
      caloriesBurn: exercise.caloriesBurn || Math.floor(Math.random() * 100) + 30
    };

    setSelectedExercises(prev => {
      const currentExercises = prev[muscle] || [];
      const isAlreadySelected = currentExercises.some(e => e.id === exercise.id);
      
      if (isAlreadySelected) {
        // Remove exercise if already selected
        return {
          ...prev,
          [muscle]: currentExercises.filter(e => e.id !== exercise.id)
        };
      } else if (currentExercises.length < 2) {
        // Add enriched exercise if less than 2 selected
        return {
          ...prev,
          [muscle]: [...currentExercises, enrichedExercise]
        };
      }
      // Can't add more than 2
      return prev;
    });
  };

  const canProceedToExecution = () => {
    // Check if at least one muscle has 2 exercises selected
    return selectedMuscles.some(muscle => 
      selectedExercises[muscle] && selectedExercises[muscle].length === 2
    );
  };

  const handleStartExecution = () => {
    if (canProceedToExecution()) {
      setCurrentPhase('executing');
      setCurrentMuscleIndex(0);
    }
  };

  const handleExerciseCompletion = async (completed) => {
    // Build flat exercise list on first execution
    if (!window.exerciseList) {
      const list = [];
      selectedMuscles.forEach(muscle => {
        if (selectedExercises[muscle] && selectedExercises[muscle].length > 0) {
          selectedExercises[muscle].forEach(exercise => {
            list.push({ muscle, exercise });
          });
        }
      });
      window.exerciseList = list;
    }

    const currentExerciseData = window.exerciseList[currentMuscleIndex];
    const { muscle, exercise } = currentExerciseData;

    if (exercise && userId) {
      const state = `${muscle}_${fitnessLevel}`;
      const reward = completed ? REWARD_COMPLETED : REWARD_SKIPPED;

      // Parse exercise metrics with proper type casting
      let repsCompleted = 0;
      let setsCompleted = 0;
      let durationMinutes = 0.00;
      let caloriesBurned = 0;

      if (completed) {
        // Only store values if exercise was completed
        if (exercise.sets) {
          const setsMatch = exercise.sets.match(/(\d+)\s*Sets\s*\/\s*(\d+)\s*Reps/i);
          if (setsMatch) {
            setsCompleted = parseInt(setsMatch[1], 10);
            repsCompleted = parseInt(setsMatch[2], 10);
          }
        }

        if (exercise.duration) {
          const durationMatch = exercise.duration.match(/(\d+)/);
          if (durationMatch) {
            durationMinutes = parseFloat(durationMatch[1]);
          }
        }

        if (exercise.caloriesBurn) {
          caloriesBurned = parseInt(exercise.caloriesBurn, 10);
        }
      }

      try {
        // Update Q-table
        await fetch(`${API_BASE_URL}/update-q-table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            state,
            action: exercise.id,
            reward
          })
        });

        // Save complete workout history with all metrics
        const historyResponse = await fetch(`${API_BASE_URL}/save-workout-history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            exerciseId: exercise.id,
            completed,
            repsCompleted,
            setsCompleted,
            durationMinutes,
            caloriesBurned,
            notes: completed 
              ? `Completed ${exercise.name} - ${caloriesBurned} calories burned` 
              : `Skipped ${exercise.name}`
          })
        });

        const historyData = await historyResponse.json();
        if (historyResponse.ok) {
          console.log('✓ Workout history saved:', historyData.data);
        } else {
          console.error('✗ Failed to save workout history:', historyData.error);
        }
      } catch (err) {
        console.error('Error updating Q-table or saving workout history:', err);
      }
    }

    setCompletionFeedback(prev => ({
      ...prev,
      [exercise?.id]: completed ? 'completed' : 'skipped'
    }));

    const nextExerciseIndex = currentMuscleIndex + 1;
    if (window.exerciseList && nextExerciseIndex < window.exerciseList.length) {
      setCurrentMuscleIndex(nextExerciseIndex);
    } else {
      setCurrentPhase('complete');
      delete window.exerciseList;
      if (onComplete) {
        onComplete({
          selectedExercises,
          completionFeedback
        });
      }
    }
  };

  // Phase 1: Selection phase
  if (currentPhase === 'selection') {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-primary-container/20 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <span className="material-symbols-outlined text-on-primary text-lg">hourglass_bottom</span>
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Loading exercises...</h4>
              <p className="text-sm text-on-surface-variant">Fetching available exercises for your muscles</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Instructions */}
        <div className="rounded-lg border border-secondary/30 bg-secondary-container/20 p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">info</span>
            <div>
              <h4 className="font-semibold text-on-surface text-sm">Select At Least 2 Exercises</h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Choose 2 exercises from at least one target muscle to build your workout
              </p>
            </div>
          </div>
        </div>

        {selectedMuscles.map((muscle, muscleIdx) => (
          <div key={muscle} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold capitalize text-on-surface">
                {muscle}
              </h4>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${selectedExercises[muscle]?.length === 2 ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {selectedExercises[muscle]?.length || 0} of 2 selected
                </span>
                <button
                  onClick={() => toggleViewAll(muscle)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    expandedMuscles[muscle]
                      ? 'bg-primary text-on-primary'
                      : 'bg-outline-variant/20 text-on-surface-variant hover:bg-outline-variant/30'
                  }`}
                  title={expandedMuscles[muscle] ? 'Show recommended only' : 'View all exercises'}
                >
                  {expandedMuscles[muscle] ? 'Show 5' : 'View All'}
                </button>
              </div>
            </div>

            {availableExercises[muscle]?.length > 0 ? (
              <div className="space-y-3">
                {availableExercises[muscle].map((exercise, idx) => {
                  const isSelected = selectedExercises[muscle]?.some(e => e.id === exercise.id);

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectExercise(muscle, exercise)}
                      className={`relative w-full text-left transition-all duration-300 rounded-lg border p-4 ${
                        isSelected
                          ? 'border-primary bg-primary-container/30'
                          : 'border-outline-variant/25 bg-surface-container-lowest hover:border-primary/50'
                      }`}
                    >
                      <div className="group flex items-center gap-4">
                        {exercise.gifUrl && (
                          <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-md sm:block">
                            <img
                              src={exercise.gifUrl}
                              alt={exercise.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/100?text=Exercise';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-base font-semibold text-on-surface truncate">{exercise.name}</h5>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {exercise.duration && (
                              <span className="flex items-center text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined mr-1 text-sm">timer</span>
                                {exercise.duration}
                              </span>
                            )}
                            {exercise.sets && (
                              <span className="flex items-center text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined mr-1 text-sm">repeat</span>
                                {exercise.sets}
                              </span>
                            )}
                            {exercise.caloriesBurn && (
                              <span className="flex items-center text-xs text-on-surface-variant">
                                <span className="material-symbols-outlined mr-1 text-sm">local_fire_department</span>
                                ~{exercise.caloriesBurn} kcal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExerciseDetail(exercise);
                              setShowExerciseModal(true);
                            }}
                            className="rounded-full p-2 text-primary transition-colors hover:bg-primary-container/60"
                            title="View details"
                          >
                            <span className="material-symbols-outlined text-lg">info</span>
                          </button>
                          {isSelected && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                              <span className="material-symbols-outlined text-sm text-on-primary">check</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-4">
                <p className="text-sm text-on-surface-variant">No exercises available for this muscle</p>
              </div>
            )}
          </div>
        ))}

        {/* Exercise Details Modal */}
        {showExerciseModal && selectedExerciseDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-surface-container-low shadow-2xl">
              <div className="sticky top-0 border-b border-outline-variant/25 bg-surface-container-low p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-on-surface">{selectedExerciseDetail.name}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant capitalize">{selectedExerciseDetail.target}</p>
                  </div>
                  <button
                    onClick={() => setShowExerciseModal(false)}
                    className="shrink-0 rounded-full p-2 text-on-surface-variant hover:bg-outline-variant/30"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <div className="space-y-6 p-6">
                {selectedExerciseDetail.gifUrl && (
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src={selectedExerciseDetail.gifUrl}
                      alt={selectedExerciseDetail.name}
                      className="h-64 w-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Exercise';
                      }}
                    />
                  </div>
                )}

                {/* Exercise Details Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {(() => {
                    const duration = selectedExerciseDetail.duration || `${Math.floor(Math.random() * 15) + 5} mins`;
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
                    const sets = selectedExerciseDetail.sets || `${Math.floor(Math.random() * 4) + 2} Sets / ${Math.floor(Math.random() * 10) + 8} Reps`;
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
                    const calories = selectedExerciseDetail.caloriesBurn || Math.floor(Math.random() * 100) + 30;
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

                <div className="space-y-3">
                  <h4 className="font-semibold text-on-surface">Instructions</h4>
                  <div className="rounded-lg bg-surface-container-lowest p-4">
                    {selectedExerciseDetail.instruction ? (
                      <p className="text-sm text-on-surface">{selectedExerciseDetail.instruction}</p>
                    ) : (
                      <p className="text-sm text-on-surface-variant italic">No instructions available</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-dim"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {canProceedToExecution() && (
          <button
            onClick={handleStartExecution}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-semibold text-on-primary transition-all hover:bg-primary-dim active:scale-95"
          >
            Start Workout
          </button>
        )}
      </div>
    );
  }

  // Phase 2: Execution phase
  if (currentPhase === 'executing') {
    // Build flat exercise list
    const exerciseList = [];
    selectedMuscles.forEach(muscle => {
      if (selectedExercises[muscle] && selectedExercises[muscle].length > 0) {
        selectedExercises[muscle].forEach(exercise => {
          exerciseList.push({ muscle, exercise });
        });
      }
    });

    const currentExerciseData = exerciseList[currentMuscleIndex];
    const { muscle, exercise } = currentExerciseData || {};

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary-container/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-on-surface">Workout In Progress</h4>
            <span className="text-xs font-semibold text-primary">
              {currentMuscleIndex + 1} of {exerciseList.length}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-outline-variant/30">
            <div
              className="bg-primary transition-all duration-300"
              style={{ width: `${((currentMuscleIndex + 1) / exerciseList.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-sm font-semibold capitalize text-on-surface">{muscle}</h5>

          {exercise && (
            <div className="rounded-lg border border-outline-variant/25 bg-surface-container-lowest p-4">
              <div className="mb-4">
                <h6 className="text-base font-semibold text-on-surface">{exercise.name}</h6>
                <p className="mt-1 text-xs text-on-surface-variant">{exercise.difficulty}</p>
              </div>

              {exercise.gifUrl && (
                <div className="mb-4 flex justify-center">
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="h-20 w-32 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x200?text=Exercise';
                    }}
                  />
                </div>
              )}

              {/* Exercise Details */}
              <div className="mb-4 space-y-2 rounded-lg bg-primary-container/10 p-3">
                {exercise.duration && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">timer</span>
                    <span>{exercise.duration}</span>
                  </div>
                )}
                {exercise.sets && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">repeat</span>
                    <span>{exercise.sets}</span>
                  </div>
                )}
                {exercise.caloriesBurn && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    <span>~{exercise.caloriesBurn} kcal</span>
                  </div>
                )}
              </div>

              {/* Target Muscle */}
              {exercise.target && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Target Muscle</h4>
                  <p className="text-xs text-on-surface-variant capitalize">{exercise.target}</p>
                </div>
              )}

              {/* Description */}
              {exercise.description && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Description</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{exercise.description}</p>
                </div>
              )}

              {/* Instructions */}
              {exercise.instruction && (
                <div className="mb-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Instructions</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{exercise.instruction}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleExerciseCompletion(true)}
                  className="flex-1 rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/30"
                >
                  <span className="material-symbols-outlined mr-1 text-sm align-middle">check_circle</span>
                  Completed
                </button>
                <button
                  onClick={() => handleExerciseCompletion(false)}
                  className="flex-1 rounded-full bg-error/20 px-4 py-2 text-xs font-semibold text-error hover:bg-error/30"
                >
                  <span className="material-symbols-outlined mr-1 text-sm align-middle">close</span>
                  Skipped
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phase 3: Completion
  if (currentPhase === 'complete') {
    const completedCount = Object.values(completionFeedback).filter(v => v === 'completed').length;
    
    // Calculate total exercises (2 per muscle group)
    let totalExercises = 0;
    selectedMuscles.forEach(muscle => {
      if (selectedExercises[muscle]) {
        totalExercises += selectedExercises[muscle].length;
      }
    });

    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-primary-container/30 p-6 text-center">
          <div className="mb-3 text-4xl">Workout Complete!</div>
          <h4 className="mb-2 font-bold text-on-surface">Great Work!</h4>
          <p className="text-sm text-on-surface-variant">
            {completedCount} of {totalExercises} exercises completed.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-primary-container/20 p-3 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Completed</p>
            <p className="text-xl font-bold text-primary">{completedCount}</p>
          </div>
          <div className="rounded-lg bg-error-container/20 p-3 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Skipped</p>
            <p className="text-xl font-bold text-error">{totalExercises - completedCount}</p>
          </div>
          <div className="rounded-lg bg-secondary-container/20 p-3 text-center">
            <p className="text-xs font-semibold text-on-surface-variant">Success Rate</p>
            <p className="text-xl font-bold text-secondary">{Math.round((completedCount / totalExercises) * 100)}%</p>
          </div>
        </div>

        <div className="border-t border-outline-variant/25 pt-4">
          <p className="text-xs text-on-surface-variant mb-3">
            Q-tables have been updated based on your performance. The system will improve its recommendations over time.
          </p>
          <button
            onClick={() => {
              setCurrentPhase('selection');
              setCurrentMuscleIndex(0);
              setCompletionFeedback({});
              window.location.reload();
            }}
            className="w-full rounded-full bg-primary/20 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/30"
          >
            Build Another Workout
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default RLWorkoutBuilder;
