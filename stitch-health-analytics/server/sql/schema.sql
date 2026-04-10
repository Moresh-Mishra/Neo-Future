-- Exercise Recommendation Database Schema (SQL Only - No MongoDB)

-- Create database
CREATE DATABASE IF NOT EXISTS exercise_db;
USE exercise_db;

-- Users table (referenced by other tables)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
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
    gif_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Q-table for personalized recommendations
CREATE TABLE IF NOT EXISTS user_q_table (
    q_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    state VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL,
    q_value FLOAT DEFAULT 0.0,
    visit_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_state_action (user_id, state, action),
    INDEX idx_user_id (user_id),
    INDEX idx_state (state)
);

-- Global Q-table for community recommendations
CREATE TABLE IF NOT EXISTS global_q_table (
    q_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    state VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL,
    q_value FLOAT DEFAULT 0.0,
    visit_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_state_action (state, action),
    INDEX idx_state (state)
);

-- User workout history
CREATE TABLE IF NOT EXISTS user_history (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id),
    INDEX idx_user_id (user_id),
    INDEX idx_workout_date (workout_date)
);
