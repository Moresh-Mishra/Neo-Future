"""
Exercise Recommendation System using Reinforcement Learning (Q-Learning)
Follows the complete pipeline: User → State → Action → Exercise → Reward → Update
"""

import os
import sys
import json
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv
from db_utils import get_mysql_connection, close_connections

# Load environment variables
load_dotenv()

# MySQL Connection
mysql_conn, mysql_cursor = get_mysql_connection()

# ==================== RL HYPERPARAMETERS ====================
ALPHA = 0.1  # Learning rate
EPSILON = 0.2  # Exploration rate
REWARD_COMPLETED = 2
REWARD_SKIPPED = -1
REWARD_NEUTRAL = 0

# NOTE: ACTIONS are now dynamically generated as EXERCISE IDs
# Both get_q_values() and select_action_for_exercise() compute available actions
# from exercises table based on target muscle and fitness level


class ExerciseRecommender:
    """Main RL-based Exercise Recommendation System"""
    
    def __init__(self, username=None):
        """
        Initialize recommender for a user
        
        Args:
            username: MongoDB username (optional if using manual user ID)
        """
        self.username = username
        self.user = None
        self.user_id = None
        self.state = None
        self.selected_action = None
        self.selected_muscles = []  # List of 3 selected muscles
        self.fitness_level = None
        self.workout_plan = {}  # {muscle: [exercise1, exercise2]}
        self.exercises_per_muscle = 2  # Each muscle gets 2 exercises
        
    # ==================== STEP 1-2: USER LOGIN & OBJECTID CONVERSION ====================
    
    def fetch_user(self):
        """Step 1 & 2: Create or fetch user from MySQL users table"""
        try:
            print("\n📝 User Registration/Login:")
            username = input("Enter username (or press Enter to auto-generate): ").strip()
            
            if not username:
                import random
                username = f"user_{random.randint(100000, 999999)}"
            
            name = input("Enter your name (or press Enter to skip): ").strip()
            if not name:
                name = username
            
            email = input("Enter your email (or press Enter to skip): ").strip()
            
            # Create or update user in MySQL users table (INT auto-increment primary key)
            try:
                insert_user_query = """
                INSERT INTO users (username, name, email, created_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    email = VALUES(email),
                    updated_at = CURRENT_TIMESTAMP
                """
                mysql_cursor.execute(insert_user_query, (username, name, email if email else None))
                mysql_conn.commit()
                
                # Fetch the user_id (INT from MySQL auto-increment)
                fetch_user_query = "SELECT user_id FROM users WHERE username = %s"
                mysql_cursor.execute(fetch_user_query, (username,))
                result = mysql_cursor.fetchone()
                
                if result:
                    self.user_id = int(result['user_id'])  # Store as INT
                    print(f"✓ User found/created: {name}")
                    print(f"  User ID (MySQL INT): {self.user_id}")
                    return True
                else:
                    print("✗ Could not retrieve user ID from database")
                    return False
                    
            except mysql.connector.Error as e:
                if "Duplicate entry" in str(e):
                    # Username already exists, just fetch their ID
                    fetch_user_query = "SELECT user_id, name FROM users WHERE username = %s"
                    mysql_cursor.execute(fetch_user_query, (username,))
                    result = mysql_cursor.fetchone()
                    if result:
                        self.user_id = int(result['user_id'])
                        print(f"✓ User exists: {result['name']}")
                        print(f"  User ID (MySQL INT): {self.user_id}")
                        return True
                raise
                    
        except Exception as e:
            print(f"✗ Error in user setup: {e}")
            print("⚠️  Please ensure MySQL is running and users table exists")
            return False
    
    # ==================== STEP 2B: FETCH AVAILABLE TARGET MUSCLES ====================
    
    def get_available_muscles(self):
        """Fetch all distinct target muscles from exercises table"""
        try:
            query = "SELECT DISTINCT target FROM exercises ORDER BY target"
            mysql_cursor.execute(query)
            results = mysql_cursor.fetchall()
            muscles = [row['target'] for row in results]
            return muscles if muscles else []
        except Exception as e:
            print(f"✗ Error fetching target muscles: {e}")
            return []
    
    # ==================== STEP 3: EXTRACT PREFERENCES ====================
    
    def extract_preferences(self):
        """Step 3: Ask user to select 3 muscle groups via MCQ"""
        # Fetch available target muscles from database
        available_muscles = self.get_available_muscles()
        
        if not available_muscles:
            print("❌ No exercises available in database")
            return False
        
        print(f"\n📋 SELECT YOUR WORKOUT MUSCLES (Pick 3):")
        print(f"{'='*50}\n")
        
        for i, muscle in enumerate(available_muscles, 1):
            print(f"  [{i}] {muscle}")
        
        print()
        
        # Get user to select 3 muscles
        selected_indices = []
        max_selections = min(3, len(available_muscles))  # Allow fewer if not enough muscles
        
        while len(selected_indices) < max_selections:
            try:
                remaining = max_selections - len(selected_indices)
                choice = input(f"Select muscle #{len(selected_indices) + 1} (number): ").strip()
                choice_idx = int(choice) - 1
                
                if choice_idx in selected_indices:
                    print(f"❌ You already selected {available_muscles[choice_idx]}. Choose a different one.")
                    continue
                
                if 0 <= choice_idx < len(available_muscles):
                    selected_indices.append(choice_idx)
                    self.selected_muscles.append(available_muscles[choice_idx])
                    print(f"✓ Selected: {available_muscles[choice_idx]}")
                else:
                    print(f"❌ Invalid choice. Please enter a number between 1 and {len(available_muscles)}")
            except ValueError:
                print("❌ Invalid input. Please enter a number.")
        
        print(f"\n✅ Your Target Muscles:")
        for i, muscle in enumerate(self.selected_muscles, 1):
            print(f"  {i}. {muscle}")
        
        # For fitness level
        print(f"\n📋 Select Fitness Level:")
        print(f"  [1] beginner")
        print(f"  [2] intermediate")
        print(f"  [3] expert\n")
        
        fitness_options = ["beginner", "intermediate", "expert"]
        while True:
            try:
                choice = input("Enter the number of your fitness level: ").strip()
                choice_idx = int(choice) - 1
                
                if 0 <= choice_idx < len(fitness_options):
                    self.fitness_level = fitness_options[choice_idx]
                    print(f"✓ Fitness Level: {self.fitness_level}")
                    return True
                else:
                    print(f"❌ Invalid choice. Please enter a number between 1 and {len(fitness_options)}")
            except ValueError:
                print("❌ Invalid input. Please enter a number.")
    
    # ==================== STEP 4: CONSTRUCT RL STATE ====================
    
    def construct_state(self):
        """Step 4: Build RL state from target muscle and fitness level"""
        # NEW: Simplified state = muscle + fitness level (action is now exercise ID)
        self.state = f"{self.muscle}_{self.fitness_level}"
        
        print(f"\n🧠 RL State Constructed:")
        print(f"  State: {self.state}")
        print(f"  (Actions will be specific exercise IDs for this muscle)")
        return self.state
    
    # ==================== STEP 5: FETCH Q-VALUES ====================
    
    def get_q_values(self):
        """
        NEW APPROACH: Fetch Q-values for EXERCISES (not muscles)
        Actions are now exercise IDs, not target muscle names
        """
        q_values = {}
        source = None
        available_exercises = []
        
        try:
            # First, fetch all available exercises for this muscle and difficulty
            exercise_query = """
            SELECT id, name FROM exercises
            WHERE target = %s AND difficulty = %s
            ORDER BY name
            """
            mysql_cursor.execute(exercise_query, (self.muscle, self.fitness_level))
            exercises = mysql_cursor.fetchall()
            
            if not exercises:
                # Fallback: try without difficulty filter
                mysql_cursor.execute(f"SELECT exercise_id, name FROM exercises WHERE target = %s ORDER BY name", (self.muscle,))
                exercises = mysql_cursor.fetchall()
            
            available_exercises = [ex['exercise_id'] for ex in exercises]
            
            if not available_exercises:
                print(f"⚠️  No exercises found for muscle '{self.muscle}'")
                return {}
            
            # Try user-specific Q-values first
            for exercise_id in available_exercises:
                query = """
                SELECT q_value FROM user_q_table
                WHERE user_id = %s AND state = %s AND action = %s
                """
                mysql_cursor.execute(query, (self.user_id, self.state, exercise_id))
                result = mysql_cursor.fetchone()
                if result:
                    q_values[exercise_id] = result['q_value']
                    source = "User Q-table"
                    break  # Found user data, use it
            
            # If no user Q-values, try global Q-table
            if not q_values:
                for exercise_id in available_exercises:
                    query = """
                    SELECT q_value FROM global_q_table
                    WHERE state = %s AND action = %s
                    """
                    mysql_cursor.execute(query, (self.state, exercise_id))
                    result = mysql_cursor.fetchone()
                    if result:
                        q_values[exercise_id] = result['q_value']
                        source = "Global Q-table"
                        break  # Found global data, use it
            
            # Initialize any missing Q-values to 0.5 (neutral)
            for exercise_id in available_exercises:
                if exercise_id not in q_values:
                    q_values[exercise_id] = 0.5
                    if source is None:
                        source = "Initialized to 0.5"
            
            print(f"\n📈 Q-values retrieved from {source}:")
            print(f"  Available exercises: {len(available_exercises)}")
            for exercise_id, value in sorted(q_values.items(), key=lambda x: x[1], reverse=True)[:10]:
                # Find exercise name for display
                ex_name = next((ex['name'] for ex in exercises if ex['id'] == exercise_id), exercise_id)
                print(f"  [{exercise_id}] {ex_name}: {value:.4f}")
            
            return q_values
            
        except Exception as e:
            print(f"✗ Error fetching Q-values: {e}")
            return {}
    
    # ==================== STEP 6: ACTION SELECTION (ε-GREEDY) ====================
    
    def select_best_exercise(self, q_values):
        """
        NEW: ε-Greedy selection of EXERCISE ID (not muscle)
        - Exploitation: Pick exercise with highest Q-value
        - Exploration: Pick random exercise
        """
        if not q_values:
            print("⚠️  No Q-values available for selection")
            return None
        
        print(f"\n🎯 Exercise Selection (ε-Greedy with ε={EPSILON}):")
        
        # Sort exercises by Q-value
        sorted_exercises = sorted(q_values.items(), key=lambda x: x[1], reverse=True)
        best_exercise_id = sorted_exercises[0][0]
        best_q_value = sorted_exercises[0][1]
        
        print(f"  Best exercise: [{best_exercise_id}] (Q={best_q_value:.4f})")
        print(f"  Options available: {len(q_values)}")
        
        # ε-Greedy: explore with probability ε, exploit with probability 1-ε
        if random.random() < EPSILON:
            # EXPLORE: Pick random exercise
            self.selected_action = random.choice(list(q_values.keys()))
            print(f"  → EXPLORE: Selected random exercise [{self.selected_action}]")
        else:
            # EXPLOIT: Pick best exercise
            self.selected_action = best_exercise_id
            print(f"  → EXPLOIT: Selected best exercise [{self.selected_action}]")
        
        return self.selected_action
    
    # ==================== STEP 7: FETCH EXERCISE DETAILS ====================
    
    def fetch_exercises_for_action(self):
        """
        NEW: Since action IS the exercise ID, fetch that specific exercise
        Returns: List with single exercise dict (to maintain compatibility)
        """
        try:
            # Action is now the exercise ID
            exercise_id = self.selected_action
            
            query = """
            SELECT id, name, target, difficulty, gif_path, instruction 
            FROM exercises
            WHERE id = %s
            """
            mysql_cursor.execute(query, (exercise_id,))
            exercise = mysql_cursor.fetchone()
            
            if exercise:
                print(f"\n🏋️  Exercise Selected:")
                print(f"  ID: {exercise['id']}")
                print(f"  Name: {exercise['name']}")
                print(f"  Target: {exercise['target']}")
                print(f"  Difficulty: {exercise['difficulty']}")
                return [exercise]
            else:
                print(f"\n✗ Exercise ID '{exercise_id}' not found")
                return []
            
        except Exception as e:
            print(f"✗ Error fetching exercise: {e}")
            return []
    
    # ==================== NEW: FETCH ALL EXERCISES & MANUAL SELECTION ====================
    
    def fetch_all_exercises_for_target(self):
        """Fetch ALL exercises for target muscle and difficulty level (no limit)"""
        try:
            target = self.selected_action
            
            query = """
            SELECT id, name, target, difficulty, gif_path, instruction FROM exercises
            WHERE target = %s AND difficulty = %s
            ORDER BY name
            """
            mysql_cursor.execute(query, (target, self.fitness_level))
            exercises = mysql_cursor.fetchall()
            
            if not exercises:
                # Fallback: try without difficulty filter
                fallback_query = """
                SELECT id, name, target, difficulty, gif_path, instruction FROM exercises
                WHERE target = %s
                ORDER BY name
                """
                mysql_cursor.execute(fallback_query, (target,))
                exercises = mysql_cursor.fetchall()
                
                if exercises:
                    print(f"\n📋 Found {len(exercises)} exercises (any difficulty level)")
                else:
                    print(f"  ⚠️  No exercises found for target '{target}'")
                    return []
            else:
                print(f"\n📋 Found {len(exercises)} exercises for {target} ({self.fitness_level} level)")
            
            return exercises
            
        except Exception as e:
            print(f"✗ Error fetching exercises: {e}")
            return []
    
    def show_all_exercises_and_select(self):
        """
        Show ALL exercises for selected target muscle and difficulty.
        Display only name and GIF path for selection (compact).
        Store and return full exercise details.
        """
        # Fetch all exercises
        all_exercises = self.fetch_all_exercises_for_target()
        
        if not all_exercises:
            print("\n⚠️  No exercises available for this configuration")
            return None
        
        # Display exercises in compact format (name and gif only)
        print(f"\n{'='*70}")
        print(f"SELECT AN EXERCISE FOR {self.selected_action.upper()}")
        print(f"{'='*70}\n")
        
        for i, ex in enumerate(all_exercises, 1):
            print(f"  [{i}] {ex['name']}")
            if ex['gif_path']:
                print(f"      📁 {ex['gif_path']}")
        
        print()
        
        # Get user selection
        while True:
            try:
                choice = input(f"Select exercise (1-{len(all_exercises)}): ").strip()
                choice_idx = int(choice) - 1
                
                if 0 <= choice_idx < len(all_exercises):
                    selected_exercise = all_exercises[choice_idx]
                    print(f"\n✅ Selected: {selected_exercise['name']}")
                    
                    # Full details are stored in the selected_exercise variable
                    # Display full details for confirmation
                    print(f"\n{'='*70}")
                    print(f"EXERCISE DETAILS:")
                    print(f"{'='*70}")
                    print(f"  Name: {selected_exercise['name']}")
                    print(f"  Target: {selected_exercise['target']}")
                    print(f"  Difficulty: {selected_exercise['difficulty']}")
                    print(f"  GIF Path: {selected_exercise['gif_path']}")
                    
                    if selected_exercise.get('instruction'):
                        instructions = selected_exercise['instruction']
                        if isinstance(instructions, str):
                            try:
                                instructions = json.loads(instructions)
                            except:
                                pass
                        
                        if isinstance(instructions, list) and instructions:
                            print(f"\n  📝 Instructions:")
                            for i, instr in enumerate(instructions[:3], 1):
                                print(f"     {i}. {instr}")
                    
                    print()
                    confirm = input("Confirm this exercise? (yes/no): ").strip().lower()
                    if confirm in ['yes', 'y']:
                        return selected_exercise
                    else:
                        print("\n→ Please select another exercise\n")
                        for i, ex in enumerate(all_exercises, 1):
                            print(f"  [{i}] {ex['name']}")
                            if ex['gif_path']:
                                print(f"      📁 {ex['gif_path']}")
                        print()
                else:
                    print(f"❌ Invalid choice. Please enter a number between 1 and {len(all_exercises)}")
            except ValueError:
                print("❌ Invalid input. Please enter a number.")
    
    # ==================== STEP 7: SHOW TO USER ====================
    
    def display_exercise_and_get_feedback(self, exercises, exercise_index=0):
        """Step 7: Display exercise and get immediate yes/no feedback"""
        if not exercises:
            print("\n⚠️  No exercises to display")
            return None, None, exercise_index
        
        if exercise_index >= len(exercises):
            print(f"\n⚠️  All {len(exercises)} exercises shown. Please select a different muscle group.")
            return None, None, exercise_index
        
        # Get current exercise
        exercise = exercises[exercise_index]
        
        print(f"\n{'='*60}")
        print(f"RECOMMENDED EXERCISE [{exercise_index + 1}/{len(exercises)}] - Target: {self.selected_action}")
        print(f"{'='*60}\n")
        
        print(f"Exercise: {exercise['name']}")
        print(f"ID: {exercise['id']}")
        print(f"Target: {exercise['target']}")
        print(f"Difficulty: {exercise['difficulty']}")
        print(f"GIF Path: {exercise['gif_path']}")
        
        # Show instructions if available
        if exercise.get('instruction'):
            instructions = exercise['instruction']
            if isinstance(instructions, str):
                try:
                    instructions = json.loads(instructions)
                except:
                    pass
            
            if isinstance(instructions, list) and instructions:
                print(f"\n📝 Instructions:")
                for i, instr in enumerate(instructions[:3], 1):  # Show first 3 instructions
                    print(f"  {i}. {instr}")
            elif instructions:
                print(f"\n📝 Instructions: {instructions}")
        
        print()
        
        # Get immediate yes/no feedback
        while True:
            feedback = input(f"Will you perform this exercise? (yes/no): ").strip().lower()
            
            if feedback in ['yes', 'y']:
                return exercise, "completed", exercise_index
            elif feedback in ['no', 'n']:
                return exercise, "skipped", exercise_index
            else:
                print("❌ Please enter 'yes' or 'no'")
    
    def display_exercise_details(self, exercise):
        """Display details for a single exercise"""
        print(f"Exercise: {exercise['name']}")
        print(f"ID: {exercise['id']}")
        print(f"Target: {exercise['target']}")
        print(f"Difficulty: {exercise['difficulty']}")
        if exercise.get('gif_path'):
            print(f"GIF: {exercise['gif_path']}")
        
        if exercise.get('instruction'):
            instructions = exercise['instruction']
            if isinstance(instructions, str):
                try:
                    instructions = json.loads(instructions)
                except:
                    pass
            
            if isinstance(instructions, list) and instructions:
                print(f"\n📝 Instructions:")
                for i, instr in enumerate(instructions[:3], 1):
                    print(f"  {i}. {instr}")
            elif instructions:
                print(f"\n📝 Instructions: {instructions}")
    
    def get_exercise_feedback(self):
        """PLANNING PHASE: Ask if user wants to add this exercise to workout (yes/no only)"""
        while True:
            feedback = input(f"\nAdd this exercise to your workout? (yes/no): ").strip().lower()
            
            if feedback in ['yes', 'y']:
                return True
            elif feedback in ['no', 'n']:
                return False
            else:
                print("❌ Please enter 'yes' or 'no'")
    
    def get_completion_feedback(self, exercise_name):
        """EXECUTION PHASE: Ask if user actually completed this exercise"""
        while True:
            feedback = input(f"Did you complete '{exercise_name}'? (yes/no): ").strip().lower()
            
            if feedback in ['yes', 'y']:
                return True
            elif feedback in ['no', 'n']:
                return False
            else:
                print("❌ Please enter 'yes' or 'no'")
    
    def get_single_muscle_workout(self, muscle):
        """
        PLANNING PHASE: Get exercises for a specific muscle group
        NEW: Uses exercise IDs as actions, not muscle names
        NOTE: Q-table updates happen AFTER execution, not during planning
        """
        print(f"\n{'='*60}")
        print(f"BUILDING WORKOUT FOR: {muscle.upper()}")
        print(f"Target: {self.exercises_per_muscle} exercises")
        print(f"{'='*60}\n")
        
        # Store current muscle for state construction and Q-value lookup
        self.muscle = muscle
        
        # Construct state for this muscle + fitness level
        self.construct_state()
        
        # Ask user for selection mode
        print(f"\n📋 EXERCISE SELECTION MODE:")
        print(f"  [1] RL Recommendation (Best exercise based on learning)")
        print(f"  [2] Browse All Exercises (Full list, no bias)")
        
        while True:
            try:
                mode_choice = input("\nChoose selection mode (1 or 2): ").strip()
                if mode_choice in ['1', '2']:
                    break
                else:
                    print("❌ Please enter 1 or 2")
            except:
                print("❌ Invalid input")
        
        # Collect exercises for this muscle
        muscle_exercises = []
        
        if mode_choice == '1':
            # ===== MODE 1: RL RECOMMENDATION =====
            # Fetch Q-values for all exercises in this muscle
            q_values = self.get_q_values()
            
            if not q_values:
                print(f"\n⚠️  No exercises available for {muscle}")
                return None
            
            # Collect required number of exercises using RL
            for i in range(self.exercises_per_muscle):
                if not q_values:
                    print(f"⚠️  No more exercises available")
                    break
                
                # Select best exercise using ε-greedy
                selected_ex_id = self.select_best_exercise(q_values)
                
                # Fetch that specific exercise
                exercises = self.fetch_exercises_for_action()
                if not exercises:
                    print(f"⚠️  Could not fetch exercise {selected_ex_id}")
                    continue
                
                selected_exercise = exercises[0]
                
                # Show and ask if user wants to add to workout (PLANNING PHASE - NO FEEDBACK YET)
                print(f"\n{'*'*60}")
                print(f"Exercise {i+1}/{self.exercises_per_muscle}:")
                self.display_exercise_details(selected_exercise)
                
                # Get planning decision (yes/no to add)
                wants_exercise = self.get_exercise_feedback()
                
                if wants_exercise:
                    print(f"✅ Exercise added to workout for {muscle}!")
                    muscle_exercises.append(selected_exercise)
                    
                    # Remove this exercise from Q-values for next selection
                    q_values.pop(selected_ex_id, None)
                    
                    # NOTE: DO NOT update Q-table here - that happens after execution
                else:
                    print(f"❌ Exercise skipped, showing alternatives...")
                    # Remove from Q-values so we don't recommend it again
                    q_values.pop(selected_ex_id, None)
        
        else:
            # ===== MODE 2: BROWSE ALL EXERCISES (NO BIAS) =====
            # Set action to muscle name for this selection mode
            self.selected_action = self.muscle
            exercises_needed = self.exercises_per_muscle
            
            for i in range(exercises_needed):
                print(f"\n{'-'*60}")
                print(f"Selection {i+1} of {exercises_needed} for {muscle}")
                print(f"{'-'*60}")
                
                selected_exercise = self.show_all_exercises_and_select()
                
                if selected_exercise:
                    print(f"✅ Exercise added to workout: {selected_exercise['name']}")
                    muscle_exercises.append(selected_exercise)
                    
                    # NOTE: DO NOT update Q-table here - that happens after execution
                    
                    if i < exercises_needed - 1:
                        print(f"\n→ Need {exercises_needed - (i+1)} more exercise(s) for {muscle}")
                        continue_choice = input("Add another exercise? (yes/no): ").strip().lower()
                        if continue_choice not in ['yes', 'y']:
                            break
                else:
                    print(f"\n⚠️  Could not select exercise")
                    break
        
        return muscle_exercises if len(muscle_exercises) == self.exercises_per_muscle else muscle_exercises if muscle_exercises else None
    
    def display_workout_summary(self):
        """Display complete workout plan"""
        print(f"\n\n{'='*60}")
        print(f"🏋️  YOUR COMPLETE WORKOUT PLAN")
        print(f"{'='*60}\n")
        
        total_exercises = 0
        
        for muscle in self.selected_muscles:
            if muscle in self.workout_plan:
                exercises = self.workout_plan[muscle]
                print(f"\n💪 {muscle.upper()} - {len(exercises)} exercises")
                print(f"{'-'*60}")
                
                for idx, exercise in enumerate(exercises, 1):
                    total_exercises += 1
                    print(f"  {idx}. {exercise['name']}")
                    print(f"     Difficulty: {exercise['difficulty']}")
                    print(f"     GIF: {exercise['gif_path']}")
                    if exercise.get('instruction'):
                        instructions = exercise['instruction']
                        if isinstance(instructions, str):
                            try:
                                instructions = json.loads(instructions)
                            except:
                                pass
                        if isinstance(instructions, list) and instructions:
                            print(f"     Instructions: {', '.join(instructions[:2])}")
        
        print(f"\n{'='*60}")
        print(f"📊 SUMMARY:")
        print(f"  Total Exercises: {total_exercises}")
        print(f"  Target Muscles: {len(self.selected_muscles)}")
        print(f"  Fitness Level: {self.fitness_level.upper()}")
        print(f"{'='*60}\n")
        
        return self.workout_plan
    
    # ==================== STEP 8-12: USER INTERACTION → REWARD → UPDATE ====================
    
    def process_interaction(self, feedback):
        """
        Step 8: Assign reward based on user interaction
        
        Args:
            feedback: 'completed' or 'skipped'
        
        Returns:
            reward value
        """
        if feedback == "completed":
            reward = REWARD_COMPLETED
            print(f"\n✅ Exercise marked as COMPLETED → Reward: +{reward}")
        elif feedback == "skipped":
            reward = REWARD_SKIPPED
            print(f"⏭️ Exercise SKIPPED → Reward: {reward}")
        else:
            reward = REWARD_NEUTRAL
            print(f"⊘ Neutral interaction → Reward: {reward}")
        
        return reward
    
    def update_q_tables(self, reward):
        """Step 9-10: Update Q-tables using Q-learning formula with new schema"""
        try:
            # Get current Q-value and visit count from user Q-table
            query = """
            SELECT q_value, visit_count FROM user_q_table
            WHERE user_id = %s AND state = %s AND action = %s
            """
            mysql_cursor.execute(query, (self.user_id, self.state, self.selected_action))
            result = mysql_cursor.fetchone()
            old_q = result['q_value'] if result else 0.0
            visit_count = (result['visit_count'] if result else 0) + 1
            
            # Q-learning formula: Q(s,a) = Q(s,a) + α * (reward - Q(s,a))
            new_q = old_q + ALPHA * (reward - old_q)
            
            print(f"\n🔄 Q-Learning Update:")
            print(f"  State: {self.state}")
            print(f"  Action: {self.selected_action}")
            print(f"  Old Q: {old_q:.4f}")
            print(f"  Reward: {reward}")
            print(f"  New Q: {new_q:.4f} (formula: {old_q:.4f} + {ALPHA} * ({reward} - {old_q:.4f}))")
            print(f"  Visit Count: {visit_count}")
            
            # Update user Q-table with new schema (q_value, visit_count, last_updated)
            insert_user_query = """
            INSERT INTO user_q_table (user_id, state, action, q_value, visit_count, created_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE 
                q_value = %s,
                visit_count = %s,
                updated_at = CURRENT_TIMESTAMP
            """
            mysql_cursor.execute(insert_user_query, 
                (self.user_id, self.state, self.selected_action, new_q, visit_count, new_q, visit_count))
            print(f"  ✓ User Q-table updated")
            
            # Update global Q-table with new schema
            insert_global_query = """
            INSERT INTO global_q_table (state, action, q_value, visit_count, created_at)
            VALUES (%s, %s, %s, 1, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE 
                q_value = %s,
                visit_count = visit_count + 1,
                updated_at = CURRENT_TIMESTAMP
            """
            mysql_cursor.execute(insert_global_query, (self.state, self.selected_action, new_q, new_q))
            print(f"  ✓ Global Q-table updated")
            
            mysql_conn.commit()
            
        except Exception as e:
            print(f"✗ Error updating Q-tables: {e}")
            mysql_conn.rollback()
    
    def record_user_history(self, exercise, completed):
        """Record interaction in user_history table with new schema"""
        try:
            # Use exercise_id (VARCHAR(10)) from the exercise record
            exercise_id = exercise.get('id') or exercise.get('exercise_id')
            
            query = """
            INSERT INTO user_history 
            (user_id, exercise_id, workout_date, completed, feedback, created_at)
            VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            """
            mysql_cursor.execute(query, (
                self.user_id,
                exercise_id,
                datetime.now().date(),  # workout_date as DATE
                completed,
                1 if completed else 0   # feedback as INT (1 for completed, 0 for skipped)
            ))
            mysql_conn.commit()
            print(f"  ✓ User history recorded")
            
        except Exception as e:
            print(f"✗ Error recording history: {e}")
    
    # ==================== MAIN RECOMMENDATION LOOP ====================
    
    def run(self):
        """Execute full workout pipeline: PLANNING → DISPLAY → EXECUTION → FEEDBACK"""
        print("\n" + "="*60)
        print("🏋️  COMPLETE WORKOUT BUILDER - RL Pipeline")
        print("="*60)
        
        # PHASE 0: User Setup
        if not self.fetch_user():
            return False
        
        if not self.extract_preferences():
            return False
        
        # ==================== PHASE 1: PLANNING ====================
        print("\n" + "="*70)
        print("PHASE 1: WORKOUT PLANNING")
        print("="*70)
        
        # Build workout: For each of 3 selected muscles, get 2 exercises
        for muscle_num, muscle in enumerate(self.selected_muscles, 1):
            print(f"\n\n{'#'*60}")
            print(f"# MUSCLE {muscle_num}/3: {muscle.upper()}")
            print(f"{'#'*60}")
            
            muscle_exercises = self.get_single_muscle_workout(muscle)
            
            if muscle_exercises and len(muscle_exercises) == self.exercises_per_muscle:
                self.workout_plan[muscle] = muscle_exercises
                print(f"\n✅ Completed {muscle} with {len(muscle_exercises)} exercises!")
            else:
                print(f"\n⚠️  Could not complete {muscle} (need 2 exercises)")
                self.workout_plan[muscle] = muscle_exercises if muscle_exercises else []
        
        # ==================== PHASE 2: DISPLAY PLAN ====================
        print("\n" + "="*70)
        print("PHASE 2: YOUR WORKOUT PLAN")
        print("="*70)
        
        final_plan = self.display_workout_summary()
        
        # ==================== PHASE 3: EXECUTION & FEEDBACK ====================
        print("\n" + "="*70)
        print("PHASE 3: WORKOUT EXECUTION & FEEDBACK")
        print("="*70)
        
        start_workout = input("\nAre you ready to perform this workout? (yes/no): ").strip().lower()
        
        if start_workout in ['yes', 'y']:
            print("\n💪 Great! Let's track your performance!\n")
            
            # Collect completion feedback for each exercise
            for muscle in self.selected_muscles:
                if muscle not in self.workout_plan or not self.workout_plan[muscle]:
                    continue
                
                print(f"\n{'='*60}")
                print(f"🏋️  {muscle.upper()}")
                print(f"{'='*60}")
                
                muscleExercises = self.workout_plan[muscle]
                
                for i, exercise in enumerate(muscleExercises, 1):
                    print(f"\n[{i}/{len(muscleExercises)}] {exercise['name']}")
                    print(f"   Difficulty: {exercise['difficulty']}")
                    
                    # Set state and action for Q-table update
                    self.muscle = muscle
                    self.construct_state()
                    self.selected_action = exercise['id']
                    
                    # Ask about completion
                    completed = self.get_completion_feedback(exercise['name'])
                    
                    # Record history
                    self.record_user_history(exercise, completed)
                    
                    # Assign reward and update Q-tables based on ACTUAL performance
                    feedback = "completed" if completed else "skipped"
                    reward = self.process_interaction(feedback)
                    self.update_q_tables(reward)
            
            print("\n" + "="*70)
            print("✅ Workout Complete! Q-tables Updated with Your Performance!")
            print("="*70 + "\n")
        else:
            print("\n⏭️  Workout skipped. No performance data recorded.")
        
        return final_plan


# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("🏋️  WELCOME TO COMPLETE WORKOUT BUILDER - RL Based")
    print("="*70 + "\n")
    print("This system will help you build a complete workout for the day!")
    print("You'll select 3 target muscles and get 2 exercises for each.\n")
    
    while True:
        # Initialize and run recommender (no username needed)
        recommender = ExerciseRecommender()
        workout_plan = recommender.run()
        
        if workout_plan:
            print("\n" + "="*70)
            print("🎯 Your workout plan is ready!")
            print("="*70)
            
            # Ask if they want another session
            again = input("\nBuild another workout for tomorrow? (y/n): ").strip().lower()
            if again != 'y':
                print("\n💪 Great workout! See you next time!")
                break
        else:
            print("\n⚠️  Could not build complete workout. Please try again.")
            again = input("\nTry again? (y/n): ").strip().lower()
            if again != 'y':
                print("\n👋 Goodbye!")
                break
    
    # Close database connections
    close_connections(mysql_conn, mysql_cursor)
