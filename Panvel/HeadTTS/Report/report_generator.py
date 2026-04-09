# report_generator.py
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add parent directory to path to import from main project
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from db import get_chat_session, get_messages_for_session
import requests
import json

def fetch_session_data(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch session and associated messages from MongoDB
    """
    try:
        print(f"[REPORT DEBUG] Fetching session data for ID: {session_id} (type: {type(session_id)})")
        
        # Validate ObjectId format first
        from bson.objectid import ObjectId, InvalidId
        try:
            if not ObjectId.is_valid(session_id):
                print(f"[REPORT DEBUG] Session ID {session_id} is not a valid ObjectId format")
                return None
        except Exception as e:
            print(f"[REPORT DEBUG] Error validating ObjectId: {e}")
            return None
            
        session = get_chat_session(session_id)
        if not session:
            print(f"[REPORT DEBUG] No session found with ID: {session_id}")
            # Try to list a few sessions to debug
            try:
                from db import get_collections
                collections = get_collections()
                sample_sessions = list(collections['chat_sessions'].find({}).limit(3))
                print(f"[REPORT DEBUG] Sample sessions in DB: {[str(s.get('_id', 'No ID')) for s in sample_sessions]}")
            except Exception as debug_e:
                print(f"[REPORT DEBUG] Could not fetch sample sessions: {debug_e}")
            return None
            
        print(f"[REPORT DEBUG] Session found: {session.get('title', 'Untitled')}")
        messages = get_messages_for_session(session_id)
        print(f"[REPORT DEBUG] Found {len(messages)} messages for session")
        
        # Debug: Check if messages have the right session_id format
        if messages:
            sample_msg = messages[0]
            print(f"[REPORT DEBUG] Sample message session_id type: {type(sample_msg.get('session_id'))}")
            print(f"[REPORT DEBUG] Sample message session_id value: {sample_msg.get('session_id')}")
            print(f"[REPORT DEBUG] Looking for session_id: {session_id} (type: {type(session_id)})")
        else:
            print(f"[REPORT DEBUG] No messages found - checking if any messages exist for debugging...")
            try:
                from db import get_collections
                collections = get_collections()
                sample_messages = list(collections['messages'].find({}).limit(3))
                print(f"[REPORT DEBUG] Total messages in DB: {collections['messages'].count_documents({})}")
                for i, msg in enumerate(sample_messages):
                    print(f"[REPORT DEBUG] Sample message {i+1} session_id: {msg.get('session_id')} (type: {type(msg.get('session_id'))})")
            except Exception as debug_e:
                print(f"[REPORT DEBUG] Could not fetch sample messages: {debug_e}")
        
        return {
            'session': session,
            'messages': messages
        }
    except Exception as e:
        print(f"[REPORT ERROR] Error fetching session data: {e}")
        import traceback
        traceback.print_exc()
        return None

def compute_session_analytics(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute comprehensive analytics from session data
    """
    session = session_data['session']
    messages = session_data['messages']
    
    print(f"[REPORT DEBUG] Computing analytics for {len(messages)} messages")
    
    if not messages:
        print(f"[REPORT DEBUG] No messages found, generating default analytics")
        return {
            'total_messages': 0,
            'user_messages': 0,
            'assistant_messages': 0,
            'conversation_duration_minutes': 0,
            'dominant_emotion': 'neutral',
            'emotion_distribution': {'neutral': 1.0},
            'average_emotional_intensity': 0.5,
            'session_start_time': session.get('created_at', datetime.utcnow()),
            'session_end_time': session.get('updated_at', datetime.utcnow())
        }
    
    # Basic message statistics
    total_messages = len(messages)
    user_messages = len([m for m in messages if m.get('sender') == 'user'])
    assistant_messages = len([m for m in messages if m.get('sender') == 'assistant'])
    
    # Calculate conversation duration
    start_time = messages[0]['timestamp']
    end_time = messages[-1]['timestamp']
    duration_seconds = (end_time - start_time).total_seconds()
    conversation_duration_minutes = max(1, int(duration_seconds / 60))  # At least 1 minute
    
    # Process emotions from messages
    emotion_counts = {}
    emotion_intensities = []
    
    for message in messages:
        emotions = message.get('emotions', {})
        if isinstance(emotions, dict):
            for emotion, intensity in emotions.items():
                if isinstance(intensity, (int, float)):
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                    emotion_intensities.append(float(intensity))
    
    # Calculate emotion distribution as percentages
    total_emotions = sum(emotion_counts.values()) if emotion_counts else 1
    emotion_distribution = {
        emotion: count / total_emotions 
        for emotion, count in emotion_counts.items()
    }
    
    # Find dominant emotion
    dominant_emotion = max(emotion_distribution.keys()) if emotion_distribution else 'neutral'
    
    # Calculate average emotional intensity
    average_intensity = sum(emotion_intensities) / len(emotion_intensities) if emotion_intensities else 0.5
    
    return {
        'total_messages': total_messages,
        'user_messages': user_messages,
        'assistant_messages': assistant_messages,
        'conversation_duration_minutes': conversation_duration_minutes,
        'dominant_emotion': dominant_emotion,
        'emotion_distribution': emotion_distribution,
        'average_emotional_intensity': round(average_intensity, 2),
        'session_start_time': start_time,
        'session_end_time': end_time
    }

def generate_conversation_summary(session_data: Dict[str, Any]) -> str:
    """
    Generate a conversation summary using the conversation messages
    Keep it simple and analytical for now
    """
    messages = session_data['messages']
    
    if not messages:
        return "This session was created but no conversation took place. The session represents an initialized chat environment that was not actively used for messaging."
    
    user_messages = [m['content'] for m in messages if m.get('sender') == 'user']
    
    if not user_messages:
        return "This session contains only system responses with no user interaction. The session shows system initialization but no active user engagement."
    
    # Simple summary based on message patterns
    total_user_messages = len(user_messages)
    avg_message_length = sum(len(msg.split()) for msg in user_messages) / total_user_messages if total_user_messages > 0 else 0
    
    # Basic topic analysis (simple keyword detection)
    combined_text = ' '.join(user_messages).lower()
    
    emotional_keywords = {
        'stress': ['stress', 'anxiety', 'worried', 'nervous', 'anxious'],
        'sadness': ['sad', 'depressed', 'down', 'upset', 'crying'],
        'anger': ['angry', 'mad', 'frustrated', 'annoyed', 'irritated'],
        'happiness': ['happy', 'joy', 'excited', 'great', 'wonderful']
    }
    
    detected_themes = []
    for theme, keywords in emotional_keywords.items():
        if any(keyword in combined_text for keyword in keywords):
            detected_themes.append(theme)
    
    summary_parts = [
        f"User engaged in a {total_user_messages}-message conversation with an average message length of {avg_message_length:.1f} words."
    ]
    
    if detected_themes:
        summary_parts.append(f"Primary emotional themes detected: {', '.join(detected_themes)}.")
    
    if avg_message_length > 15:
        summary_parts.append("User provided detailed responses suggesting active engagement.")
    elif avg_message_length < 5:
        summary_parts.append("User responses were brief, indicating possible reluctance or distraction.")
    
    return ' '.join(summary_parts) + " Session demonstrates the user's interaction patterns with the AI conversation system."

def generate_suggested_intervention(analytics: Dict[str, Any]) -> Dict[str, str]:
    """
    Generate intervention suggestions based on analytics
    """
    dominant_emotion = analytics.get('dominant_emotion', 'neutral')
    avg_intensity = analytics.get('average_emotional_intensity', 0.5)
    duration = analytics.get('conversation_duration_minutes', 0)
    total_messages = analytics.get('total_messages', 0)
    
    # Handle case where no conversation took place
    if total_messages == 0:
        return {
            'title': 'Session Initialization Complete',
            'reason': 'This session was created but not actively used for conversation. Consider encouraging user engagement through welcoming messages or conversation starters.'
        }
    
    # Simple rule-based intervention suggestions
    if dominant_emotion in ['stress', 'anxiety']:
        if avg_intensity > 0.7:
            return {
                'title': 'Stress Management Techniques',
                'reason': 'High stress indicators detected. Recommend breathing exercises or mindfulness activities.'
            }
        else:
            return {
                'title': 'Mild Stress Support',
                'reason': 'Moderate stress levels observed. Light relaxation techniques may be beneficial.'
            }
    
    elif dominant_emotion in ['sad', 'sadness', 'depression']:
        return {
            'title': 'Emotional Support Resources',
            'reason': 'Indicators of sadness detected. Consider mood-lifting activities or professional support resources.'
        }
    
    elif dominant_emotion in ['anger', 'frustrated', 'irritated']:
        return {
            'title': 'Anger Management Techniques',
            'reason': 'Frustration or anger patterns observed. Calm-down strategies may help regulate emotions.'
        }
    
    elif duration < 2:
        return {
            'title': 'Extended Engagement Encouragement',
            'reason': 'Brief interaction suggests possible reluctance. Consider more welcoming conversation starters.'
        }
    
    else:
        return {
            'title': 'Continued Positive Engagement',
            'reason': 'Stable emotional state observed. Maintain current interaction approach for optimal user experience.'
        }

def generate_report_metrics(session_data):
    """
    Legacy function maintained for backward compatibility
    """
    intensity_change = session_data.get("intensity_final", 0.5) - session_data.get("intensity_initial", 0.5)

    if intensity_change < 0:
        impact_label = "Positive Emotional Shift"
    elif intensity_change > 0:
        impact_label = "Increased Emotional Intensity"
    else:
        impact_label = "Stable Emotional State"

    dominant_emotion = max(
        session_data.get("emotion_distribution", {'neutral': 1.0}),
        key=session_data.get("emotion_distribution", {'neutral': 1.0}).get
    )

    report_summary = {
        "dominant_emotion": dominant_emotion,
        "impact_score": round(intensity_change, 3),
        "impact_label": impact_label
    }

    return report_summary