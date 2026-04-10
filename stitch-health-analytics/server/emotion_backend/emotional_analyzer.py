import os

os.environ.setdefault('TRANSFORMERS_NO_TF', '1')
os.environ.setdefault('USE_TF', '0')
os.environ.setdefault('TF_USE_LEGACY_KERAS', '1')
import tempfile
import cv2
import numpy as np

_text_loaded = False
_face_loaded = False
_text_classifier = None
_face_cascade = None
_DeepFace = None


def load_text_models():
    global _text_loaded, _text_classifier

    if _text_loaded:
        return

    from transformers import pipeline

    _text_classifier = pipeline(
        "text-classification",
        model="j-hartmann/emotion-english-distilroberta-base",
        top_k=None,
    )
    _text_loaded = True


def load_face_models():
    global _face_loaded, _face_cascade, _DeepFace

    if _face_loaded:
        return

    try:
        from deepface import DeepFace as DF
    except Exception as exc:
        raise RuntimeError(f"DeepFace import failed: {exc}")

    _face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    _DeepFace = DF
    _face_loaded = True


def analyze_text(text, top_k=2):
    if not text:
        return []

    if not _text_loaded:
        load_text_models()

    emotions = _text_classifier(text)[0]
    sorted_emotions = sorted(emotions, key=lambda x: x['score'], reverse=True)[:top_k]
    return [
        {
            "emotion": emotion['label'],
            "percentage": round(emotion['score'] * 100, 2),
        }
        for emotion in sorted_emotions
    ]


def analyze_face_from_bytes(image_bytes, top_k=2):
    if not image_bytes:
        return [], 0

    if not _face_loaded:
        load_face_models()

    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return [], 0

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, 1.1, 5)
    if len(faces) == 0:
        return [], 0

    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
        cv2.imwrite(tmp_file.name, frame)
        tmp_path = tmp_file.name

    try:
        result = _DeepFace.analyze(
            img_path=tmp_path,
            actions=['emotion'],
            enforce_detection=False,
        )

        if isinstance(result, list):
            result = result[0]

        emotions = result.get('emotion', {})
        sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [
            {
                "emotion": emotion,
                "percentage": round(float(score), 2),
            }
            for emotion, score in sorted_emotions
        ], int(len(faces))
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


def aggregate_emotions(emotion_lists, top_k=2):
    scores = {}

    for emotions in emotion_lists:
        for emotion_data in emotions:
            emotion = emotion_data['emotion']
            percentage = emotion_data['percentage']
            if emotion not in scores:
                scores[emotion] = {'total': 0, 'count': 0}
            scores[emotion]['total'] += percentage
            scores[emotion]['count'] += 1

    averaged = []
    for emotion, bucket in scores.items():
        averaged.append({
            'emotion': emotion,
            'percentage': round(bucket['total'] / bucket['count'], 2),
        })

    averaged.sort(key=lambda x: x['percentage'], reverse=True)
    return averaged[:top_k]


def map_mood(emotion_label):
    if not emotion_label:
        return 'neutral'

    mapping = {
        'joy': 'happy',
        'happiness': 'happy',
        'sadness': 'sad',
        'disappointment': 'sad',
        'anger': 'angry',
        'frustration': 'angry',
        'surprise': 'surprised',
        'amazement': 'surprised',
        'fear': 'fear',
        'anxiety': 'fear',
        'worry': 'fear',
        'disgust': 'disgust',
        'contempt': 'disgust',
        'neutral': 'neutral',
        'calm': 'neutral',
    }
    return mapping.get(emotion_label.lower(), 'neutral')


def build_response(user_text, emotions):
    top_emotion = emotions[0]['emotion'] if emotions else 'neutral'
    mood = map_mood(top_emotion)

    response_map = {
        'happy': "That sounds uplifting. Want to savor that feeling for a moment?",
        'sad': "I'm here with you. Want to take a slow breath together?",
        'angry': "That sounds intense. Want to ground a bit and slow the moment down?",
        'surprised': "That is a lot to take in. Want to unpack what stood out?",
        'fear': "That sounds uneasy. Want a steady, calm check-in?",
        'disgust': "That sounds uncomfortable. Want to reset and focus on what helps?",
        'neutral': "I'm listening. Tell me more about what you're feeling.",
    }

    response = response_map.get(mood, response_map['neutral'])
    if user_text:
        return response
    return "I'm here with you. Share what you're noticing right now."
