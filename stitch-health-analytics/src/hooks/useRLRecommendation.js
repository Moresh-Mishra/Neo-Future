import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api';
const REWARD_COMPLETED = 2;
const REWARD_SKIPPED = -1;

/**
 * Custom Hook for RL-based Exercise Recommendation
 * Implements epsilon-greedy selection and Q-table updates
 */
export const useRLRecommendation = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState({});

  // Initialize user on first mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const storedUserId = localStorage.getItem('exerciseUserId');
        if (storedUserId) {
          const userIdInt = parseInt(storedUserId, 10);
          if (!isNaN(userIdInt)) {
            setUserId(userIdInt);
            return;
          }
        }

        // Generate random user ID
        const newUserId = Math.floor(Math.random() * 1000000) + 1;
        localStorage.setItem('exerciseUserId', newUserId.toString());
        setUserId(newUserId);

        // Register user with backend
        await fetch(`${API_BASE_URL}/user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: newUserId, name: 'Wellness User' })
        }).catch(() => {}); // Non-critical

      } catch (err) {
        console.error('Error initializing user:', err);
      }
    };

    initUser();
  }, []);

  /**
   * Fetch Q-values for a given state (muscle_fitnessLevel)
   */
  const getQValues = useCallback(async (muscle, fitnessLevel) => {
    try {
      const state = `${muscle}_${fitnessLevel}`;
      const res = await fetch(`${API_BASE_URL}/q-values?userId=${userId}&state=${encodeURIComponent(state)}`);
      const data = await res.json();

      if (data.success) {
        return {
          state,
          qValues: data.qValues,
          availableExercises: data.availableExercises,
          source: data.source
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching Q-values:', err);
      return null;
    }
  }, [userId]);

  /**
   * Select best exercise using epsilon-greedy strategy
   */
  const selectBestExercise = useCallback(async (qValues) => {
    try {
      const res = await fetch(`${API_BASE_URL}/select-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qValues })
      });

      const data = await res.json();
      if (data.success) {
        return {
          selectedExerciseId: data.selectedExerciseId,
          selectionType: data.selectionType,
          bestExerciseId: data.bestExerciseId,
          bestQValue: data.bestQValue
        };
      }
      return null;
    } catch (err) {
      console.error('Error selecting exercise:', err);
      return null;
    }
  }, []);

  /**
   * Fetch full exercise details by ID
   */
  const fetchExercise = useCallback(async (exerciseId, target, difficulty) => {
    try {
      const res = await fetch(`${API_BASE_URL}/exercises?target=${encodeURIComponent(target)}&difficulty=${encodeURIComponent(difficulty)}`);
      const data = await res.json();

      if (data.success && data.exercises) {
        return data.exercises.find(ex => ex.id === exerciseId);
      }
      return null;
    } catch (err) {
      console.error('Error fetching exercise:', err);
      return null;
    }
  }, []);

  /**
   * Update Q-table after user completes or skips exercise
   */
  const updateQTable = useCallback(async (state, exerciseId, completed) => {
    try {
      const reward = completed ? REWARD_COMPLETED : REWARD_SKIPPED;

      const res = await fetch(`${API_BASE_URL}/update-q-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          state,
          action: exerciseId,
          reward
        })
      });

      const data = await res.json();
      if (data.success) {
        return {
          oldQ: data.oldQ,
          newQ: data.newQ,
          reward
        };
      }
      return null;
    } catch (err) {
      console.error('Error updating Q-table:', err);
      return null;
    }
  }, [userId]);

  /**
   * Build complete workout plan for selected muscles using RL
   * Returns: { muscle: [exercises], ... }
   */
  const buildWorkoutPlan = useCallback(async (selectedMuscles, fitnessLevel) => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) {
        setError('User not initialized');
        return null;
      }

      const plan = {};
      const exercisesPerMuscle = 2;

      for (const muscle of selectedMuscles) {
        plan[muscle] = [];

        // Get Q-values for this muscle
        const qData = await getQValues(muscle, fitnessLevel);
        if (!qData || !qData.qValues || Object.keys(qData.qValues).length === 0) {
          console.warn(`No exercises available for ${muscle}`);
          continue;
        }

        let remainingQValues = { ...qData.qValues };

        // Recommend 2 exercises for this muscle
        for (let i = 0; i < exercisesPerMuscle; i++) {
          if (Object.keys(remainingQValues).length === 0) break;

          // Select best exercise using epsilon-greedy
          const selection = await selectBestExercise(remainingQValues);
          if (!selection) break;

          const exerciseId = selection.selectedExerciseId;

          // Fetch exercise details
          const exercise = await fetchExercise(exerciseId, muscle, fitnessLevel);
          if (exercise) {
            plan[muscle].push({
              ...exercise,
              recommendedBy: selection.selectionType === 'explore' ? 'exploration' : 'exploitation',
              qValue: remainingQValues[exerciseId]
            });

            // Remove this exercise from future selections
            delete remainingQValues[exerciseId];
          }
        }
      }

      setWorkoutPlan(plan);
      return plan;
    } catch (err) {
      setError(err.message);
      console.error('Error building workout plan:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, getQValues, selectBestExercise, fetchExercise]);

  /**
   * Record exercise completion and update Q-tables
   */
  const recordCompletion = useCallback(async (muscle, exerciseId, completed) => {
    try {
      if (!userId) return null;

      const state = `${muscle}_${fitnessLevel}`;
      return await updateQTable(state, exerciseId, completed);
    } catch (err) {
      console.error('Error recording completion:', err);
      return null;
    }
  }, [userId, updateQTable]);

  return {
    userId,
    loading,
    error,
    workoutPlan,
    buildWorkoutPlan,
    recordCompletion,
    updateQTable
  };
};

export default useRLRecommendation;
