from typing import Any, Dict

from flask import Blueprint, jsonify, request

from db import (
    create_chat_session,
    get_chat_session,
    get_messages_for_session,
    get_user_by_id,
    init_chat_storage_indexes,
    list_chat_sessions_for_user,
)


session_bp = Blueprint('session_bp', __name__)


def _serialize_session(session_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': str(session_doc['_id']),
        'user_id': str(session_doc['user_id']),
        'title': session_doc.get('title', ''),
        'created_at': session_doc['created_at'].isoformat(),
        'updated_at': session_doc['updated_at'].isoformat(),
        'last_message_preview': session_doc.get('last_message_preview', ''),
    }


def _serialize_message(message_doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': str(message_doc['_id']),
        'session_id': str(message_doc['session_id']),
        'user_id': str(message_doc['user_id']),
        'sender': message_doc['sender'],
        'content': message_doc['content'],
        'emotions': message_doc.get('emotions', []),
        'timestamp': message_doc['timestamp'].isoformat(),
    }


@session_bp.route('/api/session/create', methods=['POST'])
def create_session():
    try:
        init_chat_storage_indexes()

        payload = request.get_json(silent=True) or {}
        user_id = str(payload.get('user_id', '')).strip()
        if not user_id:
            return jsonify({'success': False, 'message': 'user_id is required'}), 400

        user = get_user_by_id(user_id)
        if user is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        session_id = create_chat_session(user_id)
        return jsonify({'success': True, 'session_id': session_id}), 201
    except Exception as error:
        return jsonify({'success': False, 'message': f'Failed to create session: {error}'}), 500


@session_bp.route('/api/session/list/<user_id>', methods=['GET'])
def list_sessions(user_id):
    try:
        user = get_user_by_id(user_id)
        if user is None:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        sessions = [_serialize_session(session) for session in list_chat_sessions_for_user(user_id)]

        return jsonify({'success': True, 'sessions': sessions}), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Failed to list sessions: {error}'}), 500


@session_bp.route('/api/session/<session_id>', methods=['GET'])
def get_session_history(session_id):
    try:
        session_doc = get_chat_session(session_id)
        if not session_doc:
            return jsonify({'success': False, 'message': 'Session not found'}), 404

        messages = [_serialize_message(message) for message in get_messages_for_session(session_id)]

        return jsonify(
            {
                'success': True,
                'session_id': str(session_doc['_id']),
                'user_id': str(session_doc['user_id']),
                'title': session_doc.get('title', ''),
                'messages': messages
            }
        ), 200
    except Exception as error:
        return jsonify({'success': False, 'message': f'Failed to fetch session: {error}'}), 500
