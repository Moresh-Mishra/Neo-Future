-- Daily Reflections Table
-- Stores user's daily emotional and wellbeing check-ins (filled once per 24 hours)
-- This ensures each user can only submit ONE reflection per calendar day

CREATE TABLE IF NOT EXISTS daily_reflections (
    reflection_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Section 1: Overall Day Reflection
    overall_feeling VARCHAR(50),
    yesterday_rating INT,
    
    -- Section 2: Emotions
    emotions JSON,
    mood_affect TEXT,
    
    -- Section 3: Sleep
    sleep_quality VARCHAR(50),
    sleep_hours VARCHAR(50),
    
    -- Section 4: Energy & Productivity
    energy_level VARCHAR(50),
    completed_tasks VARCHAR(50),
    
    -- Section 5: Stress & Social
    stress_level VARCHAR(50),
    felt_lonely VARCHAR(50),
    
    -- Section 6: Positive Reflection
    best_part TEXT,
    did_well TEXT,
    
    -- Section 7: Simple Self-Reflection
    took_time_for_self VARCHAR(50),
    something_made_smile VARCHAR(50),
    today_outlook VARCHAR(50),
    
    -- Section 8: Safety
    emotionally_okay VARCHAR(50),
    disturbing_thoughts VARCHAR(50),
    
    -- Timestamps
    submission_date DATE DEFAULT (CURDATE()),
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, submission_date),
    INDEX idx_user_id (user_id),
    INDEX idx_submission_date (submission_date),
    INDEX idx_user_date (user_id, submission_date),
    CONSTRAINT check_rating CHECK (yesterday_rating >= 1 AND yesterday_rating <= 10)
);

-- This ensures each user can only submit ONE reflection per calendar day
-- The UNIQUE KEY will prevent duplicate submissions on the same day
