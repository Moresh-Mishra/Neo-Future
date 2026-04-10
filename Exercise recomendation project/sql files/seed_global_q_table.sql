-- ============================================================
-- SEED GLOBAL Q-TABLE - Initial Q-value Seeding
-- ============================================================
-- This script seeds the global_q_table with initial Q-values (0.5 = neutral)
-- for all state-action pairs across 3 fitness levels and 10 muscle targets
--
-- Schema: global_q_table (q_id, state, action, q_value, visit_count, last_updated)
-- Initial values: q_value=0.5 (neutral), visit_count=0 (no learning yet)
-- ============================================================

-- ============================================================
-- BEGINNER Fitness Level - Initial Seeding
-- ============================================================

-- For BEGINNER fitness level users - abs
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'abs_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'abs'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - lats
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'lats_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'lats'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - pectorals
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'pectorals_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'pectorals'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - glutes
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'glutes_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'glutes'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - quads
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'quads_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'quads'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - hamstrings
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'hamstrings_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'hamstrings'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - biceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'biceps_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'biceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - triceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'triceps_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'triceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - delts
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'delts_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'delts'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For BEGINNER fitness level users - upper back
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'upper_back_beginner' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'beginner' AND target = 'upper back'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- ============================================================
-- INTERMEDIATE Fitness Level
-- ============================================================

-- For INTERMEDIATE fitness level users - abs
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'abs_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'abs'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - lats
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'lats_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'lats'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - pectorals
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'pectorals_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'pectorals'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - glutes
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'glutes_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'glutes'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - quads
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'quads_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'quads'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - hamstrings
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'hamstrings_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'hamstrings'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - biceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'biceps_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'biceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - triceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'triceps_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'triceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - delts
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'delts_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'delts'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For INTERMEDIATE fitness level users - upper back
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'upper_back_intermediate' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'intermediate' AND target = 'upper back'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- ============================================================
-- HARDCORE Fitness Level
-- ============================================================

-- For HARDCORE fitness level users - abs
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'abs_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'abs'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - lats
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'lats_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'lats'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - pectorals
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'pectorals_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'pectorals'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - glutes
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'glutes_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'glutes'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - quads
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'quads_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'quads'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - hamstrings
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'hamstrings_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'hamstrings'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - biceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'biceps_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'biceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - triceps
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'triceps_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'triceps'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - delts
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'delts_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'delts'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

-- For HARDCORE fitness level users - upper back
INSERT INTO global_q_table (state, action, q_value, visit_count, last_updated)
SELECT 'upper_back_hardcore' as state, exercise_id, 0.5, 0, CURRENT_TIMESTAMP 
FROM exercises WHERE difficulty = 'hardcore' AND target = 'upper back'
ON DUPLICATE KEY UPDATE q_value=0.5, visit_count=0, last_updated=CURRENT_TIMESTAMP;

