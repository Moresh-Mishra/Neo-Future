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

-- Create indexes for common queries
CREATE INDEX idx_target ON exercises(target);
CREATE INDEX idx_difficulty ON exercises(difficulty);
CREATE INDEX idx_body_part ON exercises(body_part);
CREATE INDEX idx_equipment ON exercises(equipment);
