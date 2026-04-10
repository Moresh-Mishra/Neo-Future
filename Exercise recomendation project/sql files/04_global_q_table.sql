-- Global Q-table for community recommendations
CREATE TABLE IF NOT EXISTS global_q_table (
    q_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    state VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL,
    q_value FLOAT DEFAULT 0.0,
    visit_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_state_action (state, action),
    INDEX idx_state (state),
    INDEX idx_action (action),
    INDEX idx_state_action (state, action)
);
