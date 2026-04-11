import base64
import json
import os
import tempfile
import requests
from flask import Flask, request, jsonify
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

ollama_session = requests.Session()
ollama_session.headers.update({'Content-Type': 'application/json'})

_whisper_model = None


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
    if not user_id:
        return jsonify({'success': False, 'error': 'user_id is required'}), 400

    try:
        user_id = int(user_id)
    except Exception:
        return jsonify({'success': False, 'error': 'user_id must be numeric'}), 400

    chats = list_chats(user_id)
    return jsonify({'success': True, 'chats': chats})


@app.route('/api/chats/<int:chat_id>/messages', methods=['GET'])
def get_messages_for_chat(chat_id):
    messages = get_chat_messages(chat_id)
    return jsonify({'success': True, 'messages': messages})


@app.route('/api/ai/text-emotion', methods=['POST'])
def analyze_text_emotion():
    payload = request.get_json(silent=True) or {}
    text = payload.get('text', '').strip()
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
    text = payload.get('text', '').strip()
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
