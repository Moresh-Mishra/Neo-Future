const express = require('express');
const router = express.Router();

/**
 * Workout & Active Minutes Routes
 * Handles fetching user workout duration data with deduplication
 */

module.exports = function(mysqlPool) {
  /**
   * GET /api/workouts/active-minutes
   * Fetch user's active minutes (duration in workouts) grouped by date
   * 
   * Query Parameters:
   *   - userId: User ID (required)
   *   - range: 'day' | 'week' | 'month' (default: 'week')
   * 
   * Returns deduped data (one entry per user_id + date + exercise_id)
   * summed by date with goal information
   */
  router.get('/active-minutes', async (req, res) => {
    try {
      const { userId, range = 'week' } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      // Goals in minutes
      const GOAL_DAILY = 120; // 2 hours
      const GOAL_WEEKLY = 540; // 9 hours
      const GOAL_MONTHLY = 2400; // 40 hours

      let dateFilter = '';
      let dateLabel = '';
      let dataPoints = [];
      let monthName = '';

      const conn = await mysqlPool.getConnection();

      try {
        if (range === 'day') {
          // Get today's workout data - deduped by user + date + exercise
          const query = `
            SELECT 
              DATE(uh.workout_date) as workout_date,
              uh.exercise_id,
              SUM(uh.duration_minutes) as duration_minutes
            FROM user_history uh
            WHERE uh.user_id = ? AND DATE(uh.workout_date) = CURDATE()
            GROUP BY DATE(uh.workout_date), uh.exercise_id
            ORDER BY uh.exercise_id
          `;

          const [rows] = await conn.query(query, [userId]);
          console.log('📅 Day Query - Today:', new Date().toISOString().split('T')[0]);
          console.log('📊 Day rows returned:', rows.length, rows);

          // Sum unique exercise durations for the day
          let totalMinutes = 0;
          rows.forEach(row => {
            totalMinutes += parseFloat(row.duration_minutes) || 0;
          });
          console.log('⏱️ Day total minutes:', totalMinutes);

          dataPoints = [{
            date: new Date().toISOString().split('T')[0],
            label: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            minutes: Math.round(totalMinutes * 100) / 100,
            goal: GOAL_DAILY,
            percentage: Math.round((totalMinutes / GOAL_DAILY) * 100)
          }];

        } else if (range === 'week') {
          // Calculate week start and end dates in JavaScript
          const today = new Date();
          const dayOfWeek = today.getDay();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - dayOfWeek);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          const weekStartStr = startOfWeek.toISOString().split('T')[0];
          const weekEndStr = endOfWeek.toISOString().split('T')[0];

          // Get current calendar week (Sunday to Saturday) - deduped by user + date + exercise
          const query = `
            SELECT 
              DATE(uh.workout_date) as workout_date,
              uh.exercise_id,
              SUM(uh.duration_minutes) as duration_minutes
            FROM user_history uh
            WHERE uh.user_id = ? 
              AND DATE(uh.workout_date) >= ?
              AND DATE(uh.workout_date) <= ?
            GROUP BY DATE(uh.workout_date), uh.exercise_id
            ORDER BY workout_date, uh.exercise_id
          `;

          const [rows] = await conn.query(query, [userId, weekStartStr, weekEndStr]);
          console.log('📅 Week Query - From:', weekStartStr, 'To:', weekEndStr);
          console.log('📊 Week rows returned:', rows.length, rows);

          // Group by date and sum unique exercises per date
          const dateMap = {};
          rows.forEach(row => {
            const dateStr = new Date(row.workout_date).toISOString().split('T')[0];
            console.log('  📍 Converting:', row.workout_date, '→', dateStr);
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = 0;
            }
            dateMap[dateStr] += parseFloat(row.duration_minutes) || 0;
          });
          console.log('  🗓️ Week dateMap:', dateMap);

          // Generate Sunday to Saturday range for current week
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          console.log('  📆 Week gen - startOfWeek:', startOfWeek.toISOString().split('T')[0]);
          for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const minutes = Math.round((dateMap[dateStr] || 0) * 100) / 100;
            console.log(`  ${dayNames[i]}: ${dateStr} → ${minutes} min`);
            
            dataPoints.push({
              date: dateStr,
              label: dayNames[i],
              minutes: minutes,
              goal: GOAL_DAILY,
              percentage: Math.round((minutes / GOAL_DAILY) * 100)
            });
          }

          // Calculate weekly total
          const weeklyTotal = dataPoints.reduce((sum, p) => sum + p.minutes, 0);
          const weeklyPercentage = Math.round((weeklyTotal / GOAL_WEEKLY) * 100);

        } else if (range === 'month') {
          // Calculate month start and end dates in JavaScript
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const monthStartStr = new Date(year, month, 1).toISOString().split('T')[0];
          const monthEndStr = new Date(year, month + 1, 0).toISOString().split('T')[0];
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          // Get current calendar month (1st to last day) - deduped by user + date + exercise
          const query = `
            SELECT 
              DATE(uh.workout_date) as workout_date,
              uh.exercise_id,
              SUM(uh.duration_minutes) as duration_minutes
            FROM user_history uh
            WHERE uh.user_id = ? 
              AND DATE(uh.workout_date) >= ?
              AND DATE(uh.workout_date) <= ?
            GROUP BY DATE(uh.workout_date), uh.exercise_id
            ORDER BY workout_date, uh.exercise_id
          `;

          const [rows] = await conn.query(query, [userId, monthStartStr, monthEndStr]);
          console.log('📅 Month Query - From:', monthStartStr, 'To:', monthEndStr);
          console.log('📊 Month rows returned:', rows.length, rows);

          // Group by date and sum unique exercises per date
          const dateMap = {};
          rows.forEach(row => {
            const dateStr = new Date(row.workout_date).toISOString().split('T')[0];
            if (!dateMap[dateStr]) {
              dateMap[dateStr] = 0;
            }
            dateMap[dateStr] += parseFloat(row.duration_minutes) || 0;
          });

          // Get the current month name
          monthName = today.toLocaleDateString('en-US', { month: 'long' }); // e.g., "April"

          // Generate all days of current month (1st to last day)
          for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            const minutes = Math.round((dateMap[dateStr] || 0) * 100) / 100;
            
            dataPoints.push({
              date: dateStr,
              label: (day % 7 === 1) ? `${day}` : '', // Show every 7 days
              minutes: minutes,
              goal: GOAL_DAILY,
              percentage: Math.round((minutes / GOAL_DAILY) * 100)
            });
          }

          // Calculate monthly total
          const monthlyTotal = dataPoints.reduce((sum, p) => sum + p.minutes, 0);
          const monthlyPercentage = Math.round((monthlyTotal / GOAL_MONTHLY) * 100);
        }

        conn.release();

        // Determine total and goal based on range
        let totalMinutes = dataPoints.reduce((sum, p) => sum + p.minutes, 0);
        let totalGoal = GOAL_DAILY;
        let totalPercentage = 0;

        if (range === 'week') {
          totalGoal = GOAL_WEEKLY;
          totalPercentage = Math.round((totalMinutes / totalGoal) * 100);
        } else if (range === 'month') {
          totalGoal = GOAL_MONTHLY;
          totalPercentage = Math.round((totalMinutes / totalGoal) * 100);
        } else {
          totalPercentage = Math.round((totalMinutes / GOAL_DAILY) * 100);
        }

        res.json({
          success: true,
          range,
          dateLabel,
          monthName,
          data: dataPoints,
          summary: {
            total: Math.round(totalMinutes * 100) / 100,
            goal: totalGoal,
            percentage: totalPercentage,
            unit: range === 'month' ? 'hours' : 'minutes'
          }
        });
        
        console.log(`\n✅ ${range.toUpperCase()} - Total: ${totalMinutes} min, Goal: ${totalGoal} min, Percentage: ${totalPercentage}%`);
        console.log(`📊 Data points sent:`, JSON.stringify(dataPoints, null, 2));
      } catch (error) {
        conn.release();
        throw error;
      }
    } catch (error) {
      console.error('Error fetching active minutes:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
};
