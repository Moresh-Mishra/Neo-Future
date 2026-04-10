const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { hashPassword, comparePassword, generateToken, authMiddleware } = require('./auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
let mysqlPool;

// RL Hyperparameters
const ALPHA = 0.1;  // Learning rate
const EPSILON = 0.2;  // Exploration rate
const REWARD_COMPLETED = 2;
const REWARD_SKIPPED = -1;
const REWARD_NEUTRAL = 0;

// Initialize MySQL connection
async function initMySQL() {
  try {
    mysqlPool = await mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'exercise_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    await mysqlPool.query('SELECT 1');
    console.log('✓ Connected to MySQL Database');
  } catch (error) {
    console.error('✗ MySQL Connection Error:', error.message);
    console.error('Please ensure MySQL is running and credentials are correct in .env file');
    process.exit(1);
  }
}

// API Routes

// 1. Get all available target muscles
app.get('/api/exercises/muscles', async (req, res) => {
  try {
    const [results] = await mysqlPool.query('SELECT DISTINCT target FROM exercises WHERE target IS NOT NULL AND target != "" ORDER BY target');
    const muscles = results.map(row => row.target);
    res.json({ success: true, muscles });
  } catch (error) {
    console.error('Error fetching muscles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get all available fitness levels
app.get('/api/exercises/fitness-levels', async (req, res) => {
  try {
    const [results] = await mysqlPool.query('SELECT DISTINCT difficulty FROM exercises WHERE difficulty IS NOT NULL AND difficulty != "" ORDER BY difficulty');
    const levels = results.map(row => row.difficulty);
    res.json({
      success: true,
      levels: levels.length > 0 ? levels : ['beginner', 'intermediate', 'expert']
    });
  } catch (error) {
    console.error('Error fetching fitness levels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get exercises for a specific muscle and difficulty
app.get('/api/exercises', async (req, res) => {
  try {
    const { target, difficulty, limit } = req.query;

    let query = 'SELECT exercise_id, name, body_part, target, equipment, difficulty, category, description, instruction, secondary_muscles, gif_path FROM exercises WHERE 1=1';
    const params = [];

    if (target) {
      query += ' AND target = ?';
      params.push(target);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY name';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const [results] = await mysqlPool.query(query, params);
    res.json({
      success: true,
      exercises: results.map(ex => ({
        id: ex.exercise_id,
        name: ex.name,
        body_part: ex.body_part,
        target: ex.target,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        category: ex.category,
        description: ex.description,
        instruction: ex.instruction,
        secondary_muscles: ex.secondary_muscles,
        gif_path: ex.gif_path
      }))
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Q-values for a state (muscle + fitness level)
app.get('/api/q-values', async (req, res) => {
  try {
    const { userId, state } = req.query;

    if (!userId || !state) {
      return res.status(400).json({ success: false, error: 'userId and state are required' });
    }

    // Fetch available exercises for this state
    const [muscle, fitnessLevel] = state.split('_');
    let exerciseQuery = 'SELECT exercise_id, name FROM exercises WHERE target = ?';
    let queryParams = [muscle];

    if (fitnessLevel) {
      exerciseQuery += ' AND difficulty = ?';
      queryParams.push(fitnessLevel);
    }

    const [exercises] = await mysqlPool.query(exerciseQuery, queryParams);
    const availableExerciseIds = exercises.map(ex => ex.exercise_id);

    if (availableExerciseIds.length === 0) {
      return res.json({ success: true, qValues: {}, source: 'No exercises available', availableExercises: [] });
    }

    // Try user-specific Q-values first
    let qValues = {};
    let source = 'Initialized to 0.5';

    for (const exerciseId of availableExerciseIds) {
      const [userResults] = await mysqlPool.query(
        'SELECT q_value FROM user_q_table WHERE user_id = ? AND state = ? AND action = ?',
        [userId, state, exerciseId]
      );

      if (userResults.length > 0) {
        qValues[exerciseId] = userResults[0].q_value;
        source = 'User Q-table';
      }
    }

    // If no user Q-values, try global Q-table
    if (Object.keys(qValues).length === 0) {
      for (const exerciseId of availableExerciseIds) {
        const [globalResults] = await mysqlPool.query(
          'SELECT q_value FROM global_q_table WHERE state = ? AND action = ?',
          [state, exerciseId]
        );

        if (globalResults.length > 0) {
          qValues[exerciseId] = globalResults[0].q_value;
          source = 'Global Q-table';
        }
      }
    }

    // Initialize any missing Q-values to 0.5 (neutral)
    for (const exerciseId of availableExerciseIds) {
      if (!(exerciseId in qValues)) {
        qValues[exerciseId] = 0.5;
      }
    }

    res.json({
      success: true,
      qValues,
      source,
      availableExercises: exercises.map(ex => ({ id: ex.exercise_id, name: ex.name }))
    });
  } catch (error) {
    console.error('Error fetching Q-values:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Select best exercise using ε-greedy
app.post('/api/select-exercise', async (req, res) => {
  try {
    const { qValues } = req.body;

    if (!qValues || Object.keys(qValues).length === 0) {
      return res.status(400).json({ success: false, error: 'No Q-values provided' });
    }

    // Sort exercises by Q-value
    const sortedExercises = Object.entries(qValues).sort((a, b) => b[1] - a[1]);
    const bestExerciseId = sortedExercises[0][0];
    const bestQValue = sortedExercises[0][1];

    // ε-Greedy selection
    let selectedExerciseId;
    let selectionType;

    if (Math.random() < EPSILON) {
      // Explore: pick random exercise
      const exerciseIds = Object.keys(qValues);
      selectedExerciseId = exerciseIds[Math.floor(Math.random() * exerciseIds.length)];
      selectionType = 'explore';
    } else {
      // Exploit: pick best exercise
      selectedExerciseId = bestExerciseId;
      selectionType = 'exploit';
    }

    res.json({
      success: true,
      selectedExerciseId,
      selectionType,
      bestExerciseId,
      bestQValue
    });
  } catch (error) {
    console.error('Error selecting exercise:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Update Q-tables after user feedback
app.post('/api/update-q-table', async (req, res) => {
  try {
    const { userId, state, action, reward } = req.body;

    if (!userId || !state || !action || reward === undefined) {
      return res.status(400).json({ success: false, error: 'userId, state, action, and reward are required' });
    }

    // Get current Q-value
    const [currentResults] = await mysqlPool.query(
      'SELECT q_value FROM user_q_table WHERE user_id = ? AND state = ? AND action = ?',
      [userId, state, action]
    );

    const oldQ = currentResults.length > 0 ? currentResults[0].q_value : 0.0;

    // Q-learning formula: Q(s,a) = Q(s,a) + α * (reward - Q(s,a))
    const newQ = oldQ + ALPHA * (reward - oldQ);

    // Update user Q-table with visit count
    await mysqlPool.query(
      `INSERT INTO user_q_table (user_id, state, action, q_value, visit_count)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE q_value = ?, visit_count = visit_count + 1`,
      [userId, state, action, newQ, newQ]
    );

    // Update global Q-table with visit count
    await mysqlPool.query(
      `INSERT INTO global_q_table (state, action, q_value, visit_count)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE q_value = ?, visit_count = visit_count + 1`,
      [state, action, newQ, newQ]
    );

    // Record user history
    await mysqlPool.query(
      'INSERT INTO user_history (user_id, exercise_id, completed, feedback, workout_date) VALUES (?, ?, ?, ?, CURDATE())',
      [userId, action, reward === REWARD_COMPLETED ? 1 : 0, reward === REWARD_COMPLETED ? 1 : 0]
    );

    res.json({
      success: true,
      oldQ,
      newQ,
      message: 'Q-tables updated successfully'
    });
  } catch (error) {
    console.error('Error updating Q-table:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if email already exists
    const [existingUsers] = await mysqlPool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const [result] = await mysqlPool.query(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [fullName, email, phone || null, passwordHash]
    );

    // Get created user
    const [newUser] = await mysqlPool.query(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [result.insertId]
    );

    // Generate JWT token
    const token = generateToken({
      userId: result.insertId,
      email: newUser[0].email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: newUser[0],
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const [users] = await mysqlPool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.user_id,
      email: user.email
    });

    // Return user info (excluding password hash)
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const [users] = await mysqlPool.query(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== END AUTHENTICATION ROUTES ====================

// 7. Get or create user (SQL only - no MongoDB)
app.post('/api/user', async (req, res) => {
  try {
    const { userId, name, email } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    // Check if user exists
    const [existingUsers] = await mysqlPool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (existingUsers.length > 0) {
      // User exists, return it
      res.json({ success: true, user: existingUsers[0], source: 'existing' });
    } else {
      // Create new user
      const [result] = await mysqlPool.query(
        'INSERT INTO users (user_id, name, email) VALUES (?, ?, ?)',
        [userId, name || 'User', email || null]
      );

      const [newUser] = await mysqlPool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
      res.json({ success: true, user: newUser[0], source: 'created' });
    }
  } catch (error) {
    console.error('Error fetching/creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get user workout history
app.get('/api/user/history', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const [results] = await mysqlPool.query(
      `SELECT h.*, e.name as exercise_name, e.target, e.difficulty
       FROM user_history h
       LEFT JOIN exercises e ON h.exercise_id = e.exercise_id
       WHERE h.user_id = ?
       ORDER BY h.workout_date DESC, h.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, history: results });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Exercise Recommendation API (SQL Only) is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  await initMySQL();

  app.listen(PORT, () => {
    console.log(`\n🚀 Exercise Recommendation API Server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  if (mysqlPool) await mysqlPool.end();
  process.exit(0);
});
