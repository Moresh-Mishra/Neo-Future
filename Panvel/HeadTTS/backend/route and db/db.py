import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient


env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path, override=False)

_MONGO_CLIENT = None
_MONGO_DB = None


def get_mongo_db():
    global _MONGO_CLIENT, _MONGO_DB

    if _MONGO_DB is not None:
        return _MONGO_DB

    mongo_uri = os.getenv('MONGO_URI')
    database_name = os.getenv('DATABASE_NAME', 'headtts')

    if not mongo_uri:
        raise RuntimeError('MONGO_URI is not configured')

    _MONGO_CLIENT = MongoClient(
        mongo_uri,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        retryWrites=True,
    )

    _MONGO_CLIENT.admin.command('ping')
    _MONGO_DB = _MONGO_CLIENT[database_name]
    print(f"[MONGO] Connected to database: {database_name}")
    return _MONGO_DB


def get_collections():
    db = get_mongo_db()
    return {
        'users': db.users,
        'chat_sessions': db.chat_sessions,
        'messages': db.messages,
        'reviews': db.reviews,
    }


def init_chat_storage_indexes():
    collections = get_collections()

    sessions = collections['chat_sessions']
    messages = collections['messages']
    reviews = collections['reviews']

    # Chat sessions indexes
    sessions.create_index('user_id')
    sessions.create_index('updated_at')
    sessions.create_index([('user_id', 1), ('updated_at', -1)])

    # Messages indexes
    messages.create_index('session_id')
    messages.create_index('timestamp')
    messages.create_index([('session_id', 1), ('timestamp', 1)])
    
    # Reviews indexes
    reviews.create_index('user_id')
    reviews.create_index('submission_date')
    reviews.create_index([('user_id', 1), ('submission_date', -1)])
    print("[MONGO] Reviews collection indexes created successfully")


def parse_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except Exception:
        return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    object_user_id = parse_object_id(user_id)
    if object_user_id is None:
        return None

    collections = get_collections()
    return collections['users'].find_one({'_id': object_user_id})


def create_chat_session(user_id: str) -> str:
    object_user_id = parse_object_id(user_id)
    if object_user_id is None:
        raise ValueError('Invalid user_id')

    now = utc_now()
    session_doc = {
        'user_id': object_user_id,
        'title': '',
        'created_at': now,
        'updated_at': now,
        'last_message_preview': '',
    }

    collections = get_collections()
    result = collections['chat_sessions'].insert_one(session_doc)
    print(
        f"[MONGO WRITE] chat_sessions.insert_one user_id={user_id} session_id={str(result.inserted_id)}"
    )
    return str(result.inserted_id)


def get_chat_session(session_id: str) -> Optional[Dict[str, Any]]:
    object_session_id = parse_object_id(session_id)
    if object_session_id is None:
        return None

    collections = get_collections()
    return collections['chat_sessions'].find_one({'_id': object_session_id})


def list_chat_sessions_for_user(user_id: str) -> List[Dict[str, Any]]:
    object_user_id = parse_object_id(user_id)
    if object_user_id is None:
        raise ValueError('Invalid user_id')

    collections = get_collections()
    return list(
        collections['chat_sessions']
        .find({'user_id': object_user_id})
        .sort('updated_at', -1)
    )


def save_session_message(
    session_id: str,
    user_id: str,
    sender: str,
    content: str,
    emotions: Optional[Any] = None,
) -> str:
    object_session_id = parse_object_id(session_id)
    object_user_id = parse_object_id(user_id)
    if object_session_id is None:
        raise ValueError('Invalid session_id')
    if object_user_id is None:
        raise ValueError('Invalid user_id')

    message_doc = {
        'session_id': object_session_id,
        'user_id': object_user_id,
        'sender': sender,
        'content': content,
        'timestamp': utc_now(),
    }
    if emotions is not None:
        message_doc['emotions'] = emotions

    collections = get_collections()
    result = collections['messages'].insert_one(message_doc)
    print(
        f"[MONGO WRITE] messages.insert_one session_id={session_id} user_id={user_id} sender={sender} message_id={str(result.inserted_id)}"
    )
    return str(result.inserted_id)


def get_messages_for_session(session_id: str) -> List[Dict[str, Any]]:
    object_session_id = parse_object_id(session_id)
    if object_session_id is None:
        raise ValueError('Invalid session_id')

    collections = get_collections()
    return list(
        collections['messages']
        .find({'session_id': object_session_id})
        .sort('timestamp', 1)
    )


def update_chat_session_activity(
    session_id: str,
    last_message_preview: str,
    title: Optional[str] = None,
) -> None:
    object_session_id = parse_object_id(session_id)
    if object_session_id is None:
        raise ValueError('Invalid session_id')

    set_doc = {
        'updated_at': utc_now(),
        'last_message_preview': last_message_preview,
    }
    if title is not None:
        set_doc['title'] = title

    collections = get_collections()
    update_result = collections['chat_sessions'].update_one(
        {'_id': object_session_id},
        {'$set': set_doc},
    )
    print(
        f"[MONGO WRITE] chat_sessions.update_one session_id={session_id} modified={update_result.modified_count}"
    )


def utc_now():
    return datetime.utcnow()
