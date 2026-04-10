import requests
import json
import os
from dotenv import load_dotenv
from db_utils import get_mysql_connection, close_connections

# Load environment variables from .env file
load_dotenv()

# Get API key from environment variables
EXERCISEDB_API_KEY = os.getenv("EXERCISEDB_API_KEY")

# Validate API key
if not EXERCISEDB_API_KEY:
    print("❌ Error: Missing EXERCISEDB_API_KEY in .env file")
    exit(1)

headers = {
    "X-RapidAPI-Key": EXERCISEDB_API_KEY,
    "X-RapidAPI-Host": "exercisedb.p.rapidapi.com"
}

# Fetch all exercises using pagination
data = []
limit = 10
offset = 0
max_exercises = 80
base_url = "https://exercisedb.p.rapidapi.com/exercises"

while len(data) < max_exercises:
    url = f"{base_url}?limit={limit}&offset={offset}"
    print(f"Fetching: {url}")
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        break
    
    batch = response.json()
    
    if not batch:  # No more exercises
        break
    
    data.extend(batch)
    offset += limit
    print(f"  → Fetched {len(batch)} exercises (Total: {len(data)})\n")
    
    if len(data) >= max_exercises:
        data = data[:max_exercises]  # Trim to exactly 100
        break

print(f"✅ Total exercises fetched: {len(data)}\n")

# Create folder to save images
img_folder = "exercise_gifs"
if not os.path.exists(img_folder):
    os.makedirs(img_folder)

# Connect to MySQL database
db, cursor = get_mysql_connection()

# Insert exercises into database and download GIFs
inserted_count = 0
downloaded_count = 0
skipped_count = 0

for ex in data:
    exercise_id = ex.get("id", "unknown")
    exercise_name = ex.get("name", "unknown")
    body_part = ex.get("bodyPart", "")
    target = ex.get("target", "")
    equipment = ex.get("equipment", "")
    difficulty = ex.get("difficulty", "")
    category = ex.get("category", "")
    description = ex.get("description", "")
    instruction = json.dumps(ex.get("instructions", [])) if ex.get("instructions") else ""
    secondary_muscles = json.dumps(ex.get("secondaryMuscles", [])) if ex.get("secondaryMuscles") else ""
    category = ex.get("category", "")  # Extract category from API
    
    # Format exerciseId with leading zeros (0001, 0002, etc.)
    if isinstance(exercise_id, int):
        exercise_id_formatted = str(exercise_id).zfill(4)
    else:
        exercise_id_formatted = str(exercise_id)
    
    gif_path = f"exercise_gifs/{exercise_id_formatted}.gif"
    
    # Insert into database using new schema - INCLUDES ALL API DATA
    insert_query = """
    INSERT INTO exercises 
    (exercise_id, name, body_part, target, equipment, difficulty, category, description, instruction, secondary_muscles, gif_path, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE
        name=%s, 
        body_part=%s, 
        target=%s, 
        equipment=%s, 
        difficulty=%s,
        category=%s,
        description=%s,
        instruction=%s,
        secondary_muscles=%s,
        gif_path=%s,
        updated_at=CURRENT_TIMESTAMP
    """
    
    try:
        cursor.execute(insert_query, (
            exercise_id_formatted, exercise_name, body_part, target, equipment, difficulty, category, description, instruction, secondary_muscles, gif_path,
            exercise_name, body_part, target, equipment, difficulty, category, description, instruction, secondary_muscles, gif_path
        ))
        db.commit()
        inserted_count += 1
        print(f"✓ Inserted: {exercise_name} ({exercise_id_formatted})")
    except mysql.connector.Error as err:
        print(f"✗ Error inserting {exercise_name}: {err}")
        skipped_count += 1
        continue
    
    # Download GIF
    image_url = f"https://exercisedb.p.rapidapi.com/image?exerciseId={exercise_id_formatted}&resolution=360"
    
    try:
        img_response = requests.get(image_url, headers=headers, timeout=10)
        if img_response.status_code == 200:
            filename = f"{img_folder}/{exercise_id_formatted}.gif"
            with open(filename, "wb") as f:
                f.write(img_response.content)
            downloaded_count += 1
            print(f"  → Downloaded GIF: {exercise_id_formatted}.gif")
        else:
            print(f"  → Failed to download GIF: {img_response.status_code}")
    except Exception as e:
        print(f"  → Error downloading GIF: {e}")

# Close database connection
close_connections(db, cursor)

print(f"\n✅ Summary:")
print(f"  Inserted/Updated: {inserted_count} exercises")
print(f"  Downloaded: {downloaded_count} GIFs")
print(f"  Skipped: {skipped_count} exercises")
print(f"  GIFs saved to '{img_folder}' folder!")