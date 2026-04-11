const express = require('express');
const router = express.Router();
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

/**
 * AI & Emotion Analysis Routes
 * Handles chat responses, emotion detection, and Ollama integration
 */

module.exports = function(mysqlPool) {
  const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434/api/chat';
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  const PYTHON_EMOTION_SERVICE = process.env.PYTHON_EMOTION_SERVICE || 'http://127.0.0.1:5001';

  /**
   * POST /api/ai/text-emotion
   * Analyze text emotion and generate AI response with conversation context
   */
  router.post('/text-emotion', async (req, res) => {
    try {
      const { 
        user_message,
        text,
        user_id, 
        chat_id, 
        history = []
      } = req.body;

      const normalizedUserMessage = (user_message || text || '').toString().trim();

      if (!normalizedUserMessage) {
        return res.status(400).json({ 
          success: false, 
          error: 'user_message (or text) is required' 
        });
      }

      let current_chat_id = chat_id;

      // Auto-create chat if needed
      if (!current_chat_id) {
        const [result] = await mysqlPool.query(
          'INSERT INTO ai_chats (user_id, title) VALUES (?, ?)',
          [user_id || null, `Chat ${new Date().toLocaleString()}`]
        );
        current_chat_id = result.insertId;
      }

      // Analyze emotion
      let emotion_data = {
        predicted_emotion: 'neutral',
        confidence: 0.5,
        scores: {}
      };

      try {
        const emotionResponse = await axios.post(
          `${PYTHON_EMOTION_SERVICE}/api/analyze/emotion`,
          { text: normalizedUserMessage },
          { timeout: 5000 }
        );
        
        if (emotionResponse.data && emotionResponse.data.emotion) {
          emotion_data = emotionResponse.data.emotion;
        }
      } catch (emotionError) {
        console.warn('Emotion analysis failed, using neutral fallback:', emotionError.message);
        // Use fallback neutral emotion
      }

      // Store user message
      await mysqlPool.query(
        `INSERT INTO ai_chat_messages (chat_id, role, content, emotion) 
         VALUES (?, ?, ?, ?)`,
        [current_chat_id, 'user', normalizedUserMessage, JSON.stringify(emotion_data)]
      );

      // Prepare conversation history for Ollama
      const conversationHistory = history.slice(-12).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content
      }));

      // Call Ollama with conversation context
      let aiResponse = '';
      try {
        const ollamaResponse = await axios.post(
          OLLAMA_API_URL,
          {
            model: OLLAMA_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful and empathetic AI assistant supporting users on their health and wellness journey. Be concise, supportive, and encouraging.'
              },
              ...conversationHistory,
              {
                role: 'user',
                content: normalizedUserMessage
              }
            ],
            stream: false
          },
          { timeout: 30000 }
        );

        aiResponse = ollamaResponse?.data?.message?.content || 'I understand. How can I help you further?';
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError.message);
        aiResponse = `I'm having trouble processing your request at the moment. Your message was: "${normalizedUserMessage}". Could you try again?`;
      }

      // Store AI response
      await mysqlPool.query(
        `INSERT INTO ai_chat_messages (chat_id, role, content, emotion) 
         VALUES (?, ?, ?, ?)`,
        [current_chat_id, 'assistant', aiResponse, null]
      );

      // Update chat timestamp
      await mysqlPool.query(
        'UPDATE ai_chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?',
        [current_chat_id]
      );

      res.json({
        success: true,
        chat_id: current_chat_id,
        user_message: normalizedUserMessage,
        ai_response: aiResponse,
        response: aiResponse,
        emotion: emotion_data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in text-emotion endpoint:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/ai/analyze
   * Run Python emotion analysis script directly
   */
  router.post('/analyze', async (req, res) => {
    try {
      const { text, analyse_type = 'text' } = req.body;

      if (!text) {
        return res.status(400).json({ 
          success: false, 
          error: 'text is required' 
        });
      }

      // Try to call the Python emotion service first
      try {
        const emotionResponse = await axios.post(
          `${PYTHON_EMOTION_SERVICE}/api/analyze/${analyse_type}`,
          { text },
          { timeout: 5000 }
        );
        
        return res.json({
          success: true,
          ...emotionResponse.data
        });
      } catch (serviceError) {
        console.warn('Python service unavailable, using fallback:', serviceError.message);
      }

      // Fallback: Return neutral emotion
      res.json({
        success: true,
        emotion: {
          predicted_emotion: 'neutral',
          confidence: 0.5,
          scores: {
            neutral: 0.5,
            positive: 0.25,
            negative: 0.25
          }
        }
      });
    } catch (error) {
      console.error('Error in analyze endpoint:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  /**
   * POST /api/ai/chat
   * Simple chat endpoint without emotion analysis
   */
  router.post('/chat', async (req, res) => {
    try {
      const { user_message, text, user_id, chat_id, history = [] } = req.body;
      const normalizedUserMessage = (user_message || text || '').toString().trim();

      if (!normalizedUserMessage) {
        return res.status(400).json({ 
          success: false, 
          error: 'user_message (or text) is required' 
        });
      }

      let current_chat_id = chat_id;

      // Auto-create chat if needed
      if (!current_chat_id) {
        const [result] = await mysqlPool.query(
          'INSERT INTO ai_chats (user_id, title) VALUES (?, ?)',
          [user_id || null, `Chat ${new Date().toLocaleString()}`]
        );
        current_chat_id = result.insertId;
      }

      // Store user message
      await mysqlPool.query(
        `INSERT INTO ai_chat_messages (chat_id, role, content, emotion) 
         VALUES (?, ?, ?, ?)`,
        [current_chat_id, 'user', normalizedUserMessage, null]
      );

      // Prepare conversation history
      const conversationHistory = history.slice(-12).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
        content: msg.content
      }));

      // Call Ollama
      let aiResponse = '';
      try {
        const ollamaResponse = await axios.post(
          OLLAMA_API_URL,
          {
            model: OLLAMA_MODEL,
            messages: [
              {
                role: 'system',
                content: 'You are a helpful and empathetic AI assistant supporting users on their health and wellness journey.'
              },
              ...conversationHistory,
              {
                role: 'user',
                content: normalizedUserMessage
              }
            ],
            stream: false
          },
          { timeout: 30000 }
        );

        aiResponse = ollamaResponse.data.message.content || 'I understand. How can I help?';
      } catch (ollamaError) {
        console.error('Ollama error:', ollamaError.message);
        aiResponse = 'I\'m having trouble connecting to the AI service. Please try again.';
      }

      // Store AI response
      await mysqlPool.query(
        `INSERT INTO ai_chat_messages (chat_id, role, content, emotion) 
         VALUES (?, ?, ?, ?)`,
        [current_chat_id, 'assistant', aiResponse, null]
      );

      // Update chat timestamp
      await mysqlPool.query(
        'UPDATE ai_chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?',
        [current_chat_id]
      );

      res.json({
        success: true,
        chat_id: current_chat_id,
        user_message: normalizedUserMessage,
        ai_response: aiResponse,
        response: aiResponse,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  return router;
};
