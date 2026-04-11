import base64
import json
import os
import tempfile
import random
from datetime import datetime, timedelta
from functools import wraps
import requests
import jwt
import bcrypt
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

try:
    import pymysql
    from pymysql.cursors import DictCursor
except Exception:
    pymysql = None
    DictCursor = None

from emotional_analyzer import (
    analyze_text,
    analyze_face_from_bytes,
    aggregate_emotions,
    map_mood,
)

load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'small')
WHISPER_DEVICE = os.getenv('WHISPER_DEVICE', 'cpu')
WHISPER_COMPUTE_TYPE = os.getenv('WHISPER_COMPUTE_TYPE', 'int8')
OLLAMA_API_URL = os.getenv('OLLAMA_API_URL', 'http://127.0.0.1:11434/api/chat')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3:latest')
MYSQL_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'exercise_db')
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_EXPIRES_DAYS = 7

ollama_session = requests.Session()
ollama_session.headers.update({'Content-Type': 'application/json'})

_whisper_model = None

# RL Hyperparameters
ALPHA = 0.1
EPSILON = 0.2
REWARD_COMPLETED = 2
REWARD_SKIPPED = -1
REWARD_NEUTRAL = 0

# Exercise GIFs folder (shared with Exercise recommendation project)
EXERCISE_GIFS_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        '..',
        '..',
        'Exercise recomendation project',
        'exercise_gifs',
    )
)


def load_whisper_model():
    global _whisper_model

    if _whisper_model is not None:
        return _whisper_model

    from faster_whisper import WhisperModel

    _whisper_model = WhisperModel(
        WHISPER_MODEL,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE_TYPE,
    )
    return _whisper_model


def get_db_connection():
    if not pymysql:
        return None

    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        cursorclass=DictCursor,
        autocommit=True,
    )


def hash_password(password):
    if password is None:
        return None
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def compare_password(password, hashed):
    if not password or not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def generate_token(payload):
    expires_at = datetime.utcnow() + timedelta(days=JWT_EXPIRES_DAYS)
    token_payload = {**payload, 'exp': expires_at}
    return jwt.encode(token_payload, JWT_SECRET, algorithm='HS256')


def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Access denied. No token provided.'
            }), 401

        token = auth_header.split(' ', 1)[1].strip()
        decoded = verify_token(token)
        if not decoded:
            return jsonify({
                'success': False,
                'error': 'Invalid or expired token.'
            }), 401

        request.user = decoded
        return fn(*args, **kwargs)

    return wrapper


def init_chat_tables():
    conn = get_db_connection()
    if not conn:
        print('MySQL driver unavailable; chat persistence disabled.')
        return

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS ai_chats (
                    chat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NULL,
                    title VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    CONSTRAINT fk_ai_chats_user FOREIGN KEY (user_id)
                        REFERENCES users(user_id) ON DELETE SET NULL
                )
                """
            )

            cursor.execute(
                """
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
                )
                """
            )
    except Exception as exc:
        print(f'Failed to initialize chat tables: {exc}')
    finally:
        conn.close()


def create_chat(user_id=None, title=None):
    conn = get_db_connection()
    if not conn:
        return None

    chat_title = (title or 'New Chat').strip()[:255] or 'New Chat'

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                'INSERT INTO ai_chats (user_id, title) VALUES (%s, %s)',
                (user_id, chat_title),
            )
            chat_id = cursor.lastrowid

        return {
            'chat_id': chat_id,
            'user_id': user_id,
            'title': chat_title,
        }
    except Exception as exc:
        print(f'Failed to create chat: {exc}')
        return None
    finally:
        conn.close()


def list_chats(user_id):
    conn = get_db_connection()
    if not conn:
        return []

    try:
        with conn.cursor() as cursor:
            if user_id is None:
                cursor.execute(
                    """
                    SELECT c.chat_id, c.user_id, c.title, c.created_at, c.updated_at,
                           (SELECT content FROM ai_chat_messages m
                            WHERE m.chat_id = c.chat_id
                            ORDER BY m.created_at DESC LIMIT 1) AS last_message
                    FROM ai_chats c
                    WHERE c.user_id IS NULL
                    ORDER BY c.updated_at DESC
                    """
                )
            else:
                cursor.execute(
                    """
                    SELECT c.chat_id, c.user_id, c.title, c.created_at, c.updated_at,
                           (SELECT content FROM ai_chat_messages m
                            WHERE m.chat_id = c.chat_id
                            ORDER BY m.created_at DESC LIMIT 1) AS last_message
                    FROM ai_chats c
                    WHERE c.user_id = %s
                    ORDER BY c.updated_at DESC
                    """,
                    (user_id,),
                )
            return cursor.fetchall()
    except Exception as exc:
        print(f'Failed to list chats: {exc}')
        return []
    finally:
        conn.close()


def get_chat_messages(chat_id, limit=200):
    conn = get_db_connection()
    if not conn:
        return []

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT message_id, chat_id, role, content, emotion, created_at
                FROM ai_chat_messages
                WHERE chat_id = %s
                ORDER BY created_at ASC
                LIMIT %s
                """,
                (chat_id, limit),
            )
            rows = cursor.fetchall()

        for row in rows:
            if isinstance(row.get('emotion'), str):
                try:
                    row['emotion'] = json.loads(row['emotion'])
                except Exception:
                    row['emotion'] = None
        return rows
    except Exception as exc:
        print(f'Failed to fetch chat messages: {exc}')
        return []
    finally:
        conn.close()


def store_message(chat_id, role, content, emotion=None):
    conn = get_db_connection()
    if not conn or not chat_id or not content:
        return

    try:
        emotion_payload = json.dumps(emotion) if emotion is not None else None
        with conn.cursor() as cursor:
            cursor.execute(
                'INSERT INTO ai_chat_messages (chat_id, role, content, emotion) VALUES (%s, %s, %s, %s)',
                (chat_id, role, content, emotion_payload),
            )
            cursor.execute(
                'UPDATE ai_chats SET updated_at = CURRENT_TIMESTAMP WHERE chat_id = %s',
                (chat_id,),
            )
    except Exception as exc:
        print(f'Failed to store chat message: {exc}')
    finally:
        conn.close()


def sanitize_history(history, limit=12):
    if not isinstance(history, list):
        return []

    cleaned = []
    for item in history:
        if not isinstance(item, dict):
            continue

        role = item.get('role')
        if role not in ('user', 'assistant'):
            continue

        content = str(item.get('content', '')).strip()
        if not content:
            continue

        cleaned.append({
            'role': role,
            'content': content[:2000],
        })

    return cleaned[-limit:]


def get_ollama_response(user_text, emotions, conversation_history=None):
    emotion_str = ", ".join(
        [f"{e['emotion']} ({e['percentage']}%)" for e in emotions]
    ) or "neutral"
    top_emotion = emotions[0]['emotion'] if emotions else "neutral"
    mood = map_mood(top_emotion)

    system_message = (
        "You are EmWell, a calm, warm, and emotionally intelligent AI companion designed to support users with their feelings.Always respond with empathy, validation, and understanding. Acknowledge the user's emotions before offering gentle support or perspective.Keep responses natural, human-like, and non-judgmental. Avoid sounding clinical or robotic.If the user expresses negative emotions (e.g., loneliness, stress, sadness), validate their feelings and offer small, supportive suggestions or comforting thoughts — not solutions or instructions.Encourage the user to share more, but do not pressure them.Never dismiss feelings. Never give harmful, extreme, or medical advice.Keep responses concise (2–4 sentences)."
    )
    user_message = (
        f"User message: \"{user_text}\"\n"
        f"Detected emotions: {emotion_str}\n"
        "Respond as a supportive friend."
    )

    messages = [
        {"role": "system", "content": system_message},
        *sanitize_history(conversation_history),
        {"role": "user", "content": user_message},
    ]

    try:
        response = ollama_session.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.9,
                },
            },
            timeout=120,
        )

        if response.status_code == 200:
            data = response.json()
            message_content = data.get('message', {}).get('content', '').strip()
            if message_content:
                return message_content, mood

        print(f"Ollama failed: status={response.status_code}, body={response.text[:500]}")
    except Exception as exc:
        print(f"Ollama request error: {exc}")

    return "Ollama is unavailable right now.", mood


def get_combined_ollama_response(user_text, face_emotions, text_emotions):
    face_top = face_emotions[0]['emotion'] if face_emotions else 'neutral'
    text_top = text_emotions[0]['emotion'] if text_emotions else 'neutral'

    face_str = ", ".join(
        [f"{e['emotion']} ({e['percentage']}%)" for e in face_emotions]
    ) or "neutral"
    text_str = ", ".join(
        [f"{e['emotion']} ({e['percentage']}%)" for e in text_emotions]
    ) or "neutral"

    mood_source = face_top if face_emotions else text_top
    mood = map_mood(mood_source)

    system_message = (
        "You are EmWell, a warm, empathetic companion. "
        "If face emotion and text emotion differ, explicitly acknowledge the mismatch. "
        "Respond in 2-4 sentences, supportive and natural."
    )
    user_message = (
        f"User message: \"{user_text}\"\n"
        f"Face emotions: {face_str}\n"
        f"Text emotions: {text_str}\n"
        "If they differ, say so gently and ask a clarifying question."
    )

    try:
        response = ollama_session.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message},
                ],
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                },
            },
            timeout=120,
        )

        if response.status_code == 200:
            data = response.json()
            message_content = data.get('message', {}).get('content', '').strip()
            if message_content:
                return message_content, mood

        print(f"Ollama failed: status={response.status_code}, body={response.text[:500]}")
    except Exception as exc:
        print(f"Ollama request error: {exc}")

    if face_top != text_top:
        return (
            f"Your face reads as {map_mood(face_top)}, but your words sound {map_mood(text_top)}. "
            "What feels most true right now?",
            mood,
        )
    return "I hear you. Want to share a bit more about what you're feeling?", mood


def transcribe_audio(audio_bytes):
    model = load_whisper_model()

    with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        segments, _info = model.transcribe(tmp_path)
        text = " ".join(segment.text.strip() for segment in segments).strip()
        return text
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'service': 'stitch-emotion-backend',
    })


@app.route('/api/exercise_gifs/<path:filename>', methods=['GET'])
def serve_exercise_gif(filename):
    return send_from_directory(EXERCISE_GIFS_DIR, filename)


@app.route('/api/exercises/muscles', methods=['GET'])
def get_exercise_muscles():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT DISTINCT target FROM exercises WHERE target IS NOT NULL AND target != '' ORDER BY target"
            )
            rows = cursor.fetchall()
        muscles = [row['target'] for row in rows]
        return jsonify({'success': True, 'muscles': muscles})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/exercises/fitness-levels', methods=['GET'])
def get_exercise_fitness_levels():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT DISTINCT difficulty FROM exercises WHERE difficulty IS NOT NULL AND difficulty != '' ORDER BY difficulty"
            )
            rows = cursor.fetchall()
        levels = [row['difficulty'] for row in rows]
        return jsonify({
            'success': True,
            'levels': levels if levels else ['beginner', 'intermediate', 'expert']
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/exercises', methods=['GET'])
def get_exercises():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    target = request.args.get('target')
    difficulty = request.args.get('difficulty')
    limit = request.args.get('limit')

    query = (
        "SELECT exercise_id, name, body_part, target, equipment, difficulty, category, "
        "description, instruction, secondary_muscles, gif_path "
        "FROM exercises WHERE 1=1"
    )
    params = []

    if target:
        query += " AND target = %s"
        params.append(target)

    if difficulty:
        query += " AND difficulty = %s"
        params.append(difficulty)

    query += " ORDER BY name"

    if limit:
        query += " LIMIT %s"
        params.append(int(limit))

    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            rows = cursor.fetchall()

        exercises = []
        for ex in rows:
            gif_path = ex.get('gif_path')
            gif_url = None
            if gif_path:
                gif_url = f"/api/exercise_gifs/{os.path.basename(gif_path)}"
            exercises.append({
                'id': ex.get('exercise_id'),
                'name': ex.get('name'),
                'body_part': ex.get('body_part'),
                'target': ex.get('target'),
                'equipment': ex.get('equipment'),
                'difficulty': ex.get('difficulty'),
                'category': ex.get('category'),
                'description': ex.get('description'),
                'instruction': ex.get('instruction'),
                'secondary_muscles': ex.get('secondary_muscles'),
                'gif_path': gif_path,
                'gifUrl': gif_url,
            })

        return jsonify({'success': True, 'exercises': exercises})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/q-values', methods=['GET'])
def get_q_values():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    user_id = request.args.get('userId')
    state = request.args.get('state')
    if not user_id or not state:
        return jsonify({'success': False, 'error': 'userId and state are required'}), 400

    try:
        with conn.cursor() as cursor:
            muscle, fitness_level = (state.split('_') + [None])[:2]
            exercise_query = "SELECT exercise_id, name FROM exercises WHERE target = %s"
            params = [muscle]
            if fitness_level:
                exercise_query += " AND difficulty = %s"
                params.append(fitness_level)

            cursor.execute(exercise_query, params)
            exercises = cursor.fetchall()
            available_ids = [ex['exercise_id'] for ex in exercises]

            if not available_ids:
                return jsonify({
                    'success': True,
                    'qValues': {},
                    'source': 'No exercises available',
                    'availableExercises': []
                })

            q_values = {}
            source = 'Initialized to 0.5'

            for exercise_id in available_ids:
                cursor.execute(
                    "SELECT q_value FROM user_q_table WHERE user_id = %s AND state = %s AND action = %s",
                    (user_id, state, exercise_id)
                )
                rows = cursor.fetchall()
                if rows:
                    q_values[exercise_id] = rows[0]['q_value']
                    source = 'User Q-table'

            if not q_values:
                for exercise_id in available_ids:
                    cursor.execute(
                        "SELECT q_value FROM global_q_table WHERE state = %s AND action = %s",
                        (state, exercise_id)
                    )
                    rows = cursor.fetchall()
                    if rows:
                        q_values[exercise_id] = rows[0]['q_value']
                        source = 'Global Q-table'

            for exercise_id in available_ids:
                if exercise_id not in q_values:
                    q_values[exercise_id] = 0.5

        return jsonify({
            'success': True,
            'qValues': q_values,
            'source': source,
            'availableExercises': [{'id': ex['exercise_id'], 'name': ex['name']} for ex in exercises]
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/select-exercise', methods=['POST'])
def select_exercise():
    payload = request.get_json(silent=True) or {}
    q_values = payload.get('qValues')
    if not q_values:
        return jsonify({'success': False, 'error': 'No Q-values provided'}), 400

    try:
        sorted_exercises = sorted(q_values.items(), key=lambda item: item[1], reverse=True)
        best_exercise_id, best_q_value = sorted_exercises[0]

        if random.random() < EPSILON:
            exercise_ids = list(q_values.keys())
            selected_exercise_id = random.choice(exercise_ids)
            selection_type = 'explore'
        else:
            selected_exercise_id = best_exercise_id
            selection_type = 'exploit'

        return jsonify({
            'success': True,
            'selectedExerciseId': selected_exercise_id,
            'selectionType': selection_type,
            'bestExerciseId': best_exercise_id,
            'bestQValue': best_q_value
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500


@app.route('/api/update-q-table', methods=['POST'])
def update_q_table():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    user_id = payload.get('userId')
    state = payload.get('state')
    action = payload.get('action')
    reward = payload.get('reward')

    if not user_id or not state or not action or reward is None:
        return jsonify({'success': False, 'error': 'userId, state, action, and reward are required'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
            user_exists = cursor.fetchall()
            if not user_exists:
                return jsonify({
                    'success': False,
                    'error': 'User does not exist in database. Please ensure user is created before updating Q-table.'
                }), 400

            cursor.execute(
                'SELECT q_value FROM user_q_table WHERE user_id = %s AND state = %s AND action = %s',
                (user_id, state, action)
            )
            rows = cursor.fetchall()
            old_q = rows[0]['q_value'] if rows else 0.0
            new_q = old_q + ALPHA * (reward - old_q)

            cursor.execute(
                """
                INSERT INTO user_q_table (user_id, state, action, q_value, visit_count)
                VALUES (%s, %s, %s, %s, 1)
                ON DUPLICATE KEY UPDATE q_value = %s, visit_count = visit_count + 1
                """,
                (user_id, state, action, new_q, new_q)
            )

            cursor.execute(
                """
                INSERT INTO global_q_table (state, action, q_value, visit_count)
                VALUES (%s, %s, %s, 1)
                ON DUPLICATE KEY UPDATE q_value = %s, visit_count = visit_count + 1
                """,
                (state, action, new_q, new_q)
            )

            cursor.execute(
                """
                INSERT INTO user_history (user_id, exercise_id, completed, feedback, workout_date)
                VALUES (%s, %s, %s, %s, CURDATE())
                """,
                (user_id, action, 1 if reward == REWARD_COMPLETED else 0, 1 if reward == REWARD_COMPLETED else 0)
            )

        return jsonify({
            'success': True,
            'oldQ': old_q,
            'newQ': new_q,
            'message': 'Q-tables updated successfully'
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/save-workout-history', methods=['POST'])
def save_workout_history():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    user_id = payload.get('userId')
    exercise_id = payload.get('exerciseId')
    completed = payload.get('completed')
    reps_completed = payload.get('repsCompleted', 0)
    sets_completed = payload.get('setsCompleted', 0)
    duration_minutes = payload.get('durationMinutes', 0.00)
    calories_burned = payload.get('caloriesBurned', 0)
    notes = payload.get('notes', '')

    if not user_id or not exercise_id:
        return jsonify({'success': False, 'error': 'userId and exerciseId are required'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
            if not cursor.fetchall():
                return jsonify({'success': False, 'error': f'User {user_id} does not exist in database'}), 400

            final_reps = int(reps_completed) if reps_completed is not None else 0
            final_sets = int(sets_completed) if sets_completed is not None else 0
            final_duration = float(duration_minutes) if duration_minutes is not None else 0.00
            final_calories = int(calories_burned) if calories_burned is not None else 0

            cursor.execute(
                """
                INSERT INTO user_history
                (user_id, exercise_id, workout_date, completed, reps_completed, sets_completed, duration_minutes, calories_burned, notes)
                VALUES (%s, %s, CURDATE(), %s, %s, %s, %s, %s, %s)
                """,
                (user_id, exercise_id, 1 if completed else 0, final_reps, final_sets, final_duration, final_calories, notes)
            )
            history_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Workout history saved successfully',
            'historyId': history_id,
            'data': {
                'userId': user_id,
                'exerciseId': exercise_id,
                'completed': completed,
                'repsCompleted': final_reps,
                'setsCompleted': final_sets,
                'durationMinutes': final_duration,
                'caloriesBurned': final_calories
            }
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/auth/register', methods=['POST'])
def register_user():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    full_name = payload.get('fullName')
    email = payload.get('email')
    phone = payload.get('phone')
    password = payload.get('password')
    confirm_password = payload.get('confirmPassword')

    if not full_name or not email or not password or not confirm_password:
        return jsonify({'success': False, 'error': 'All fields are required'}), 400

    if password != confirm_password:
        return jsonify({'success': False, 'error': 'Passwords do not match'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            if cursor.fetchall():
                return jsonify({'success': False, 'error': 'Email already registered'}), 409

            password_hash = hash_password(password)
            cursor.execute(
                'INSERT INTO users (name, email, phone, password_hash) VALUES (%s, %s, %s, %s)',
                (full_name, email, phone or None, password_hash)
            )
            user_id = cursor.lastrowid

            cursor.execute(
                'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = %s',
                (user_id,)
            )
            new_user = cursor.fetchone()

        token = generate_token({'userId': user_id, 'email': email})
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': new_user,
            'token': token,
        }), 201
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/auth/login', methods=['POST'])
def login_user():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    email = payload.get('email')
    password = payload.get('password')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            users = cursor.fetchall()
            if not users:
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

            user = users[0]
            if not compare_password(password, user.get('password_hash')):
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

        token = generate_token({'userId': user['user_id'], 'email': user['email']})
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'user_id': user['user_id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user.get('phone')
            },
            'token': token
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/auth/me', methods=['GET'])
@auth_required
def get_current_user():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    user_id = request.user.get('userId')
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = %s',
                (user_id,)
            )
            users = cursor.fetchall()
            if not users:
                return jsonify({'success': False, 'error': 'User not found'}), 404

        return jsonify({'success': True, 'user': users[0]})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/user', methods=['POST'])
def get_or_create_user():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    user_id = payload.get('userId')
    name = payload.get('name')
    email = payload.get('email')

    if not user_id:
        return jsonify({'success': False, 'error': 'userId is required'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
            existing = cursor.fetchall()
            if existing:
                return jsonify({'success': True, 'user': existing[0], 'source': 'existing'})

            cursor.execute(
                'INSERT INTO users (user_id, name, email) VALUES (%s, %s, %s)',
                (user_id, name or 'User', email or None)
            )
            cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
            new_user = cursor.fetchone()

        return jsonify({'success': True, 'user': new_user, 'source': 'created'})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/user/history', methods=['GET'])
def get_user_history():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    user_id = request.args.get('userId')
    if not user_id:
        return jsonify({'success': False, 'error': 'userId is required'}), 400

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT h.*, e.name as exercise_name, e.target, e.difficulty
                FROM user_history h
                LEFT JOIN exercises e ON h.exercise_id = e.exercise_id
                WHERE h.user_id = %s
                ORDER BY h.workout_date DESC, h.created_at DESC
                LIMIT 50
                """,
                (user_id,)
            )
            rows = cursor.fetchall()

        return jsonify({'success': True, 'history': rows})
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/workout/today', methods=['GET'])
def get_workout_today():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    difficulty = request.args.get('difficulty', 'beginner')

    weekly_plans = {
        'beginner': {
            'Monday': {
                'name': 'Chest, Shoulders & Triceps',
                'muscles': ['pectorals', 'delts', 'triceps']
            },
            'Tuesday': {
                'name': 'Back, Lats & Biceps',
                'muscles': ['lats', 'upper back', 'biceps']
            },
            'Wednesday': {
                'name': 'Legs (Quads, Hamstrings, Glutes)',
                'muscles': ['quads', 'hamstrings', 'glutes']
            },
            'Thursday': {
                'name': 'Core & Leg Accessory',
                'muscles': ['abs', 'hamstrings']
            },
            'Friday': {
                'name': 'Glutes & Posterior Chain',
                'muscles': ['glutes', 'lats']
            },
            'Saturday': {
                'name': 'Full Body Circuits',
                'muscles': ['pectorals', 'lats', 'quads', 'glutes']
            },
            'Sunday': {
                'name': 'Rest / Light Stretching',
                'muscles': []
            }
        },
        'intermediate': {
            'Monday': {
                'name': 'Chest, Shoulders & Triceps',
                'muscles': ['pectorals', 'delts', 'triceps']
            },
            'Tuesday': {
                'name': 'Back & Biceps',
                'muscles': ['lats', 'upper back', 'biceps']
            },
            'Wednesday': {
                'name': 'Quads & Hamstrings',
                'muscles': ['quads', 'hamstrings']
            },
            'Thursday': {
                'name': 'Glutes & Core',
                'muscles': ['glutes', 'abs']
            },
            'Friday': {
                'name': 'Shoulders & Accessory',
                'muscles': ['delts', 'triceps']
            },
            'Saturday': {
                'name': 'Upper Body Power',
                'muscles': ['pectorals', 'lats', 'delts', 'triceps', 'biceps']
            },
            'Sunday': {
                'name': 'Lower Body Power',
                'muscles': ['quads', 'hamstrings', 'glutes']
            }
        },
        'expert': {
            'Monday': {
                'name': 'Chest, Shoulders & Triceps',
                'muscles': ['pectorals', 'delts', 'triceps']
            },
            'Tuesday': {
                'name': 'Back & Biceps',
                'muscles': ['lats', 'upper back', 'biceps']
            },
            'Wednesday': {
                'name': 'Quads & Hamstrings',
                'muscles': ['quads', 'hamstrings']
            },
            'Thursday': {
                'name': 'Glutes & Core',
                'muscles': ['glutes', 'abs']
            },
            'Friday': {
                'name': 'Upper Back & Serratus',
                'muscles': ['upper back', 'serratus anterior']
            },
            'Saturday': {
                'name': 'Upper Body Power',
                'muscles': ['pectorals', 'lats', 'delts', 'triceps', 'biceps']
            },
            'Sunday': {
                'name': 'Lower Body Power',
                'muscles': ['quads', 'hamstrings', 'glutes']
            }
        }
    }

    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    today_index = (datetime.now().weekday() + 1) % 7
    today = days[today_index]
    plan = weekly_plans.get(difficulty, weekly_plans['beginner'])
    today_plan = plan.get(today)

    if not today_plan:
        return jsonify({'success': False, 'error': f'No plan found for {today}'}), 400

    if not today_plan['muscles']:
        return jsonify({
            'success': True,
            'day': today,
            'difficulty': difficulty,
            'dayName': today_plan['name'],
            'muscles': [],
            'exercises': [],
            'isRestDay': True,
            'totalDuration': '0 mins',
            'totalCalories': 0
        })

    try:
        all_exercises = []
        total_duration = 0
        total_calories = 0

        with conn.cursor() as cursor:
            for muscle in today_plan['muscles']:
                cursor.execute(
                    """
                    SELECT exercise_id, name, target, difficulty, gif_path, equipment, category, description, instruction
                    FROM exercises
                    WHERE target = %s AND difficulty = %s
                    LIMIT 3
                    """,
                    (muscle, difficulty)
                )
                exercises = cursor.fetchall()

                for ex in exercises:
                    duration = random.randint(8, 17)
                    calories = random.randint(30, 79)
                    total_duration += duration
                    total_calories += calories

                    gif_path = ex.get('gif_path')
                    gif_url = (
                        f"/api/exercise_gifs/{os.path.basename(gif_path)}"
                        if gif_path else
                        'https://via.placeholder.com/200x200?text=No+GIF'
                    )

                    all_exercises.append({
                        **ex,
                        'muscleGroup': muscle,
                        'duration': f"{duration} mins",
                        'sets': f"{random.randint(2, 4)} Sets / {random.randint(8, 15)} Reps",
                        'caloriesBurn': calories,
                        'gifUrl': gif_url,
                    })

        return jsonify({
            'success': True,
            'day': today,
            'difficulty': difficulty,
            'dayName': today_plan['name'],
            'muscles': today_plan['muscles'],
            'exercises': all_exercises,
            'isRestDay': False,
            'totalDuration': f"{total_duration} mins",
            'totalCalories': total_calories
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/reflections/submit', methods=['POST'])
@auth_required
def submit_reflection():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    payload = request.get_json(silent=True) or {}
    user_id = payload.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    try:
        with conn.cursor() as cursor:
            query = """
                INSERT INTO daily_reflections (
                  user_id, overall_feeling, yesterday_rating, emotions, mood_affect,
                  sleep_quality, sleep_hours, energy_level, completed_tasks,
                  stress_level, felt_lonely, best_part, did_well,
                  took_time_for_self, something_made_smile, today_outlook,
                  emotionally_okay, disturbing_thoughts, submission_date
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURDATE())
                ON DUPLICATE KEY UPDATE
                  overall_feeling = VALUES(overall_feeling),
                  yesterday_rating = VALUES(yesterday_rating),
                  emotions = VALUES(emotions),
                  mood_affect = VALUES(mood_affect),
                  sleep_quality = VALUES(sleep_quality),
                  sleep_hours = VALUES(sleep_hours),
                  energy_level = VALUES(energy_level),
                  completed_tasks = VALUES(completed_tasks),
                  stress_level = VALUES(stress_level),
                  felt_lonely = VALUES(felt_lonely),
                  best_part = VALUES(best_part),
                  did_well = VALUES(did_well),
                  took_time_for_self = VALUES(took_time_for_self),
                  something_made_smile = VALUES(something_made_smile),
                  today_outlook = VALUES(today_outlook),
                  emotionally_okay = VALUES(emotionally_okay),
                  disturbing_thoughts = VALUES(disturbing_thoughts),
                  updated_at = CURRENT_TIMESTAMP
            """

            values = (
                user_id,
                payload.get('overall_feeling'),
                payload.get('yesterday_rating'),
                json.dumps(payload.get('emotions')),
                payload.get('mood_affect'),
                payload.get('sleep_quality'),
                payload.get('sleep_hours'),
                payload.get('energy_level'),
                payload.get('completed_tasks'),
                payload.get('stress_level'),
                payload.get('felt_lonely'),
                payload.get('best_part'),
                payload.get('did_well'),
                payload.get('took_time_for_self'),
                payload.get('something_made_smile'),
                payload.get('today_outlook'),
                payload.get('emotionally_okay'),
                payload.get('disturbing_thoughts')
            )

            cursor.execute(query, values)
            reflection_id = cursor.lastrowid

        return jsonify({
            'success': True,
            'message': 'Daily reflection submitted successfully',
            'reflection_id': reflection_id
        })
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/reflections/has-submitted-today/<int:user_id>', methods=['GET'])
@auth_required
def has_submitted_today(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT reflection_id, submission_date FROM daily_reflections
                WHERE user_id = %s AND submission_date = CURDATE()
                LIMIT 1
                """,
                (user_id,)
            )
            rows = cursor.fetchall()

        return jsonify({
            'hasSubmitted': len(rows) > 0,
            'submissionDate': rows[0]['submission_date'] if rows else None
        })
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/reflections/<int:user_id>', methods=['GET'])
@auth_required
def get_reflections(user_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database unavailable'}), 500

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM daily_reflections
                WHERE user_id = %s
                ORDER BY submission_date DESC
                LIMIT 30
                """,
                (user_id,)
            )
            rows = cursor.fetchall()

        parsed_rows = []
        for row in rows:
            emotions_array = []
            try:
                if row.get('emotions'):
                    emotions_value = row['emotions']
                    emotions_array = json.loads(emotions_value) if isinstance(emotions_value, str) else emotions_value
                    if not isinstance(emotions_array, list):
                        emotions_array = []
            except Exception:
                if isinstance(row.get('emotions'), str) and row['emotions']:
                    emotions_array = [value.strip() for value in row['emotions'].split(',')]

            row['emotions'] = emotions_array
            parsed_rows.append(row)

        return jsonify({'success': True, 'reflections': parsed_rows})
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/workouts/active-minutes', methods=['GET'])
def get_active_minutes():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database unavailable'}), 500

    user_id = request.args.get('userId')
    range_type = request.args.get('range', 'week')

    if not user_id:
        return jsonify({'success': False, 'error': 'userId is required'}), 400

    GOAL_DAILY = 120
    GOAL_WEEKLY = 540
    GOAL_MONTHLY = 2400

    data_points = []
    month_name = ''

    try:
        with conn.cursor() as cursor:
            if range_type == 'day':
                query = (
                    "SELECT DATE(uh.workout_date) as workout_date, uh.exercise_id, "
                    "SUM(uh.duration_minutes) as duration_minutes "
                    "FROM user_history uh "
                    "WHERE uh.user_id = %s AND DATE(uh.workout_date) = CURDATE() "
                    "GROUP BY DATE(uh.workout_date), uh.exercise_id "
                    "ORDER BY uh.exercise_id"
                )
                cursor.execute(query, (user_id,))
                rows = cursor.fetchall()

                total_minutes = sum(float(row['duration_minutes'] or 0) for row in rows)
                data_points = [{
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'label': datetime.now().strftime('%a, %b %d'),
                    'minutes': round(total_minutes, 2),
                    'goal': GOAL_DAILY,
                    'percentage': round((total_minutes / GOAL_DAILY) * 100) if GOAL_DAILY else 0
                }]

            elif range_type == 'week':
                today = datetime.now()
                days_since_sunday = (today.weekday() + 1) % 7
                start_of_week = today - timedelta(days=days_since_sunday)
                end_of_week = start_of_week + timedelta(days=6)
                week_start_str = start_of_week.strftime('%Y-%m-%d')
                week_end_str = end_of_week.strftime('%Y-%m-%d')

                query = (
                    "SELECT DATE(uh.workout_date) as workout_date, uh.exercise_id, "
                    "SUM(uh.duration_minutes) as duration_minutes "
                    "FROM user_history uh "
                    "WHERE uh.user_id = %s AND DATE(uh.workout_date) >= %s AND DATE(uh.workout_date) <= %s "
                    "GROUP BY DATE(uh.workout_date), uh.exercise_id "
                    "ORDER BY workout_date, uh.exercise_id"
                )
                cursor.execute(query, (user_id, week_start_str, week_end_str))
                rows = cursor.fetchall()

                date_map = {}
                for row in rows:
                    date_str = row['workout_date'].strftime('%Y-%m-%d')
                    date_map[date_str] = date_map.get(date_str, 0) + float(row['duration_minutes'] or 0)

                day_names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                for i in range(7):
                    date = start_of_week + timedelta(days=i)
                    date_str = date.strftime('%Y-%m-%d')
                    minutes = round(date_map.get(date_str, 0), 2)
                    data_points.append({
                        'date': date_str,
                        'label': day_names[i],
                        'minutes': minutes,
                        'goal': GOAL_DAILY,
                        'percentage': round((minutes / GOAL_DAILY) * 100) if GOAL_DAILY else 0
                    })

            elif range_type == 'month':
                today = datetime.now()
                year = today.year
                month = today.month
                month_start = datetime(year, month, 1)
                next_month = datetime(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)
                month_end = next_month - timedelta(days=1)
                month_start_str = month_start.strftime('%Y-%m-%d')
                month_end_str = month_end.strftime('%Y-%m-%d')
                days_in_month = month_end.day

                query = (
                    "SELECT DATE(uh.workout_date) as workout_date, uh.exercise_id, "
                    "SUM(uh.duration_minutes) as duration_minutes "
                    "FROM user_history uh "
                    "WHERE uh.user_id = %s AND DATE(uh.workout_date) >= %s AND DATE(uh.workout_date) <= %s "
                    "GROUP BY DATE(uh.workout_date), uh.exercise_id "
                    "ORDER BY workout_date, uh.exercise_id"
                )
                cursor.execute(query, (user_id, month_start_str, month_end_str))
                rows = cursor.fetchall()

                date_map = {}
                for row in rows:
                    date_str = row['workout_date'].strftime('%Y-%m-%d')
                    date_map[date_str] = date_map.get(date_str, 0) + float(row['duration_minutes'] or 0)

                month_name = today.strftime('%B')
                for day in range(1, days_in_month + 1):
                    date = datetime(year, month, day)
                    date_str = date.strftime('%Y-%m-%d')
                    minutes = round(date_map.get(date_str, 0), 2)
                    data_points.append({
                        'date': date_str,
                        'label': f"{day}" if day % 7 == 1 else '',
                        'minutes': minutes,
                        'goal': GOAL_DAILY,
                        'percentage': round((minutes / GOAL_DAILY) * 100) if GOAL_DAILY else 0
                    })

        total_minutes = sum(point['minutes'] for point in data_points)
        total_goal = GOAL_DAILY
        total_percentage = 0

        if range_type == 'week':
            total_goal = GOAL_WEEKLY
            total_percentage = round((total_minutes / total_goal) * 100) if total_goal else 0
        elif range_type == 'month':
            total_goal = GOAL_MONTHLY
            total_percentage = round((total_minutes / total_goal) * 100) if total_goal else 0
        else:
            total_percentage = round((total_minutes / GOAL_DAILY) * 100) if GOAL_DAILY else 0

        return jsonify({
            'success': True,
            'range': range_type,
            'dateLabel': '',
            'monthName': month_name,
            'data': data_points,
            'summary': {
                'total': round(total_minutes, 2),
                'goal': total_goal,
                'percentage': total_percentage,
                'unit': 'hours' if range_type == 'month' else 'minutes'
            }
        })
    except Exception as exc:
        return jsonify({'success': False, 'error': str(exc)}), 500
    finally:
        conn.close()


@app.route('/api/ai/analyze', methods=['POST'])
def analyze_emotion():
    payload = request.get_json(silent=True) or {}
    text = payload.get('text')
    analyse_type = payload.get('analyse_type', 'text')

    if not text:
        return jsonify({'success': False, 'error': 'text is required'}), 400

    if analyse_type in ('text', 'emotion'):
        emotions = analyze_text(text)
        return jsonify({'success': True, 'emotion': emotions})

    return jsonify({
        'success': True,
        'emotion': {
            'predicted_emotion': 'neutral',
            'confidence': 0.5,
            'scores': {
                'neutral': 0.5,
                'positive': 0.25,
                'negative': 0.25
            }
        }
    })


@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    payload = request.get_json(silent=True) or {}
    user_message = (payload.get('user_message') or payload.get('text') or '').strip()
    user_id = payload.get('user_id')
    chat_id = payload.get('chat_id')
    history = payload.get('history', [])

    if not user_message:
        return jsonify({'success': False, 'error': 'user_message (or text) is required'}), 400

    try:
        chat_id = int(chat_id) if chat_id is not None else None
    except Exception:
        chat_id = None

    try:
        user_id = int(user_id) if user_id is not None else None
    except Exception:
        user_id = None

    if not chat_id:
        new_chat = create_chat(user_id=user_id, title=f"Chat {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        chat_id = new_chat['chat_id'] if new_chat else None

    conversation_history = sanitize_history(history)
    neutral_emotions = [{'emotion': 'neutral', 'percentage': 100.0}]
    response_message, mood = get_ollama_response(user_message, neutral_emotions, conversation_history)

    if chat_id:
        store_message(chat_id, 'user', user_message, None)
        store_message(chat_id, 'assistant', response_message, {'mood': mood})

    return jsonify({
        'success': True,
        'chat_id': chat_id,
        'user_message': user_message,
        'ai_response': response_message,
        'response': response_message,
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/chats/new', methods=['POST'])
def create_new_chat():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get('user_id')
    title = payload.get('title')

    try:
        user_id = int(user_id) if user_id is not None else None
    except Exception:
        return jsonify({'success': False, 'error': 'user_id must be numeric'}), 400

    chat = create_chat(user_id=user_id, title=title)
    if not chat:
        return jsonify({'success': False, 'error': 'Unable to create chat'}), 500

    return jsonify({'success': True, 'chat': chat})


@app.route('/api/chats', methods=['GET'])
def list_user_chats():
    user_id = request.args.get('user_id')

    if user_id:
        try:
            user_id = int(user_id)
        except Exception:
            return jsonify({'success': False, 'error': 'user_id must be numeric'}), 400
    else:
        user_id = None

    chats = list_chats(user_id)
    return jsonify({'success': True, 'chats': chats})


@app.route('/api/chats/<int:chat_id>/messages', methods=['GET'])
def get_messages_for_chat(chat_id):
    messages = get_chat_messages(chat_id)
    return jsonify({'success': True, 'messages': messages})


@app.route('/api/ai/text-emotion', methods=['POST'])
def analyze_text_emotion():
    payload = request.get_json(silent=True) or {}
    text = (payload.get('text') or payload.get('user_message') or '').strip()
    conversation_history = payload.get('history', [])
    chat_id = payload.get('chat_id')
    user_id = payload.get('user_id')

    if not text:
        return jsonify({'success': False, 'error': 'Text is required'}), 400

    try:
        emotions = analyze_text(text)
    except Exception as exc:
        print(f"Text emotion model unavailable, using neutral fallback: {exc}")
        emotions = [{"emotion": "neutral", "percentage": 100.0}]

    if not emotions:
        emotions = [{"emotion": "neutral", "percentage": 100.0}]

    try:
        chat_id = int(chat_id) if chat_id is not None else None
    except Exception:
        chat_id = None

    try:
        user_id = int(user_id) if user_id is not None else None
    except Exception:
        user_id = None

    if not chat_id and user_id is not None:
        new_chat = create_chat(user_id=user_id, title=text[:50] or 'New Chat')
        chat_id = new_chat['chat_id'] if new_chat else None

    if chat_id and (not isinstance(conversation_history, list) or len(conversation_history) == 0):
        db_messages = get_chat_messages(chat_id, limit=12)
        conversation_history = [
            {'role': row.get('role'), 'content': row.get('content', '')}
            for row in db_messages
            if row.get('role') in ('user', 'assistant') and row.get('content')
        ]

    mood = map_mood(emotions[0]['emotion'] if emotions else 'neutral')
    response_message, mood = get_ollama_response(text, emotions, conversation_history)

    if chat_id:
        store_message(chat_id, 'user', text, emotions)
        store_message(chat_id, 'assistant', response_message, {'mood': mood})

    return jsonify({
        'success': True,
        'type': 'text',
        'text': text,
        'emotions': emotions,
        'avatarMood': mood,
        'response': response_message,
        'chat_id': chat_id,
    })


@app.route('/api/ai/facial-emotion', methods=['POST'])
def analyze_facial_emotion():
    payload = request.get_json(silent=True) or {}
    image_data = payload.get('image', '')

    if not image_data:
        return jsonify({'success': False, 'error': 'Image is required'}), 400

    if ',' in image_data:
        image_data = image_data.split(',')[1]

    try:
        image_bytes = base64.b64decode(image_data)
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid image encoding'}), 400

    emotions, face_count = analyze_face_from_bytes(image_bytes)
    if not emotions:
        return jsonify({
            'success': False,
            'error': 'No face detected',
            'face_count': face_count,
        })

    response_message, mood = get_ollama_response('I just shared my camera snapshot.', emotions)

    return jsonify({
        'success': True,
        'type': 'facial',
        'emotions': emotions,
        'avatarMood': mood,
        'response': response_message,
        'face_count': face_count,
    })


@app.route('/api/ai/voice-emotion', methods=['POST'])
def analyze_voice_emotion():
    if 'audio' not in request.files:
        return jsonify({'success': False, 'error': 'Audio file is required'}), 400

    audio_file = request.files['audio']
    audio_bytes = audio_file.read()

    try:
        transcript = transcribe_audio(audio_bytes)
    except Exception as exc:
        print(f"Voice emotion error: {exc}")
        return jsonify({'success': False, 'error': str(exc)}), 500

    if not transcript:
        return jsonify({'success': False, 'error': 'Transcription empty'}), 400

    emotions = analyze_text(transcript)
    mood = map_mood(emotions[0]['emotion'] if emotions else 'neutral')
    response_message, mood = get_ollama_response(transcript, emotions)

    return jsonify({
        'success': True,
        'type': 'voice',
        'text': transcript,
        'emotions': emotions,
        'avatarMood': mood,
        'response': response_message,
    })


@app.route('/api/ai/voice-transcribe', methods=['POST'])
def transcribe_voice_chunk():
    if 'audio' not in request.files:
        return jsonify({'success': False, 'error': 'Audio file is required'}), 400

    audio_file = request.files['audio']
    audio_bytes = audio_file.read()

    try:
        transcript = transcribe_audio(audio_bytes)
    except Exception as exc:
        print(f"Voice transcribe error: {exc}")
        return jsonify({'success': False, 'error': str(exc)}), 500

    if not transcript:
        return jsonify({'success': False, 'error': 'Transcription empty'}), 400

    return jsonify({
        'success': True,
        'text': transcript,
    })


@app.route('/api/ai/combined-emotion', methods=['POST'])
def analyze_combined_emotion():
    payload = request.get_json(silent=True) or {}
    text = (payload.get('text') or payload.get('user_message') or '').strip()
    image_data = payload.get('image', '')

    emotion_sets = []
    text_emotions = []
    face_emotions = []

    if text:
        text_emotions = analyze_text(text)
        emotion_sets.append(text_emotions)

    if image_data:
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        try:
            image_bytes = base64.b64decode(image_data)
            face_emotions, _ = analyze_face_from_bytes(image_bytes)
            if face_emotions:
                emotion_sets.append(face_emotions)
        except Exception:
            pass

    if not emotion_sets:
        return jsonify({'success': False, 'error': 'No valid input provided'}), 400

    combined = aggregate_emotions(emotion_sets)
    response_message, mood = get_combined_ollama_response(
        text or 'How am I feeling?',
        face_emotions,
        text_emotions,
    )

    return jsonify({
        'success': True,
        'type': 'combined',
        'emotions': combined,
        'avatarMood': mood,
        'response': response_message,
    })


if __name__ == '__main__':
    init_chat_tables()
    port = int(os.getenv('EMOTION_PORT', '5001'))
    app.run(host='0.0.0.0', port=port, debug=True)
