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
    INDEX idx_workout_date (workout_date),
    INDEX idx_completed (completed),
    INDEX idx_user_date (user_id, workout_date)
);
