import base64
import os
import tempfile
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

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


def get_ollama_response(user_text, emotions):
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


@app.route('/api/ai/text-emotion', methods=['POST'])
def analyze_text_emotion():
    payload = request.get_json(silent=True) or {}
    text = payload.get('text', '').strip()

    if not text:
        return jsonify({'success': False, 'error': 'Text is required'}), 400

    emotions = analyze_text(text)
    mood = map_mood(emotions[0]['emotion'] if emotions else 'neutral')
    response_message, mood = get_ollama_response(text, emotions)

    return jsonify({
        'success': True,
        'type': 'text',
        'text': text,
        'emotions': emotions,
        'avatarMood': mood,
        'response': response_message,
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
    port = int(os.getenv('EMOTION_PORT', '5001'))
    app.run(host='0.0.0.0', port=port, debug=True)
