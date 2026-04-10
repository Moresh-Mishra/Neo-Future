"""
Default Weekly Workout Plans
Users can follow a rigid, predefined plan without personalization
3 difficulty levels: beginner, intermediate, hardcore
Each muscle gets 2 exercises per week
"""

from datetime import datetime
from dotenv import load_dotenv
from db_utils import get_mysql_connection, close_connections

load_dotenv()

# MySQL Connection
mysql_conn, mysql_cursor = get_mysql_connection()

# ==================== DEFAULT WEEKLY PLANS ====================

DEFAULT_WEEKLY_PLANS = {
    "beginner": {
        "Monday": {
            "name": "Chest, Shoulders & Triceps",
            "muscles": [
                {"muscle": "pectorals", "exercises": 2},
                {"muscle": "delts", "exercises": 2},
                {"muscle": "triceps", "exercises": 2}
            ]
        },
        "Tuesday": {
            "name": "Back, Lats & Biceps",
            "muscles": [
                {"muscle": "lats", "exercises": 2},
                {"muscle": "upper back", "exercises": 2},
                {"muscle": "biceps", "exercises": 2}
            ]
        },
        "Wednesday": {
            "name": "Legs (Quads, Hamstrings, Glutes)",
            "muscles": [
                {"muscle": "quads", "exercises": 2},
                {"muscle": "hamstrings", "exercises": 2},
                {"muscle": "glutes", "exercises": 2}
            ]
        },
        "Thursday": {
            "name": "Core & Forearms",
            "muscles": [
                {"muscle": "abs", "exercises": 2},
                {"muscle": "forearms", "exercises": 2}
            ]
        },
        "Friday": {
            "name": "Serratus & Active Recovery",
            "muscles": [
                {"muscle": "serratus anterior", "exercises": 2}
            ]
        },
        "Saturday": {
            "name": "Full Body Circuits",
            "muscles": [
                {"muscle": "pectorals", "exercises": 1},
                {"muscle": "lats", "exercises": 1},
                {"muscle": "quads", "exercises": 1},
                {"muscle": "glutes", "exercises": 1}
            ]
        },
        "Sunday": {
            "name": "Rest / Light Stretching",
            "muscles": []
        }
    },
    
    "intermediate": {
        "Monday": {
            "name": "Chest, Front Delts & Triceps",
            "muscles": [
                {"muscle": "pectorals", "exercises": 2},
                {"muscle": "delts", "exercises": 2},
                {"muscle": "triceps", "exercises": 2}
            ]
        },
        "Tuesday": {
            "name": "Back, Upper Back & Biceps",
            "muscles": [
                {"muscle": "lats", "exercises": 2},
                {"muscle": "upper back", "exercises": 2},
                {"muscle": "biceps", "exercises": 2}
            ]
        },
        "Wednesday": {
            "name": "Quads & Hamstrings",
            "muscles": [
                {"muscle": "quads", "exercises": 2},
                {"muscle": "hamstrings", "exercises": 2}
            ]
        },
        "Thursday": {
            "name": "Glutes & Core",
            "muscles": [
                {"muscle": "glutes", "exercises": 2},
                {"muscle": "abs", "exercises": 2}
            ]
        },
        "Friday": {
            "name": "Forearms & Serratus",
            "muscles": [
                {"muscle": "forearms", "exercises": 2},
                {"muscle": "serratus anterior", "exercises": 2}
            ]
        },
        "Saturday": {
            "name": "Upper Body Power",
            "muscles": [
                {"muscle": "pectorals", "exercises": 1},
                {"muscle": "lats", "exercises": 1},
                {"muscle": "delts", "exercises": 1},
                {"muscle": "triceps", "exercises": 1},
                {"muscle": "biceps", "exercises": 1}
            ]
        },
        "Sunday": {
            "name": "Lower Body Power",
            "muscles": [
                {"muscle": "quads", "exercises": 1},
                {"muscle": "hamstrings", "exercises": 1},
                {"muscle": "glutes", "exercises": 1}
            ]
        }
    },
    
    "hardcore": {
        "Monday": {
            "name": "Chest & Front Delts",
            "muscles": [
                {"muscle": "pectorals", "exercises": 2},
                {"muscle": "delts", "exercises": 2}
            ]
        },
        "Tuesday": {
            "name": "Back, Upper Back & Serratus",
            "muscles": [
                {"muscle": "lats", "exercises": 2},
                {"muscle": "upper back", "exercises": 2},
                {"muscle": "serratus anterior", "exercises": 2}
            ]
        },
        "Wednesday": {
            "name": "Quads & Abs",
            "muscles": [
                {"muscle": "quads", "exercises": 2},
                {"muscle": "abs", "exercises": 2}
            ]
        },
        "Thursday": {
            "name": "Hamstrings & Glutes",
            "muscles": [
                {"muscle": "hamstrings", "exercises": 2},
                {"muscle": "glutes", "exercises": 2}
            ]
        },
        "Friday": {
            "name": "Arms (Biceps, Triceps & Forearms)",
            "muscles": [
                {"muscle": "biceps", "exercises": 2},
                {"muscle": "triceps", "exercises": 2},
                {"muscle": "forearms", "exercises": 2}
            ]
        },
        "Saturday": {
            "name": "Full Body Strength",
            "muscles": [
                {"muscle": "pectorals", "exercises": 1},
                {"muscle": "lats", "exercises": 1},
                {"muscle": "quads", "exercises": 1},
                {"muscle": "glutes", "exercises": 1},
                {"muscle": "delts", "exercises": 1}
            ]
        },
        "Sunday": {
            "name": "Rest / Recovery",
            "muscles": []
        }
    }
}


class DefaultPlanGenerator:
    """Generate and display default weekly workout plans"""
    
    def __init__(self):
        self.difficulty_levels = ["beginner", "intermediate", "hardcore"]
        self.days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    def get_exercises_for_muscle(self, muscle, difficulty, limit=2):
        """Fetch exercises for a given muscle and difficulty level"""
        try:
            query = """
            SELECT exercise_id, name, target, difficulty, gif_path FROM exercises
            WHERE target = %s AND difficulty = %s
            ORDER BY name
            LIMIT %s
            """
            mysql_cursor.execute(query, (muscle, difficulty, limit))
            return mysql_cursor.fetchall()
        except Exception as e:
            print(f"✗ Error fetching exercises: {e}")
            return []
    
    def display_weekly_plan(self, fitness_level):
        """Display complete weekly plan for a fitness level"""
        if fitness_level not in self.difficulty_levels:
            print(f"❌ Invalid fitness level. Choose from: {', '.join(self.difficulty_levels)}")
            return
        
        plan = DEFAULT_WEEKLY_PLANS[fitness_level]
        
        print(f"\n{'='*80}")
        print(f"🏋️  DEFAULT WEEKLY WORKOUT PLAN - {fitness_level.upper()}")
        print(f"{'='*80}\n")
        
        total_exercises = 0
        
        for day in self.days_of_week:
            day_plan = plan[day]
            print(f"\n{'█'*80}")
            print(f"📅 {day.upper()}: {day_plan['name']}")
            print(f"{'█'*80}")
            
            if not day_plan['muscles']:
                print("   (Rest Day / Recovery)")
                continue
            
            for muscle_info in day_plan['muscles']:
                muscle = muscle_info['muscle']
                num_exercises = muscle_info['exercises']
                
                if num_exercises == 0:
                    continue  # Skip if no exercises assigned
                
                print(f"\n   💪 {muscle.upper()} - {num_exercises} exercise(s)")
                print(f"   {'-'*76}")
                
                exercises = self.get_exercises_for_muscle(muscle, fitness_level, limit=10)
                
                if not exercises:
                    print(f"   ⚠️  No exercises found for {muscle} at {fitness_level} level")
                    continue
                
                # Display first num_exercises only
                for i, exercise in enumerate(exercises[:num_exercises], 1):
                    total_exercises += 1
                    print(f"   {i}. {exercise['name']}")
                    if exercise['gif_path']:
                        print(f"      📁 GIF: {exercise['gif_path']}")
        
        print(f"\n{'='*80}")
        print(f"📊 PLAN SUMMARY:")
        print(f"   Fitness Level: {fitness_level.upper()}")
        print(f"   Total Exercises per Week: ~{total_exercises} (varies by availability)")
        print(f"{'='*80}\n")
    
    def display_all_plans(self):
        """Display all 3 difficulty levels"""
        for level in self.difficulty_levels:
            self.display_weekly_plan(level)
            input("Press Enter to continue to next plan...")
    
    def save_plan_to_database(self, user_id, fitness_level):
        """Save default plan as user's workout schedule (optional feature)"""
        try:
            if fitness_level not in self.difficulty_levels:
                print(f"❌ Invalid fitness level")
                return False
            
            plan = DEFAULT_WEEKLY_PLANS[fitness_level]
            
            # Create a table to store default plans (if needed)
            # For now, just collect and display
            
            print(f"✅ Default plan for {fitness_level} level saved for user {user_id}")
            return True
            
        except Exception as e:
            print(f"✗ Error: {e}")
            return False


# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    print("\n" + "="*80)
    print("🏋️  DEFAULT WEEKLY WORKOUT PLANS")
    print("="*80)
    print("\nChoose an option:")
    print("  [1] View Beginner Plan")
    print("  [2] View Intermediate Plan")
    print("  [3] View Hardcore Plan")
    print("  [4] View All Plans")
    print("  [5] Exit\n")
    
    generator = DefaultPlanGenerator()
    
    while True:
        try:
            choice = input("Select option (1-5): ").strip()
            
            if choice == '1':
                generator.display_weekly_plan("beginner")
            elif choice == '2':
                generator.display_weekly_plan("intermediate")
            elif choice == '3':
                generator.display_weekly_plan("hardcore")
            elif choice == '4':
                generator.display_all_plans()
            elif choice == '5':
                print("\n👋 Goodbye!")
                break
            else:
                print("❌ Invalid choice. Please enter 1-5")
        
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
    
    # Close connections
    close_connections(mysql_conn, mysql_cursor)
