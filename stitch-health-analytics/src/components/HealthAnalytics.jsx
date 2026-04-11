import React, { useState, useEffect } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HealthAnalytics = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [moodData, setMoodData] = useState([]);
  const [averageMoodScore, setAverageMoodScore] = useState(0);
  const [sleepQualityData, setSleepQualityData] = useState([]);
  const [averageSleepHours, setAverageSleepHours] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Active Minutes state
  const [dailyActiveMinutes, setDailyActiveMinutes] = useState([]);
  const [weeklyActiveMinutes, setWeeklyActiveMinutes] = useState([]);
  const [monthlyActiveMinutes, setMonthlyActiveMinutes] = useState([]);
  const [dailySummary, setDailySummary] = useState({ total: 0, goal: 120, percentage: 0 });
  const [weeklySummary, setWeeklySummary] = useState({ total: 0, goal: 540, percentage: 0 });
  const [monthlySummary, setMonthlySummary] = useState({ total: 0, goal: 2400, percentage: 0 });
  const [monthName, setMonthName] = useState('');

  const getDateKey = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).split('T')[0];
    }
    return date.toISOString().slice(0, 10);
  };

  // Default data for users with no reflections
  const getDefaultMoodData = () => [
    { day: 'Mon', mood: 6.5 },
    { day: 'Tue', mood: 6.8 },
    { day: 'Wed', mood: 7.2 },
    { day: 'Thu', mood: 6.9 },
    { day: 'Fri', mood: 7.6 },
    { day: 'Sat', mood: 7.4 },
    { day: 'Sun', mood: 8.1 },
  ];

  // Fetch mood data from daily reflections
  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const authToken = localStorage.getItem('authToken');

        if (!user || !authToken) {
          console.error('User not authenticated');
          setMoodData(getDefaultMoodData());
          setIsLoading(false);
          return;
        }

          const response = await fetch(`http://localhost:5001/api/reflections/${user.user_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const reflections = data.reflections || [];

          // Create a map of dates to mood values for quick lookup
          const moodMap = {};
          reflections.forEach(reflection => {
            const dateStr = getDateKey(reflection.submission_date);
            if (!dateStr) return;
            moodMap[dateStr] = reflection.yesterday_rating || 0;
          });

          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const chartData = [];
          const isMonthView = timeRange === 'month';
          
          if (isMonthView) {
            // Show last 7 months with current month on the right
            const monthlyMoodMap = {};
            reflections.forEach(reflection => {
              const dateStr = getDateKey(reflection.submission_date);
              if (!dateStr) return;
              const [year, month] = dateStr.split('-');
              const monthKey = `${year}-${month}`;

              if (!monthlyMoodMap[monthKey]) {
                monthlyMoodMap[monthKey] = [];
              }
              monthlyMoodMap[monthKey].push(reflection.yesterday_rating || 0);
            });
            
            // Generate last 7 months including current month
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const monthKey = `${year}-${month}`;
              
              const monthMoods = monthlyMoodMap[monthKey] || [];
              const monthMood = monthMoods.length > 0 
                ? (monthMoods.reduce((sum, m) => sum + m, 0) / monthMoods.length) 
                : 0;
              
              chartData.push({
                day: monthNames[date.getMonth()],
                mood: parseFloat(monthMood.toFixed(1)),
                date: monthKey
              });
            }
            
            // Calculate average only for months with actual data (mood > 0)
            const monthsWithData = chartData.filter(d => d.mood > 0);
            const average = monthsWithData.length > 0
              ? (monthsWithData.reduce((sum, d) => sum + d.mood, 0) / monthsWithData.length).toFixed(1)
              : 0;
            
            setMoodData(chartData);
            setAverageMoodScore(parseFloat(average));
          } else {
            // Week view: Show last 7 days
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              
              const dayOfWeek = dayNames[date.getDay()];
              const mood = moodMap[dateStr] !== undefined ? moodMap[dateStr] : 0;
              
              chartData.push({
                day: dayOfWeek,
                mood: mood,
                date: dateStr
              });
            }
            
            // Calculate average only for days with actual data (mood > 0)
            const daysWithData = chartData.filter(d => d.mood > 0);
            const average = daysWithData.length > 0
              ? (daysWithData.reduce((sum, d) => sum + d.mood, 0) / daysWithData.length).toFixed(1)
              : 0;
            
            setMoodData(chartData);
            setAverageMoodScore(parseFloat(average));
          }
        } else {
          console.error('Failed to fetch reflections');
          setMoodData(getDefaultMoodData());
          setAverageMoodScore(7.4);
        }
      } catch (error) {
        console.error('Error fetching mood data:', error);
        setMoodData(getDefaultMoodData());
        setAverageMoodScore(7.4);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMoodData();
  }, [timeRange]);

  // Helper function to parse sleep hours from "7 hrs" format
  const parseSleepHours = (sleepStr) => {
    if (!sleepStr) return 0;
    const match = sleepStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Fetch sleep data from daily reflections
  useEffect(() => {
    const fetchSleepData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const authToken = localStorage.getItem('authToken');

        if (!user || !authToken) {
          console.error('User not authenticated');
          setSleepQualityData(getDefaultSleepData());
          return;
        }

        const response = await fetch(`http://localhost:5001/api/reflections/${user.user_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const reflections = data.reflections || [];

          // Create a map of dates to sleep hours
          const sleepMap = {};
          reflections.forEach(reflection => {
            const dateStr = getDateKey(reflection.submission_date);
            if (!dateStr) return;
            sleepMap[dateStr] = parseSleepHours(reflection.sleep_hours);
          });

          // Generate last 7 or 12 months depending on timeRange
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const chartData = [];
          const isMonthView = timeRange === 'month';
          
          if (isMonthView) {
            // Show last 7 months with current month on the right
            const monthlySleepMap = {};
            reflections.forEach(reflection => {
              const dateStr = getDateKey(reflection.submission_date);
              if (!dateStr) return;
              const [year, month] = dateStr.split('-');
              const monthKey = `${year}-${month}`;

              if (!monthlySleepMap[monthKey]) {
                monthlySleepMap[monthKey] = [];
              }
              monthlySleepMap[monthKey].push(parseSleepHours(reflection.sleep_hours));
            });
            
            // Generate last 7 months including current month
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const monthKey = `${year}-${month}`;
              
              const monthlySleepHours = monthlySleepMap[monthKey] || [];
              const monthSleep = monthlySleepHours.length > 0 
                ? (monthlySleepHours.reduce((sum, h) => sum + h, 0) / monthlySleepHours.length) 
                : 0;
              
              chartData.push({
                day: monthNames[date.getMonth()],
                hours: parseFloat(monthSleep.toFixed(1)),
                date: monthKey
              });
            }
            
            // Calculate average only for months with actual data (hours > 0)
            const monthsWithData = chartData.filter(d => d.hours > 0);
            const average = monthsWithData.length > 0
              ? (monthsWithData.reduce((sum, d) => sum + d.hours, 0) / monthsWithData.length).toFixed(1)
              : 0;
            
            setSleepQualityData(chartData);
            setAverageSleepHours(parseFloat(average));
          } else {
            // Week view: Show last 7 days
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              
              const dayOfWeek = dayNames[date.getDay()];
              const hours = sleepMap[dateStr] !== undefined ? sleepMap[dateStr] : 0;
              
              chartData.push({
                day: dayOfWeek,
                hours: hours,
                date: dateStr
              });
            }
            
            // Calculate average only for days with actual data (hours > 0)
            const daysWithData = chartData.filter(d => d.hours > 0);
            const average = daysWithData.length > 0
              ? (daysWithData.reduce((sum, d) => sum + d.hours, 0) / daysWithData.length).toFixed(1)
              : 0;
            
            setSleepQualityData(chartData);
            setAverageSleepHours(parseFloat(average));
          }
        } else {
          console.error('Failed to fetch sleep data');
          setSleepQualityData(getDefaultSleepData());
          setAverageSleepHours(7.2);
        }
      } catch (error) {
        console.error('Error fetching sleep data:', error);
        setSleepQualityData(getDefaultSleepData());
        setAverageSleepHours(7.2);
      }
    };

    fetchSleepData();
  }, [timeRange]);

  // Fetch active minutes data for daily, weekly, and monthly views
  useEffect(() => {
    const fetchActiveMinutesData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const authToken = localStorage.getItem('authToken');

        if (!user || !authToken) {
          console.error('User not authenticated');
          return;
        }

        // Fetch daily data
          const dailyResponse = await fetch(
            `http://localhost:5001/api/workouts/active-minutes?userId=${user.user_id}&range=day`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (dailyResponse.ok) {
          const dailyData = await dailyResponse.json();
          console.log('📅 Daily API Response:', dailyData);
          setDailyActiveMinutes(dailyData.data || []);
          setDailySummary(dailyData.summary || { total: 0, goal: 120, percentage: 0 });
        }

        // Fetch weekly data
          const weeklyResponse = await fetch(
            `http://localhost:5001/api/workouts/active-minutes?userId=${user.user_id}&range=week`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          console.log('📊 Weekly API Response:', weeklyData);
          setWeeklyActiveMinutes(weeklyData.data || []);
          setWeeklySummary(weeklyData.summary || { total: 0, goal: 540, percentage: 0 });
        }

        // Fetch monthly data
          const monthlyResponse = await fetch(
            `http://localhost:5001/api/workouts/active-minutes?userId=${user.user_id}&range=month`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (monthlyResponse.ok) {
          const monthlyData = await monthlyResponse.json();
          console.log('📆 Monthly API Response:', monthlyData);
          setMonthlyActiveMinutes(monthlyData.data || []);
          setMonthlySummary(monthlyData.summary || { total: 0, goal: 2400, percentage: 0 });
          setMonthName(monthlyData.monthName || '');
        }
      } catch (error) {
        console.error('❌ Error fetching active minutes data:', error);
      }
    };

    console.log('📊 Fetching active minutes data for user...');
    fetchActiveMinutesData();
  }, []);

  // Log state updates
  useEffect(() => {
    console.log('📈 State Updated:', {
      dailyMinutes: dailyActiveMinutes.length,
      weeklyMinutes: weeklyActiveMinutes.length,
      monthlyMinutes: monthlyActiveMinutes.length,
      dailySummary,
      weeklySummary,
      monthlySummary,
      monthName
    });
  }, [dailyActiveMinutes, weeklyActiveMinutes, monthlyActiveMinutes, dailySummary, weeklySummary, monthlySummary, monthName]);

  // Default sleep data for users with no reflections
  const getDefaultSleepData = () => [
    { day: 'Mon', hours: 6.5 },
    { day: 'Tue', hours: 7.2 },
    { day: 'Wed', hours: 6.8 },
    { day: 'Thu', hours: 7.5 },
    { day: 'Fri', hours: 6.2 },
    { day: 'Sat', hours: 7.4 },
    { day: 'Sun', hours: 8.0 },
  ];

  const sleepData = [60, 80, 75, 90, 65, 85, 95];

  const biometricStats = [
    { label: 'Heart Rate Var.', value: '62 ms', change: '+4%', icon: 'pulse_alert', positive: true },
    { label: 'Respiration', value: '14 bpm', change: 'Stable', icon: 'air', positive: false },
    { label: 'Focus Score', value: '88/100', change: '+12%', icon: 'target', positive: true },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Manrope']">
      <TopNavBar activeTab="growth" />

      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
            {/* Header & Filter */}
            <header className="mb-8 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end md:gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface md:text-5xl">
                  Health Analytics
                </h1>
                <p className="max-w-lg text-sm text-on-surface-variant md:text-base">
                  Deep dive into your wellness journey. Understand the patterns that shape your mental sanctuary.
                </p>
              </div>
              <div className="flex w-fit rounded-full bg-surface-container-low p-1">
                {['Week', 'Month'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range.toLowerCase())}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all sm:px-6 sm:text-sm ${
                      timeRange === range.toLowerCase()
                        ? 'bg-surface-container-lowest rounded-full text-sm font-semibold shadow-sm text-[#436745]'
                        : 'text-on-surface-variant hover:text-[#436745]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </header>

            {/* Bento Grid Dashboard */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-8">
              {/* Mood Over Time (Large Chart) */}
              <section className="relative overflow-hidden rounded-[1.5rem] bg-surface-container-low p-4 md:col-span-8 md:rounded-[2rem] md:p-8">
                <div className="mb-8 flex flex-wrap items-start justify-between gap-3 md:mb-12">
                  <div>
                    <h3 className="text-xl font-headline font-bold text-[#436745]">Mood Resilience</h3>
                    <p className="text-on-surface-variant text-sm">
                      {isLoading ? 'Loading...' : `Average mood score: ${averageMoodScore}/10`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[#436745]">
                    <span className="text-xs font-bold uppercase tracking-widest">Steady Growth</span>
                    <span className="material-symbols-outlined text-lg">trending_up</span>
                  </div>
                </div>

                {/* Chart Visualization with Recharts */}
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={moodData} margin={{ top: 15, right: 20, left: -25, bottom: 35 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(172, 180, 169, 0.1)" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(89, 97, 88, 0.5)"
                      tick={{ fontSize: 11, fontWeight: 600, fill: 'rgba(89, 97, 88, 0.7)' }}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={[0, 10]}
                      stroke="rgba(89, 97, 88, 0.5)"
                      tick={{ fontSize: 11, fill: 'rgba(89, 97, 88, 0.5)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(67, 103, 69, 0.2)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 18px rgba(45, 52, 44, 0.1)',
                      }}
                      labelStyle={{ color: '#436745', fontWeight: 'bold' }}
                      formatter={(value) => [value.toFixed(1), 'Mood Score']}
                    />
                    <defs>
                      <linearGradient id="colorMood" x1="0" y1="0" x2="100%" y2="0">
                        <stop offset="0%" stopColor="#436745" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7DA47D" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="url(#colorMood)" 
                      strokeWidth={4} 
                      dot={{ fill: '#436745', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#7DA47D' }}
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* Active Minutes - 3 Stacked Progress Trackers */}
              <section className="md:col-span-4 bg-[#dde5d9]/30 rounded-[1.5rem] p-4 flex flex-col gap-4 md:rounded-[2rem] md:p-8">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[#436745]">directions_run</span>
                  </div>
                  <h3 className="text-xl font-headline font-bold text-[#436745]">Active Minutes</h3>
                </div>

                {/* Daily */}
                <div className="bg-white/30 rounded-xl p-3">
                  <h4 className="text-sm font-headline font-bold text-[#436745] mb-3">Today</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#436745]">
                      <span>{dailySummary.total} min</span>
                      <span>{dailySummary.percentage}% of {dailySummary.goal} min</span>
                    </div>
                    <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#7DA47D] rounded-full transition-all"
                        style={{ width: `${Math.min(dailySummary.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Weekly */}
                <div className="bg-white/30 rounded-xl p-3">
                  <h4 className="text-sm font-headline font-bold text-[#436745] mb-3">Weekly</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#436745]">
                      <span>{weeklySummary.total} min</span>
                      <span>{weeklySummary.percentage}% of {weeklySummary.goal} min</span>
                    </div>
                    <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#7DA47D] rounded-full transition-all"
                        style={{ width: `${Math.min(weeklySummary.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Monthly */}
                <div className="bg-white/30 rounded-xl p-3">
                  <h4 className="text-sm font-headline font-bold text-[#436745] mb-3">Monthly ({monthName})</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#436745]">
                      <span>{Math.round(monthlySummary.total / 60 * 10) / 10} hrs</span>
                      <span>{monthlySummary.percentage}% of {Math.round(monthlySummary.goal / 60)} hrs</span>
                    </div>
                    <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#7DA47D] rounded-full transition-all"
                        style={{ width: `${Math.min(monthlySummary.percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sleep Cycles (Bento) */}
              <section className="md:col-span-4 bg-surface-container-high rounded-[1.5rem] p-3 md:rounded-[2rem] md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-tertiary">bedtime</span>
                  <h3 className="text-lg font-headline font-bold text-tertiary">Sleep Quality</h3>
                </div>
                <p className="text-on-surface-variant text-sm mb-6">
                  {isLoading ? 'Loading...' : `Average sleep: ${averageSleepHours}h`}
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sleepQualityData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="0" stroke="transparent" vertical={false} horizontal={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="rgba(89, 97, 88, 0.5)"
                      tick={{ fontSize: 11, fontWeight: 600, fill: 'rgba(89, 97, 88, 0.7)' }}
                      axisLine={false}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 9]}
                      tick={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(93, 99, 47, 0.2)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(45, 52, 44, 0.1)',
                      }}
                      labelStyle={{ color: '#5d632f', fontWeight: 'bold' }}
                      formatter={(value) => [value.toFixed(1) + 'h', 'Sleep']}
                    />
                    <Bar 
                      dataKey="hours" 
                      radius={[8, 8, 0, 0]}
                      fill="#7DA47D"
                      isAnimationActive={true}
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-center">
                  <p className="text-tertiary font-bold text-2xl">{averageSleepHours}h</p>
                  <p className="text-on-surface-variant text-xs font-medium mt-1">Weekly Average</p>
                </div>
              </section>

              {/* Insight Highlights (Wide Bento) */}
              <section className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm shadow-[#436745]/5 flex flex-col gap-5 md:flex-row md:gap-10 md:rounded-[2rem] md:p-10">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full">
                    <span className="material-symbols-outlined text-sm text-[#436745]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      auto_awesome
                    </span>
                    <span className="text-[10px] font-bold text-[#436745] uppercase tracking-widest">Mindful Correlation</span>
                  </div>
                  <h2 className="text-2xl font-headline font-extrabold text-[#436745] leading-tight md:text-3xl">
                    We noticed your mood improves on days you sleep more than 7 hours.
                  </h2>
                  <p className="text-on-surface-variant leading-relaxed">
                    Your consistency in deep sleep stages during the early week correlates with 15% higher calmness
                    scores in your Thursday journal entries.
                  </p>
                  <button className="flex items-center gap-2 text-[#7DA47D] font-bold text-sm group">
                    Explore full correlation report
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                  </button>
                </div>
                <div className="w-full md:w-48 aspect-square rounded-3xl bg-surface-container overflow-hidden">
                  <img
                    alt="Serene nature abstraction"
                    className="w-full h-full object-cover opacity-80 mix-blend-multiply"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5Im8jblgaSnD0d0aSKLUiP11iBzSX-hGc1ANZUno_Rf6HNCZPbhIBa1Rgu3NiGbKnVo3qRAmZ5OTHMXDAcHjP3wOGoCxED9Efyk1_RTd866Os0ts7I8Vb48ycq6hwqyyDaED_Od6Sff2KWi1ffigvUzlTMfEmLUxqY6uhP73LJkyqP3VathPs0I9cN5VJKpSc89XrzxEiVDMCZ5yPev5_D7Yq_ZJeo7fKoQx4Pg3iIPZQOhlj_IBLqExtw333Ub6Tt0jjcpYCbaI"
                  />
                </div>
              </section>
            </div>

            {/* Deep Dive Metrics */}
            <section className="mt-10 md:mt-16">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
                <h2 className="text-2xl font-headline font-bold text-on-surface">Biometric Trends</h2>
                <button className="text-sm font-semibold text-[#7DA47D] hover:underline">View All Metrics</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {biometricStats.map((stat) => (
                  <div key={stat.label} className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-[#436745]">{stat.value}</p>
                    </div>
                    <div className={`${stat.positive ? 'text-[#436745]' : 'text-on-surface-variant'} text-right`}>
                      <p className="text-[10px] font-bold">{stat.change}</p>
                      <span className="material-symbols-outlined text-3xl">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HealthAnalytics;
