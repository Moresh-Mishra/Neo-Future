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
    INDEX idx_state (state),
    INDEX idx_user_state (user_id, state)
);
