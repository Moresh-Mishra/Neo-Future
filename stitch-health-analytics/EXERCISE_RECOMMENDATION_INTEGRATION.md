# Exercise Recommendation Integration Guide (SQL Only)

This document explains the integration of the AI-powered Exercise Recommendation system into the Stitch Health Analytics Fitness Sanctuary.

**Note: This is a SQL-only implementation. MongoDB has been removed.**

## Overview

The Exercise Recommendation system uses **Q-Learning (Reinforcement Learning)** to provide personalized workout recommendations. The system learns from user preferences and improves recommendations over time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Fitness Sanctuary UI                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          ExerciseRecommender Component                │   │
│  │  - Planning Phase (build workout)                     │   │
│  │  - Execution Phase (track completion)                 │   │
│  │  - Complete Phase (summary & rewards)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│                 Express.js Backend Server                    │
│  - /api/exercises/* - Exercise data                         │
│  - /api/q-values/* - Q-Learning state                       │
│  - /api/update-q-table - RL updates                         │
│  - /api/user/* - User management                            │
│  └──────────────────────────────────────────────────────┐   │
│  │                  MySQL Database                       │   │
│  │  - users table                                        │   │
│  │  - exercises table                                    │   │
│  │  - user_q_table (personalized)                        │   │
│  │  - global_q_table (community)                         │   │
│  │  - user_history                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## RL Pipeline

The system follows this reinforcement learning pipeline:

### 1. User → State
```
State = muscle_target + fitness_level
Example: "quadriceps_beginner"
```

### 2. State → Action (Exercise Selection)
```
ε-Greedy Strategy:
- Exploit (80%): Pick exercise with highest Q-value
- Explore (20%): Pick random exercise
```

### 3. Action → Reward
```
User completes exercise: +2
User skips exercise: -1
Neutral: 0
```

### 4. Reward → Update Q-Table
```
Q(s,a) = Q(s,a) + α × (reward - Q(s,a))

Where:
- α (alpha) = 0.1 (learning rate)
- Q(s,a) = Q-value for state s, action a
```

## Files Modified/Created

### Frontend (React)
```
stitch-health-analytics/src/
├── components/
│   ├── ExerciseRecommender.jsx    ← NEW: Main RL component
│   ├── FitnessSanctuary.jsx       ← MODIFIED: Added RL integration
│   └── index.js                   ← MODIFIED: Export ExerciseRecommender
```

### Backend (Node.js/Express)
```
stitch-health-analytics/server/
├── server.js                      ← NEW: API server (SQL only)
├── package.json                   ← NEW: Dependencies
├── .env                           ← NEW: Environment config
├── .env.example                   ← NEW: Environment template
└── sql/
    └── schema.sql                 ← NEW: Database schema
```

## How to Use

### For Users

1. **Navigate to Fitness** in the navbar
2. **Select your focus** (muscle groups) - pick up to 3
3. **Choose intensity** (beginner/intermediate/expert)
4. **Click "AI-Powered RL"** mode
5. **Generate Workout Plan** - system uses Q-Learning to recommend exercises
6. **Perform exercises** - mark each as complete or skip
7. **View summary** - Q-tables updated based on your performance

### For Developers

#### Running the Full Stack

```bash
# Terminal 1: Start Backend Server
cd stitch-health-analytics/server
npm install
npm start

# Terminal 2: Start Frontend
cd stitch-health-analytics
npm start
```

#### Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and tables
source server/sql/schema.sql

# Insert sample data (optional)
INSERT INTO exercises (exercise_id, name, target, difficulty) VALUES
('0001', 'Bodyweight Squat', 'quadriceps', 'beginner'),
('0002', 'Push-up', 'pectorals', 'beginner'),
('0003', 'Plank', 'abs', 'beginner');
```

#### Key Component Props

```jsx
<ExerciseRecommender
  selectedMuscles={['quadriceps', 'pectorals', 'abs']}
  fitnessLevel="beginner"
  onWorkoutComplete={(workoutPlan) => {
    console.log('Workout completed:', workoutPlan);
  }}
/>
```

#### API Usage Example

```javascript
// Get Q-values for a state
const response = await fetch('http://localhost:5000/api/q-values?userId=1&state=quadriceps_beginner');
const { qValues, source } = await response.json();

// Update Q-table after user feedback
await fetch('http://localhost:5000/api/update-q-table', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,  // Integer user ID
    state: 'quadriceps_beginner',
    action: '0001',
    reward: 2  // User completed exercise
  })
});
```

## Styling Consistency

The ExerciseRecommender component uses the same design system as Fitness Sanctuary:

- **Colors**: All CSS variables from `global.css`
- **Typography**: Manrope font family
- **Icons**: Material Symbols Outlined
- **Borders**: `border-outline-variant/25`, `border-primary/30`
- **Surfaces**: `surface-container-low`, `primary-container/10`
- **Radius**: `rounded-xl`, `rounded-2xl`, `rounded-full`

## Data Flow

### Planning Phase
1. User selects muscles and intensity
2. Frontend calls `/api/q-values` for each muscle
3. Backend fetches Q-values from user_q_table or global_q_table
4. Frontend calls `/api/select-exercise` with ε-greedy
5. Exercises displayed for user approval
6. User builds complete workout plan

### Execution Phase
1. User performs each exercise
2. User marks exercise as complete/skip
3. Frontend calls `/api/update-q-table` with reward
4. Backend updates both user_q_table and global_q_table
5. Backend records in user_history
6. Next exercise displayed

### Learning
- Q-values converge based on user preferences
- System learns which exercises user prefers for each muscle/difficulty
- Global Q-table aggregates learning across all users

## SQL Schema Reference

### users
- `user_id` INT PRIMARY KEY AUTO_INCREMENT
- `username` VARCHAR(100) UNIQUE
- `name` VARCHAR(255)
- `email` VARCHAR(255)

### exercises
- `exercise_id` VARCHAR(10) PRIMARY KEY
- `name` VARCHAR(255)
- `target` VARCHAR(100)
- `difficulty` VARCHAR(100)
- `gif_path` TEXT

### user_q_table
- `q_id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `user_id` INT (FK → users)
- `state` VARCHAR(100)
- `action` VARCHAR(10)
- `q_value` FLOAT
- `visit_count` INT

### global_q_table
- `q_id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `state` VARCHAR(100)
- `action` VARCHAR(10)
- `q_value` FLOAT
- `visit_count` INT

### user_history
- `history_id` BIGINT PRIMARY KEY AUTO_INCREMENT
- `user_id` INT (FK → users)
- `exercise_id` VARCHAR(10) (FK → exercises)
- `workout_date` DATE
- `completed` BOOLEAN
- `feedback` INT
- `reps_completed` INT
- `sets_completed` INT
- `duration_minutes` DECIMAL(5,2)

## Troubleshooting

### Backend not starting
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Check MySQL connection
mysql -u root -p -e "SELECT 1"
```

### Exercises not loading
```bash
# Verify exercises table has data
mysql -u root -p exercise_db -e "SELECT COUNT(*) FROM exercises"

# If empty, insert sample data
```

### Q-values always 0.5
- This is the default initialization value
- Q-values update after user completes/skips exercises
- Check `/api/update-q-table` is being called

### User ID Issues
- User IDs are now integers (not strings)
- User IDs are stored in localStorage
- First-time users are auto-created in the users table

## Future Enhancements

1. **Advanced State Construction**: Include time of day, day of week, user energy level
2. **Multi-Arm Bandit**: A/B test different recommendation strategies
3. **Progress Tracking**: Visualize strength gains over time
4. **Social Features**: Share workouts, compare global Q-tables
5. **Workout Templates**: Pre-built workout plans for common goals
