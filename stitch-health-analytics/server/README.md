# Exercise Recommendation API Server (SQL Only)

Backend API for the AI-powered Exercise Recommendation System using Q-Learning (Reinforcement Learning).

**Note: This is a SQL-only implementation. MongoDB has been removed.**

## Features

- **Q-Learning Based Recommendations**: Personalized exercise recommendations that learn from user behavior
- **MySQL Integration**: Stores exercises, Q-tables, and user history
- **RESTful API**: Clean API endpoints for frontend integration

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=exercise_db

# Server Configuration
PORT=5000
```

### 3. Set Up MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source sql/schema.sql
```

### 4. Populate Exercises (Optional)

To fetch real exercises from ExerciseDB API, use the Python script from the original project:

```bash
cd ../../Exercise\ recomendation\ project/
python exercise_recommend.py
```

Or manually insert sample data:

```sql
USE exercise_db;

INSERT INTO exercises (exercise_id, name, body_part, target, equipment, difficulty, category) VALUES
('0001', 'Bodyweight Squat', 'legs', 'quadriceps', 'body weight', 'beginner', 'strength'),
('0002', 'Push-up', 'chest', 'pectorals', 'body weight', 'beginner', 'strength'),
('0003', 'Plank', 'core', 'abs', 'body weight', 'beginner', 'strength'),
('0004', 'Lunges', 'legs', 'quadriceps', 'body weight', 'intermediate', 'strength'),
('0005', 'Diamond Push-up', 'chest', 'pectorals', 'body weight', 'intermediate', 'strength'),
('0006', 'Mountain Climbers', 'core', 'abs', 'body weight', 'intermediate', 'cardio');
```

## Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Get Available Muscles
```
GET /api/exercises/muscles
Response: { "success": true, "muscles": ["abs", "pectorals", "quadriceps"] }
```

### Get Available Fitness Levels
```
GET /api/exercises/fitness-levels
Response: { "success": true, "levels": ["beginner", "intermediate", "expert"] }
```

### Get Exercises
```
GET /api/exercises?target=quadriceps&difficulty=beginner&limit=10
Response: { "success": true, "exercises": [...] }
```

### Get Q-Values
```
GET /api/q-values?userId=1&state=quadriceps_beginner
Response: { "success": true, "qValues": { "0001": 0.7, "0004": 0.5 }, "source": "User Q-table" }
```

### Select Exercise (ε-Greedy)
```
POST /api/select-exercise
Body: { "qValues": { "0001": 0.8, "0002": 0.6 } }
Response: { "success": true, "selectedExerciseId": "0001", "selectionType": "exploit" }
```

### Update Q-Table
```
POST /api/update-q-table
Body: {
  "userId": 1,
  "state": "quadriceps_beginner",
  "action": "0001",
  "reward": 2
}
Response: { "success": true, "oldQ": 0.5, "newQ": 0.6 }
```

### Get or Create User
```
POST /api/user
Body: { "userId": 1, "username": "john_doe", "name": "John Doe" }
Response: { "success": true, "user": { "user_id": 1, "name": "John Doe" }, "source": "created" }
```

### Get User History
```
GET /api/user/history?userId=1
Response: { "success": true, "history": [...] }
```

## Q-Learning Parameters

- **Alpha (Learning Rate)**: 0.1
- **Epsilon (Exploration Rate)**: 0.2
- **Reward (Completed)**: +2
- **Reward (Skipped)**: -1
- **Reward (Neutral)**: 0

## Database Schema

### users
```sql
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### exercises
```sql
CREATE TABLE exercises (
    exercise_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    body_part VARCHAR(100),
    target VARCHAR(100),
    equipment VARCHAR(100),
    difficulty VARCHAR(100),
    category VARCHAR(50),
    description TEXT,
    instruction TEXT,
    secondary_muscles TEXT,
    gif_path TEXT
);
```

### user_q_table
```sql
CREATE TABLE user_q_table (
    q_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    state VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL,
    q_value FLOAT DEFAULT 0.0,
    visit_count INT DEFAULT 0,
    last_updated TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_state_action (user_id, state, action)
);
```

### global_q_table
```sql
CREATE TABLE global_q_table (
    q_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    state VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL,
    q_value FLOAT DEFAULT 0.0,
    visit_count INT DEFAULT 0,
    last_updated TIMESTAMP,

    UNIQUE KEY unique_state_action (state, action)
);
```

### user_history
```sql
CREATE TABLE user_history (
    history_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    exercise_id VARCHAR(10) NOT NULL,
    workout_date DATE,
    completed BOOLEAN DEFAULT FALSE,
    feedback INT,
    reps_completed INT,
    sets_completed INT,
    duration_minutes DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
);
```

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL server is running: `net start MySQL`
- Check credentials in `.env`
- Verify database exists: `SHOW DATABASES LIKE 'exercise_db';`

### Port Already in Use
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Or change port in .env
PORT=5001
```

### Exercises Table Empty
```sql
USE exercise_db;
SELECT COUNT(*) FROM exercises;
-- If 0, run the Python fetcher or insert sample data manually
```
