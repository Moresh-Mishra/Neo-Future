const express = require('express');
const router = express.Router();

/**
 * Chat Routes Handler
 * Manages conversation persistence and history with MySQL
 */

module.exports = function(mysqlPool) {
  const parseEmotionValue = (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (err) {
        return null;
      }
    }

    return null;
  };

  /**
   * POST /api/chats/new
   * Create a new chat session
   */
  router.post('/new', async (req, res) => {
    try {
      const { user_id, title } = req.body;

      const chat_title = title || `Chat ${new Date().toLocaleString()}`;

      const [result] = await mysqlPool.query(
        'INSERT INTO ai_chats (user_id, title) VALUES (?, ?)',
        [user_id || null, chat_title]
      );

      res.json({
        success: true,
        chat_id: result.insertId,
        title: chat_title,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/chats
   * List all chats for a user
   */
  router.get('/', async (req, res) => {
    try {
      const { user_id } = req.query;

      let query = `SELECT 
          chat_id, 
          title, 
          created_at, 
          updated_at,
          (SELECT content FROM ai_chat_messages WHERE chat_id = ai_chats.chat_id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM ai_chats`;
      let params = [];

      if (user_id) {
        query += ' WHERE user_id = ?';
        params = [user_id];
      } else {
        // Simple anonymous mode: show chats without a user binding.
        query += ' WHERE user_id IS NULL';
      }

      query += ' ORDER BY updated_at DESC LIMIT 50';

      const [chats] = await mysqlPool.query(query, params);

      res.json({
        success: true,
        chats: chats.map(chat => ({
          chat_id: chat.chat_id,
          title: chat.title,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
          last_message: chat.last_message || ''
        }))
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * GET /api/chats/:chat_id/messages
   * Get all messages for a specific chat
   */
  router.get('/:chat_id/messages', async (req, res) => {
    try {
      const { chat_id } = req.params;
      const { limit = 200 } = req.query;

      const [messages] = await mysqlPool.query(
        `SELECT 
          message_id, 
          chat_id, 
          role, 
          content, 
          emotion, 
          created_at 
        FROM ai_chat_messages 
        WHERE chat_id = ? 
        ORDER BY created_at ASC 
        LIMIT ?`,
        [chat_id, parseInt(limit)]
      );

      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.message_id,
          chat_id: msg.chat_id,
          role: msg.role,
          content: msg.content,
          emotion: parseEmotionValue(msg.emotion),
          created_at: msg.created_at
        }))
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * POST /api/chats/:chat_id/messages
   * Store a new message in a chat
   */
  router.post('/:chat_id/messages', async (req, res) => {
    try {
      const { chat_id } = req.params;
      const { role, content, emotion } = req.body;

      if (!role || !content) {
        return res.status(400).json({ success: false, error: 'role and content are required' });
      }

      const emotion_json = emotion ? JSON.stringify(emotion) : null;

      const [result] = await mysqlPool.query(
        `INSERT INTO ai_chat_messages (chat_id, role, content, emotion) 
         VALUES (?, ?, ?, ?)`,
        [chat_id, role, content, emotion_json]
      );

      // Update chat's updated_at timestamp
      await mysqlPool.query(
        'UPDATE ai_chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?',
        [chat_id]
      );

      res.json({
        success: true,
        message_id: result.insertId,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing message:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * DELETE /api/chats/:chat_id
   * Delete a chat and all its messages
   */
  router.delete('/:chat_id', async (req, res) => {
    try {
      const { chat_id } = req.params;

      const [result] = await mysqlPool.query(
        'DELETE FROM ai_chats WHERE chat_id = ?',
        [chat_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
      }

      res.json({
        success: true,
        message: 'Chat deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  /**
   * PATCH /api/chats/:chat_id
   * Update chat title
   */
  router.patch('/:chat_id', async (req, res) => {
    try {
      const { chat_id } = req.params;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, error: 'title is required' });
      }

      const [result] = await mysqlPool.query(
        'UPDATE ai_chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?',
        [title, chat_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Chat not found' });
      }

      res.json({
        success: true,
        message: 'Chat updated successfully'
      });
    } catch (error) {
      console.error('Error updating chat:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
