from typing import Callable, Optional, Tuple

from flask import Blueprint, jsonify, request

from db import (
    get_chat_session,
    get_user_by_id,
    save_session_message,
    update_chat_session_activity,
)


def _title_from_message(content: str) -> str:
    words = (content or '').strip().split()
    if not words:
        return 'New Chat'

    slice_size = max(5, min(8, len(words)))
    title = ' '.join(words[:slice_size]).strip()
    if len(title) > 40:
        title = title[:40].rstrip()
    return title or 'New Chat'


def _normalize_emotions(emotions):
    if isinstance(emotions, dict):
        return emotions

    if isinstance(emotions, list):
        normalized = []
        for entry in emotions:
            if isinstance(entry, dict) and 'emotion' in entry:
                normalized.append(
                    {
                        'emotion': str(entry.get('emotion', '')).strip(),
                        'percentage': float(entry.get('percentage', 0) or 0),
                    }
                )
        return normalized

    return []


def _extract_message_and_mood(llm_result) -> Tuple[str, Optional[str]]:
    if isinstance(llm_result, dict):
        message = llm_result.get('message', '').strip()
        mood = llm_result.get('mood')
        return message or "I'm here with you.", mood

    if isinstance(llm_result, str):
        return llm_result.strip() or "I'm here with you.", None

    return "I'm here with you.", None


def create_message_blueprint(
    llm_response_fn: Callable[[str, list], object],
    emotion_extractor_fn: Optional[Callable[[str], list]] = None,
):
    message_bp = Blueprint('message_bp', __name__)

    @message_bp.route('/api/message/send', methods=['POST'])
    def send_message():
        try:
            payload = request.get_json(silent=True) or {}
            session_id = str(payload.get('session_id', '')).strip()
            user_id = str(payload.get('user_id', '')).strip()
            content = str(payload.get('message', '')).strip()

            if not session_id:
                return jsonify({'success': False, 'message': 'session_id is required'}), 400

            if not user_id:
                return jsonify({'success': False, 'message': 'user_id is required'}), 400

            if not content:
                return jsonify({'success': False, 'message': 'message is required'}), 400

            user = get_user_by_id(user_id)
            if user is None:
                return jsonify({'success': False, 'message': 'User not found'}), 404

            session_doc = get_chat_session(session_id)
            if not session_doc:
                return jsonify({'success': False, 'message': 'Session not found'}), 404

            if str(session_doc.get('user_id')) != user_id:
                return jsonify({'success': False, 'message': 'Session does not belong to user'}), 403

            emotions = _normalize_emotions(payload.get('emotions', []))
            if not emotions and emotion_extractor_fn is not None:
                try:
                    emotions = _normalize_emotions(emotion_extractor_fn(content))
                except Exception:
                    emotions = []

            # 1) Save user message first
            user_message_id = save_session_message(
                session_id=session_id,
                user_id=user_id,
                sender='user',
                content=content,
                emotions=emotions,
            )

            # 2) Generate assistant response
            llm_result = llm_response_fn(content, emotions)
            assistant_text, assistant_mood = _extract_message_and_mood(llm_result)

            # 3) Save assistant response
            assistant_emotions = []
            if assistant_mood:
                assistant_emotions = [{'emotion': str(assistant_mood), 'percentage': 100.0}]

            assistant_message_id = save_session_message(
                session_id=session_id,
                user_id=user_id,
                sender='assistant',
                content=assistant_text,
                emotions=assistant_emotions,
            )

            # 4) Update session timestamp and preview
            title_update = None
            existing_title = (session_doc.get('title') or '').strip()
            if not existing_title:
                title_update = _title_from_message(content)

            update_chat_session_activity(
                session_id=session_id,
                last_message_preview=assistant_text[:140],
                title=title_update,
            )

            return jsonify(
                {
                    'success': True,
                    'session_id': session_id,
                    'user_id': user_id,
                    'user_message_id': user_message_id,
                    'assistant_message_id': assistant_message_id,
                    'assistant_response': assistant_text,
                    'title': title_update if title_update is not None else existing_title,
                }
            ), 200
        except Exception as error:
            return jsonify({'success': False, 'message': f'Failed to send message: {error}'}), 500

    return message_bp
