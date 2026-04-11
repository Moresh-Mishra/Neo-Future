-- AI Chat history tables for avatar conversations
USE exercise_db;

CREATE TABLE IF NOT EXISTS ai_chats (
    chat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    CONSTRAINT fk_ai_chats_user FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chat_id BIGINT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    emotion JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_chat_created (chat_id, created_at),
    CONSTRAINT fk_ai_messages_chat FOREIGN KEY (chat_id)
        REFERENCES ai_chats(chat_id) ON DELETE CASCADE
);
