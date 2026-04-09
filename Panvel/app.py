from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os
import sys
from bson.objectid import ObjectId
from pymongo import MongoClient
from dotenv import load_dotenv

# AI Emotion Detection imports
import numpy as np
import tempfile
import cv2
import base64
import traceback
import requests

# Import emotion activities database
from emotion_activities import get_structured_activities, get_activities_for_emotion

# LangChain imports for conversation memory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory

# Lazy imports for AI models (will be loaded when needed)
_ai_models_loaded = False
text_classifier = None
face_cascade = None
DeepFace = None

# Optional verbose logging for raw LLM outputs (disabled by default)
LLM_DEBUG_OUTPUT = os.getenv('LLM_DEBUG_OUTPUT', 'false').lower() == 'true'

# Load environment variables with explicit path and override
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path, override=True)

# Debug: Check environment variables
print("=== Environment Debug ===")
print(f".env file path: {env_path}")
print(f".env file exists: {os.path.exists(env_path)}")
mongo_uri_from_env = os.getenv('MONGO_URI')
print(f"MONGO_URI from .env: {mongo_uri_from_env[:50] if mongo_uri_from_env else 'NOT_SET'}...")

# Also check if there are any system MONGO environment variables
mongo_vars = {k: v for k, v in os.environ.items() if 'MONGO' in k.upper()}
if mongo_vars:
    print("System MONGO environment variables found:")
    for k, v in mongo_vars.items():
        print(f"  {k}: {v[:50]}...")
print("========================")

app = Flask(__name__)

# Configuration from environment variables
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'fallback_secret_key_change_this')

# Log all incoming requests for debugging
@app.before_request
def log_request():
    if request.path.startswith('/api/'):
        print(f"\n🌐 Incoming Request: {request.method} {request.path}")
        sys.stdout.flush()

# MongoDB connection - Use environment variable with fallback
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print("❌ MONGO_URI not found in environment variables!")
    print("Please check your .env file")
    exit(1)

print(f"Using MongoDB URI from .env: {MONGO_URI[:50]}...")
DATABASE_NAME = os.getenv('DATABASE_NAME', 'headtts')

# Initialize CORS
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Initialize MongoDB client with SSL workaround for Windows/TLS issues
try:
    print(f"Attempting to connect to MongoDB with URI: {MONGO_URI[:50]}...")
    
    # Use connection with relaxed SSL for development (Python 3.10 compatible)
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True,
        tlsAllowInvalidHostnames=True,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        retryWrites=True
    )
    
    # Test the connection with a simple ping
    result = client.admin.command('ping')
    print(f"MongoDB ping successful: {result}")
    
    # Database name (created automatically when used)
    db = client[DATABASE_NAME]
    print(f"MongoDB client initialized and connected to database: {DATABASE_NAME}")
    
except Exception as e:
    print(f"MongoDB client initialization failed: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    print("Running in offline mode - some features may not work")
    client = None
    db = None

def init_database():
    """Initialize database collections and indexes"""
    if db is None:
        print("❌ Database not available - running in offline mode")
        return False
        
    try:
        # Test basic connection with timeout
        db.command('ping')
        print("✓ Database connection successful")
        
        # Create indexes for better performance and uniqueness
        try:
            db.users.create_index("email", unique=True)
            db.users.create_index("username", unique=True)
            db.users.create_index("created_at")
            
            # Chat and message indexes
            db.chats.create_index([("user_id", 1), ("created_at", -1)])
            db.messages.create_index([("chat_id", 1), ("timestamp", 1)])
            db.messages.create_index("user_id")
            
            print("✓ Database indexes created successfully")
        except Exception as idx_error:
            print(f"⚠️  Index creation warning: {idx_error}")
        
        # Create demo user if it doesn't exist
        try:
            if not db.users.find_one({'username': 'demo'}):
                demo_user = {
                    'name': 'Demo User',
                    'email': 'demo@headtts.com',
                    'username': 'demo',
                    'password': generate_password_hash('demo123'),
                    'created_at': datetime.datetime.utcnow(),
                    'is_active': True
                }
                db.users.insert_one(demo_user)
                print("✓ Demo user created (username: demo, password: demo123)")
            else:
                print("✓ Demo user already exists")
        except Exception as user_error:
            print(f"⚠️  Demo user creation warning: {user_error}")
        
        return True
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("   Check MongoDB Atlas connection and IP whitelist")
        return False

# JWT Configuration from environment
JWT_SECRET = os.getenv('JWT_SECRET', 'fallback_jwt_secret_change_this_in_production')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

def token_required(f):
    """Decorator to require JWT token for protected routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user_id = data['user_id']
            
            if db is None:
                return jsonify({'success': False, 'message': 'Database not available'}), 500
                
            current_user = db.users.find_one({'_id': ObjectId(current_user_id)})
            
            if not current_user:
                return jsonify({'success': False, 'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


# ==========================================
# CHAT MANAGEMENT FUNCTIONS
# ==========================================

def create_new_chat(user_id):
    """Create a new chat session for a user"""
    if db is None:
        return None
    
    try:
        # Handle demo user (string) vs authenticated user (ObjectId)
        if user_id == "demo_user":
            user_id_field = user_id  # Keep as string for demo
        else:
            try:
                user_id_field = ObjectId(user_id)
            except:
                user_id_field = user_id  # If conversion fails, use as-is
        
        chat_doc = {
            'user_id': user_id_field,
            'nickname': None,  # Will be generated from first message
            'created_at': datetime.datetime.utcnow(),
            'updated_at': datetime.datetime.utcnow()
        }
        result = db.chats.insert_one(chat_doc)
        return str(result.inserted_id)
    except Exception as e:
        print(f"❌ Error creating chat: {e}")
        traceback.print_exc()
        return None


def generate_chat_nickname(first_message):
    """Generate a catchy nickname for the chat using LLM"""
    try:
        system_message = """You are a creative assistant that generates short, catchy nicknames for chat conversations.
Create a nickname that captures the essence of the user's message in 2-4 words.
Return ONLY the nickname, nothing else. No quotes, no explanation."""
        
        user_message = f"""Generate a short, catchy nickname (2-4 words max) for a chat that starts with:
"{first_message}"

Examples of good nicknames:
- "Career Anxiety Talk"
- "Morning Motivation"
- "Breakup Support"
- "Study Stress Help"

Return ONLY the nickname:"""
        
        response = ollama_session.post(
            OLLAMA_API_URL,
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.8,
                    "top_p": 0.9,
                    "max_tokens": 20
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            nickname = result.get('message', {}).get('content', '').strip()
            # Clean up the nickname (remove quotes if any)
            nickname = nickname.strip('"').strip("'").strip()
            # Limit length
            if len(nickname) > 50:
                nickname = nickname[:47] + "..."
            return nickname if nickname else "New Chat"
        else:
            return "New Chat"
    except Exception as e:
        print(f"❌ Error generating nickname: {e}")
        return "New Chat"


def save_message(chat_id, user_id, role, content, emotions=None, mood=None):
    """Save a message to the database"""
    if db is None:
        return None
    
    try:
        # Handle demo user vs authenticated user
        if user_id == "demo_user":
            user_id_field = user_id
        else:
            try:
                user_id_field = ObjectId(user_id)
            except:
                user_id_field = user_id
        
        message_doc = {
            'chat_id': ObjectId(chat_id),
            'user_id': user_id_field,
            'role': role,  # "user" or "assistant"
            'content': content,
            'emotions': emotions or [],
            'mood': mood,
            'timestamp': datetime.datetime.utcnow()
        }
        result = db.messages.insert_one(message_doc)
        
        # Update chat's updated_at timestamp
        db.chats.update_one(
            {'_id': ObjectId(chat_id)},
            {'$set': {'updated_at': datetime.datetime.utcnow()}}
        )
        
        print(f"✅ Message saved: {role} - {content[:50]}...")
        sys.stdout.flush()
        
        return str(result.inserted_id)
    except Exception as e:
        print(f"❌ Error saving message: {e}")
        traceback.print_exc()
        return None


def get_chat_history(chat_id, limit=20):
    """Get conversation history for a chat"""
    if db is None:
        return []
    
    try:
        messages = list(db.messages.find(
            {'chat_id': ObjectId(chat_id)}
        ).sort('timestamp', 1).limit(limit))
        
        history = []
        for msg in messages:
            history.append({
                'role': msg['role'],
                'content': msg['content'],
                'emotions': msg.get('emotions', []),
                'mood': msg.get('mood'),
                'timestamp': msg['timestamp'].isoformat()
            })
        return history
    except Exception as e:
        print(f"❌ Error getting chat history: {e}")
        return []


def build_conversation_context(chat_history, max_messages=10):
    """Build conversation context from chat history for LLM"""
    if not chat_history:
        return ""
    
    # Get last N messages
    recent_messages = chat_history[-max_messages:]
    
    context_parts = []
    for msg in recent_messages:
        role = "User" if msg['role'] == 'user' else "Assistant"
        context_parts.append(f"{role}: {msg['content']}")
    
    return "\n".join(context_parts)


@app.route('/')
def home():
    """Home route - redirect to home page"""
    return redirect(url_for('home_page'))

@app.route('/home')
def home_page():
    """Serve the home page"""
    # Check if user has valid session or token
    token = request.args.get('token') or session.get('token')
    
    if not token:
        return redirect(url_for('login_page', source='home'))
    
    try:
        # Verify token
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data['user_id']
        
        if db is None:
            return redirect(url_for('login_page', source='home'))
            
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return redirect(url_for('login_page', source='home'))
        
        # Store token in session for future requests
        session['token'] = token
        session['user'] = {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'username': user['username']
        }
        
        return render_template('home.html')
        
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return redirect(url_for('login_page', source='home'))

@app.route('/login')
def login_page():
    """Serve the login page"""
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    """Serve the main HeadTTS interface (protected route)"""
    # Check if user has valid session or token
    token = request.args.get('token') or session.get('token')
    
    if not token:
        return redirect(url_for('login_page', source='dashboard'))
    
    try:
        # Verify token
        data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user_id = data['user_id']
        
        if db is None:
            return redirect(url_for('login_page', source='dashboard'))
            
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return redirect(url_for('login_page', source='dashboard'))
        
        # Store token in session for future requests
        session['token'] = token
        session['user'] = {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'username': user['username']
        }
        
        return render_template('index.html')
        
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return redirect(url_for('login_page', source='dashboard'))
# API Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """User registration endpoint"""
    global db  # Ensure we're using the module-level db variable
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided.'
            }), 400
        
        # Validate required fields
        required_fields = ['name', 'email', 'username', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field.capitalize()} is required.'
                }), 400
        
        name = data['name'].strip()
        email = data['email'].strip().lower()
        username = data['username'].strip()
        password = data['password']
        
        # Validate password length
        if len(password) < 6:
            return jsonify({
                'success': False,
                'message': 'Password must be at least 6 characters long.'
            }), 400
        
        print(f"Registration attempt for username: {username}, email: {email}")  # Debug log
        print(f"Database status in register: db={'None' if db is None else 'Connected'}")  # Debug
        
        if db is None:
            return jsonify({
                'success': False,
                'message': 'Database not available. Please try again later.'
            }), 500
        
        # Check if user already exists
        existing_user_email = db.users.find_one({'email': email})
        if existing_user_email:
            return jsonify({
                'success': False,
                'message': 'Email already exists.'
            }), 400
        
        existing_user_username = db.users.find_one({'username': username})
        if existing_user_username:
            return jsonify({
                'success': False,
                'message': 'Username already exists.'
            }), 400
        
        # Hash password
        hashed_password = generate_password_hash(password)
        
        # Create user document
        user_doc = {
            'name': name,
            'email': email,
            'username': username,
            'password': hashed_password,
            'created_at': datetime.datetime.utcnow(),
            'is_active': True
        }
        
        # Insert user into database
        result = db.users.insert_one(user_doc)
        user_id = result.inserted_id
        
        # Generate token
        token = generate_token(user_id)
        
        print(f"Registration successful for user: {username}")  # Debug log
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'User registered successfully.',
            'token': token,
            'redirect': '/home',
            'user': {
                'id': str(user_id),
                'name': name,
                'email': email,
                'username': username,
                'created_at': user_doc['created_at'].isoformat()
            }
        }), 201
        
    except ValueError as e:
        print(f"Registration validation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Invalid data provided.'
        }), 400
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again later.'
        }), 500
@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    global db  # Ensure we're using the module-level db variable
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided.'
            }), 400
        
        # Validate required fields
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required.'
            }), 400
        
        print(f"Login attempt for username: {username}")  # Debug log
        print(f"Database status in login: db={'None' if db is None else 'Connected'}")  # Debug
        
        if db is None:
            return jsonify({
                'success': False,
                'message': 'Database not available. Please try again later.'
            }), 500
        
        # Find user in database
        user = db.users.find_one({
            'username': username,
            'is_active': True
        })
        
        if not user:
            print(f"User not found: {username}")  # Debug log
            return jsonify({
                'success': False,
                'message': 'Invalid username or password.'
            }), 400
        
        # Check password
        if not check_password_hash(user['password'], password):
            print(f"Invalid password for user: {username}")  # Debug log
            return jsonify({
                'success': False,
                'message': 'Invalid username or password.'
            }), 400
        
        # Update last login
        db.users.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.datetime.utcnow()}}
        )
        
        # Generate token
        token = generate_token(user['_id'])
        
        print(f"Login successful for user: {username}")  # Debug log
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Login successful.',
            'token': token,
            'redirect': '/home',
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'username': user['username'],
                'last_login': datetime.datetime.utcnow().isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again later.'
        }), 500

@app.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile (protected route)"""
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': str(current_user['_id']),
                'name': current_user['name'],
                'email': current_user['email'],
                'username': current_user['username'],
                'created_at': current_user['created_at'].isoformat() if current_user.get('created_at') else None,
                'last_login': current_user['last_login'].isoformat() if current_user.get('last_login') else None
            }
        }), 200
        
    except Exception as e:
        print(f"Profile error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again later.'
        }), 500

@app.route('/api/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile (protected route)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided.'
            }), 400
        
        # Validate optional fields
        name = data.get('name', '').strip() if data.get('name') else None
        username = data.get('username', '').strip() if data.get('username') else None
        
        # Validate that at least one field is being updated
        if not name and not username:
            return jsonify({
                'success': False,
                'message': 'At least one field must be provided for update.'
            }), 400
        
        # Validate username if provided
        if username:
            if len(username) < 3:
                return jsonify({
                    'success': False,
                    'message': 'Username must be at least 3 characters long.'
                }), 400
            
            if not username.replace('_', '').replace('-', '').isalnum():
                return jsonify({
                    'success': False,
                    'message': 'Username can only contain letters, numbers, underscores, and hyphens.'
                }), 400
        
        print(f"Profile update attempt for user: {current_user['username']}")  # Debug log
        
        if db is None:
            return jsonify({
                'success': False,
                'message': 'Database not available. Please try again later.'
            }), 500
        
        # Check if username is already taken by another user (only if username is being updated)
        if username and username != current_user.get('username'):
            existing_user_username = db.users.find_one({
                'username': username,
                '_id': {'$ne': current_user['_id']}  # Exclude current user
            })
            
            if existing_user_username:
                return jsonify({
                    'success': False,
                    'message': 'Username is already taken by another user.'
                }), 400
        
        # Update user document - only update provided fields
        update_data = {
            'updated_at': datetime.datetime.utcnow()
        }
        
        # Add fields to update only if they were provided
        if name:
            update_data['name'] = name
        if username:
            update_data['username'] = username
        
        # Update user in database
        result = db.users.update_one(
            {'_id': current_user['_id']},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({
                'success': False,
                'message': 'No changes were made to the profile.'
            }), 400
        
        # Get updated user data
        updated_user = db.users.find_one({'_id': current_user['_id']})
        
        print(f"Profile updated successfully for user: {current_user['username']}")  # Debug log
        
        # Create success message based on what was updated
        updated_fields = []
        if name: updated_fields.append('name')
        if username: updated_fields.append('username')
        
        success_message = f"Profile updated successfully. Updated: {', '.join(updated_fields)}."
        
        # Return success response
        return jsonify({
            'success': True,
            'message': success_message,
            'user': {
                'id': str(updated_user['_id']),
                'name': updated_user['name'],
                'email': updated_user['email'],
                'username': updated_user['username'],
                'created_at': updated_user['created_at'].isoformat() if updated_user.get('created_at') else None,
                'last_login': updated_user['last_login'].isoformat() if updated_user.get('last_login') else None,
                'updated_at': updated_user['updated_at'].isoformat() if updated_user.get('updated_at') else None
            }
        }), 200
        
    except ValueError as e:
        print(f"Profile update validation error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Invalid data provided.'
        }), 400
    except Exception as e:
        print(f"Profile update error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again later.'
        }), 500
@app.route('/api/auth/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verify token validity (protected route)"""
    try:
        return jsonify({
            'success': True,
            'message': 'Token is valid.',
            'user': {
                'id': str(current_user['_id']),
                'name': current_user['name'],
                'email': current_user['email'],
                'username': current_user['username']
            }
        }), 200
        
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Server error. Please try again later.'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db_status = "Connected"
        user_count = 0
        
        try:
            # Test connection and get user count
            if db is not None:
                user_count = db.users.count_documents({})
                
                # Try to create a test document to verify write access
                test_result = db.test.insert_one({"test": "connection", "timestamp": datetime.datetime.utcnow()})
                db.test.delete_one({"_id": test_result.inserted_id})
                
                print(f"Database connection successful. Users: {user_count}")
            else:
                db_status = "Database not initialized"
                print("Database not initialized")
        except Exception as db_error:
            db_status = f"Error: {str(db_error)}"
            print(f"Database connection failed: {db_error}")
        
        return jsonify({
            'success': True,
            'message': 'HeadTTS Flask Backend is running',
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'database': db_status,
            'user_count': user_count
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'HeadTTS Flask Backend is running but has issues',
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'error': str(e)
        }), 500

@app.route('/api/test-logging', methods=['GET'])
def test_logging():
    """Test endpoint to verify console logging is working"""
    print("\n" + "="*60)
    print("✅ TEST LOGGING ENDPOINT CALLED")
    print("="*60)
    sys.stdout.flush()
    return jsonify({
        'success': True,
        'message': 'If you see this response, check your terminal for log messages!'
    })

@app.route('/logout')
def logout():
    """Logout route"""
    session.clear()
    return redirect(url_for('login_page'))

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404
# ==========================================
# AI EMOTION DETECTION INTEGRATION
# ==========================================

def load_ai_models():
    """Lazy load AI models only when needed"""
    global _ai_models_loaded, text_classifier, face_cascade, DeepFace
    
    if _ai_models_loaded:
        return
    
    print("⏳ Loading AI emotion detection models...")
    try:
        # Configure Keras backend
        os.environ['KERAS_BACKEND'] = 'tensorflow'
        
        # Import and load models
        from transformers import pipeline
        from deepface import DeepFace as DF
        import cv2 as cv
        
        text_classifier = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base",
            top_k=None
        )
        face_cascade = cv.CascadeClassifier(cv.data.haarcascades + 'haarcascade_frontalface_default.xml')
        DeepFace = DF
        
        _ai_models_loaded = True
        print("✅ AI emotion detection models loaded!")
    except Exception as e:
        print(f"❌ Error loading AI models: {e}")
        print("⚠️ AI emotion features will be disabled")


# Ollama configuration for LLM responses
OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"
OLLAMA_MODEL = "llama3:latest" 

# Create Ollama session with connection pooling
ollama_session = requests.Session()
ollama_session.headers.update({'Content-Type': 'application/json'})
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
adapter = HTTPAdapter(
    pool_connections=10,
    pool_maxsize=20,
    max_retries=Retry(total=2, backoff_factor=0.5)
)
ollama_session.mount('http://', adapter)


def get_top2_emotions(text):
    """Get top 2 emotions from text"""
    if not text_classifier:
        load_ai_models()
    
    emotions = text_classifier(text)[0]
    sorted_emotions = sorted(emotions, key=lambda x: x['score'], reverse=True)[:2]
    
    result = []
    for emotion in sorted_emotions:
        result.append({
            "emotion": emotion['label'],
            "percentage": round(emotion['score'] * 100, 2)
        })
    return result


def get_llm_response(user_input, emotions, conversation_history=None):
    """Get personalized response from Llama 3.2 based on detected emotions and conversation history"""
    try:
        # Format emotions for the prompt
        emotion_str = ", ".join([f"{e['emotion']} ({e['percentage']}%)" for e in emotions])
        top_emotion = emotions[0]['emotion'] if emotions else "neutral"
        
        # Map emotion to avatar mood
        emotion_to_mood = {
            'joy': 'happy', 'happiness': 'happy',
            'sadness': 'sad', 'disappointment': 'sad',
            'anger': 'angry', 'frustration': 'angry',
            'surprise': 'surprised', 'amazement': 'surprised',
            'fear': 'fear', 'anxiety': 'fear', 'worry': 'fear',
            'disgust': 'disgust', 'contempt': 'disgust',
            'neutral': 'neutral', 'calm': 'neutral'
        }
        
        # Get the mood for activities and avatar
        mood_for_activities = emotion_to_mood.get(top_emotion.lower(), 'neutral')
        
        # Fetch curated activities from the database (but only use when appropriate)
        activities_data = get_structured_activities(mood_for_activities, immediate=2, short=2, reflection=1)
        
        # Format activities for the prompt
        activities_text = ""
        if "immediate" in activities_data:
            activities_text += "Quick relief ideas: " + ", ".join(activities_data["immediate"]) + "\n"
        if "short_term" in activities_data:
            activities_text += "Activities: " + ", ".join(activities_data["short_term"]) + "\n"
        if "reflection" in activities_data:
            activities_text += "Reflection: " + ", ".join(activities_data["reflection"])
        
        # Build conversation context if available
        context_text = ""
        if conversation_history:
            context_text = "Previous conversation:\n" + build_conversation_context(conversation_history) + "\n\n"
        
        # Create conversational prompt - more natural, less prescriptive
        system_message = """You are a warm, empathetic friend providing emotional support.

CRITICAL RULES:
1. NEVER use JSON format in your response
2. NEVER use curly braces { } in your response
3. NEVER write "mood:" or "message:" labels
4. Just write natural conversational text
5. NO asterisks, NO markdown formatting
6. Remember previous conversations and reference them naturally

You are having a real conversation with a friend, not outputting data."""
        
        user_message = f"""{context_text}Current message: "{user_input}"
Detected emotions: {emotion_str}

{activities_text if activities_text else ''}

Respond as a supportive friend in 2-4 sentences. Be conversational and warm. Reference past conversations if relevant.

DO NOT use JSON format. DO NOT use curly braces. Just write normal text like you're texting a friend.

Wrong: {{"message": "I'm here for you"}}
Correct: I'm here for you! That sounds really tough."""

        # Call Ollama API
        def make_ollama_request():
            return ollama_session.post(
                OLLAMA_API_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": user_message}
                    ],
                    "stream": False,
                    "options": {
                        "temperature": 0.8,  # Higher for more natural variation
                        "top_p": 0.9
                    }
                },
                timeout=120
            )
        
        response = make_ollama_request()
        
        if response.status_code == 200:
            result = response.json()
            done_reason = result.get('done_reason', '')
            message_content = result.get('message', {}).get('content', '').strip()
            
            # Retry if model is loading
            if done_reason == 'load' or not message_content:
                print("⚠️ Model loading detected, retrying...")
                import time
                time.sleep(1)
                response = make_ollama_request()
                
                if response.status_code == 200:
                    result = response.json()
                    message_content = result.get('message', {}).get('content', '').strip()
            
            # Debug: Log raw LLM response only when explicitly enabled
            if LLM_DEBUG_OUTPUT:
                print(f"\n📝 RAW LLM OUTPUT:")
                print(f"First 200 chars: {message_content[:200] if message_content else 'EMPTY'}")
                print(f"Contains curly braces: {'{' in message_content if message_content else False}")
                sys.stdout.flush()
            
            if message_content:
                # Clean up JSON formatting if LLM still outputs it despite instructions
                if message_content.strip().startswith('{'):
                    print("⚠️ WARNING: LLM returned JSON despite instructions, extracting message...")
                    try:
                        import json
                        parsed = json.loads(message_content)
                        message_content = parsed.get('message', message_content)
                        print(f"✅ Extracted message from JSON: {message_content[:100]}...")
                    except:
                        # If it looks like JSON but fails to parse, try to extract text
                        import re
                        match = re.search(r'"message"\s*:\s*"([^"]+)"', message_content)
                        if match:
                            message_content = match.group(1)
                            print(f"✅ Regex extracted message: {message_content[:100]}...")
                    sys.stdout.flush()
                
            if message_content:
                # Return dict with mood and plain text message
                return {
                    "mood": mood_for_activities,
                    "message": message_content
                }
            else:
                return {
                    "mood": mood_for_activities,
                    "message": "I understand how you're feeling. I'm here to listen and support you."
                }
        else:
            return {
                "mood": mood_for_activities,
                "message": "I understand how you're feeling. I'm here to listen and support you."
            }
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Ollama. Is it running?")
        # Default to neutral if we couldn't determine mood
        return {
            "mood": "neutral",
            "message": "I'm having trouble connecting right now, but I'm here with you."
        }
    except Exception as e:
        print(f"❌ LLM error: {str(e)}")
        # Default to neutral if we couldn't determine mood
        return {
            "mood": "neutral",
            "message": "I hear you, and I'm here to help however I can."
        }


@app.route('/api/ai/text-emotion', methods=['POST'])
def ai_analyze_text():
    """Analyze emotion from text input and get LLM response"""
    try:
        print("\n" + "="*60)
        print("📝 TEXT EMOTION ANALYSIS REQUEST")
        print("="*60)
        sys.stdout.flush()
        
        # Load models if needed
        if not _ai_models_loaded:
            load_ai_models()
        
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        print(f"💬 User text: {text}")
        sys.stdout.flush()
        emotions = get_top2_emotions(text)
        print(f"😊 Detected emotions: {emotions}")
        sys.stdout.flush()
        
        # Get LLM response (returns dict with mood and message)
        llm_result = get_llm_response(text, emotions)
        
        # Extract message and mood from LLM result
        if isinstance(llm_result, dict):
            response_message = llm_result.get("message", "I'm here to help you.")
            avatar_mood = llm_result.get("mood", "neutral")
        elif isinstance(llm_result, str):
            # If LLM returned a string, try to parse it as JSON
            try:
                import json
                parsed = json.loads(llm_result)
                response_message = parsed.get("message", llm_result)
                avatar_mood = parsed.get("mood", "neutral")
            except:
                response_message = llm_result
                avatar_mood = "neutral"
        else:
            response_message = "I'm here to help you."
            avatar_mood = "neutral"
        
        # Ensure response_message is a string, not a dict or other object
        if not isinstance(response_message, str):
            print(f"⚠️ WARNING: response_message is type {type(response_message)}, converting to string")
            import json
            # If it's a dict/list, try to extract message or convert to JSON string
            if isinstance(response_message, dict):
                response_message = response_message.get("message", json.dumps(response_message))
            else:
                response_message = str(response_message)
        
        # Debug logging
        print(f"\n📤 LLM Result Type: {type(llm_result)}")
        print(f"📤 Response Message (first 150 chars): {response_message[:150] if len(response_message) > 150 else response_message}")
        print(f"📤 Avatar Mood: {avatar_mood}")
        print("="*60 + "\n")
        sys.stdout.flush()
        
        return jsonify({
            "success": True,
            "type": "text",
            "user_message": text,
            "emotions": emotions,
            "response": response_message,
            "avatarMood": avatar_mood,
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
        })
    
    except Exception as e:
        print(f"❌ Text emotion error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/facial-emotion', methods=['POST'])
def ai_analyze_facial():
    """Analyze emotion from facial image"""
    try:
        # Load models if needed
        if not _ai_models_loaded:
            load_ai_models()
        
        data = request.json
        image_data = data.get('image', '')
        
        if not image_data:
            return jsonify({"error": "No image provided"}), 400
        
        # Decode base64 image
        image_data = image_data.split(',')[1] if ',' in image_data else image_data
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Invalid image data"}), 400
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5)
        
        if len(faces) == 0:
            return jsonify({
                "success": False,
                "error": "No face detected",
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
            })
        
        # Save frame to temp file for DeepFace
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
            cv2.imwrite(tmp_file.name, frame)
            tmp_path = tmp_file.name
        
        try:
            # Analyze facial emotions
            result = DeepFace.analyze(
                img_path=tmp_path,
                actions=['emotion'],
                enforce_detection=False
            )
            
            # Extract emotions
            if isinstance(result, list):
                result = result[0]
            
            emotions = result['emotion']
            sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:2]
            
            facial_emotions = [
                {
                    "emotion": emotion,
                    "percentage": round(float(score), 2)
                }
                for emotion, score in sorted_emotions
            ]
            
            # Generate LLM response
            user_context = "I just showed you my face"
            llm_result = get_llm_response(user_context, facial_emotions)
            
            return jsonify({
                "success": True,
                "type": "facial",
                "user_message": "Facial expression captured",
                "emotions": facial_emotions,
                "response": llm_result.get("message", llm_result) if isinstance(llm_result, dict) else llm_result,
                "avatarMood": llm_result.get("mood", "neutral") if isinstance(llm_result, dict) else "neutral",
                "face_count": int(len(faces)),
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
            })
        
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except Exception as e:
        print(f"❌ Facial emotion error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/ai/combined-emotion', methods=['POST'])
def ai_combined_emotion():
    """Combined emotion analysis - integrates text, facial, and voice data with chat memory"""
    try:
        print("\n" + "="*60)
        print("🔄 COMBINED EMOTION ANALYSIS REQUEST")
        print("="*60)
        sys.stdout.flush()
        
        # Load models if needed
        if not _ai_models_loaded:
            load_ai_models()
        
        data = request.json
        text = data.get('text', '')
        image_data = data.get('image', '')
        chat_id = data.get('chat_id')  # Optional chat ID
        
        # Try to get user from token (optional authentication)
        user_id = None
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            try:
                token = token[7:]
                token_data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
                user_id = token_data['user_id']
                print(f"✅ Authenticated user: {user_id}")
            except:
                print("⚠️ Invalid token, proceeding without authentication")
        
        # Use demo user if no authentication
        if not user_id:
            user_id = "demo_user"  # Fallback for demo/testing
            print("📝 Using demo user (no authentication)")
        
        sys.stdout.flush()
        
        # Create new chat if no chat_id provided
        if not chat_id:
            chat_id = create_new_chat(user_id)
            print(f"📝 Created new chat: {chat_id}")
            sys.stdout.flush()
            is_first_message = True
        else:
            # Check if this is the first message (no messages in chat yet)
            history = get_chat_history(chat_id, limit=1)
            is_first_message = len(history) == 0
        
        all_emotions = []
        modality_count = 0
        
        # Analyze text if provided
        if text:
            print(f"💬 User text: {text}")
            sys.stdout.flush()
            text_emotions = get_top2_emotions(text)
            all_emotions.extend(text_emotions)
            modality_count += 1
            print(f"✅ Text emotions: {text_emotions}")
            sys.stdout.flush()
        
        # Analyze facial expression if provided
        if image_data:
            print("📸 Analyzing facial expression...")
            sys.stdout.flush()
            try:
                # Decode base64 image
                image_data = image_data.split(',')[1] if ',' in image_data else image_data
                image_bytes = base64.b64decode(image_data)
                nparr = np.frombuffer(image_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if frame is not None:
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
                    
                    if len(faces) > 0:
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                            cv2.imwrite(tmp_file.name, frame)
                            tmp_path = tmp_file.name
                        
                        try:
                            result = DeepFace.analyze(
                                img_path=tmp_path,
                                actions=['emotion'],
                                enforce_detection=False
                            )
                            
                            if isinstance(result, list):
                                result = result[0]
                            
                            emotions = result['emotion']
                            sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)[:2]
                            
                            facial_emotions = [
                                {"emotion": emotion, "percentage": round(float(score), 2)}
                                for emotion, score in sorted_emotions
                            ]
                            all_emotions.extend(facial_emotions)
                            modality_count += 1
                        finally:
                            if os.path.exists(tmp_path):
                                os.unlink(tmp_path)
            except Exception as e:
                print(f"⚠️ Facial analysis failed: {e}")
        
        if modality_count == 0:
            return jsonify({
                "success": False,
                "error": "No valid input provided"
            }), 400
        
        # Aggregate emotions
        emotion_scores = {}
        for emotion_data in all_emotions:
            emotion = emotion_data['emotion']
            percentage = emotion_data['percentage']
            if emotion not in emotion_scores:
                emotion_scores[emotion] = {'total': 0, 'count': 0}
            emotion_scores[emotion]['total'] += percentage
            emotion_scores[emotion]['count'] += 1
        
        # Calculate averages and get top 2
        averaged_emotions = []
        for emotion, scores in emotion_scores.items():
            avg_score = scores['total'] / scores['count']
            averaged_emotions.append({
                'emotion': emotion,
                'percentage': round(avg_score, 2)
            })
        
        top_emotions = sorted(averaged_emotions, key=lambda x: x['percentage'], reverse=True)[:2]
        
        # Get conversation history for context
        conversation_history = get_chat_history(chat_id, limit=10) if not is_first_message else None
        
        # Debug: Log conversation history
        print(f"\n🧠 MEMORY DEBUG:")
        print(f"Chat ID: {chat_id}")
        print(f"Is first message: {is_first_message}")
        print(f"Conversation history length: {len(conversation_history) if conversation_history else 0}")
        if conversation_history:
            print(f"Previous messages: {len(conversation_history)} messages")
            for i, msg in enumerate(conversation_history[-3:]):  # Show last 3
                print(f"  [{msg['role']}]: {msg['content'][:50]}...")
        sys.stdout.flush()
        
        # Generate LLM response with conversation context
        llm_result = get_llm_response(text or "How am I feeling?", top_emotions, conversation_history)
        
        # Extract message and mood from LLM result
        if isinstance(llm_result, dict):
            response_message = llm_result.get("message", "I'm here to help you.")
            avatar_mood = llm_result.get("mood", "neutral")
        elif isinstance(llm_result, str):
            # If LLM returned a string, try to parse it as JSON
            try:
                import json
                parsed = json.loads(llm_result)
                response_message = parsed.get("message", llm_result)
                avatar_mood = parsed.get("mood", "neutral")
            except:
                response_message = llm_result
                avatar_mood = "neutral"
        else:
            response_message = "I'm here to help you."
            avatar_mood = "neutral"
        
        # Ensure response_message is a string, not a dict or other object
        if not isinstance(response_message, str):
            print(f"⚠️ WARNING: response_message is type {type(response_message)}, converting to string")
            import json
            # If it's a dict/list, try to extract message or convert to JSON string
            if isinstance(response_message, dict):
                response_message = response_message.get("message", json.dumps(response_message))
            else:
                response_message = str(response_message)
        
        # Save user message
        save_message(chat_id, user_id, "user", text, top_emotions, None)
        
        # Save assistant response
        save_message(chat_id, user_id, "assistant", response_message, None, avatar_mood)
        
        # Generate chat nickname from first message
        chat_nickname = None
        if is_first_message and text:
            chat_nickname = generate_chat_nickname(text)
            if chat_nickname and db is not None:
                db.chats.update_one(
                    {'_id': ObjectId(chat_id)},
                    {'$set': {'nickname': chat_nickname}}
                )
                print(f"✨ Generated chat nickname: {chat_nickname}")
                sys.stdout.flush()
        
        # Debug logging
        print(f"\n📤 Combined LLM Result Type: {type(llm_result)}")
        print(f"📤 Combined Response Message (first 150 chars): {response_message[:150] if len(response_message) > 150 else response_message}")
        print(f"📤 Combined Avatar Mood: {avatar_mood}")
        print("="*60 + "\n")
        sys.stdout.flush()
        
        return jsonify({
            "success": True,
            "chat_id": chat_id,
            "chat_nickname": chat_nickname,
            "emotions": top_emotions,
            "response": response_message,
            "avatarMood": avatar_mood,
            "modalities_used": modality_count,
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
        })
    
    except Exception as e:
        print(f"❌ Combined emotion error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==========================================
# CHAT MANAGEMENT ENDPOINTS
# ==========================================

@app.route('/api/chats', methods=['GET'])
@token_required
def get_user_chats(current_user):
    """Get all chats for the current user"""
    try:
        user_id = str(current_user['_id'])
        
        if db is None:
            return jsonify({'success': False, 'message': 'Database not available'}), 500
        
        # Get all chats for user, sorted by most recent
        chats = list(db.chats.find(
            {'user_id': ObjectId(user_id)}
        ).sort('updated_at', -1).limit(50))
        
        chat_list = []
        for chat in chats:
            # Get the last message for preview
            last_message = db.messages.find_one(
                {'chat_id': chat['_id']},
                sort=[('timestamp', -1)]
            )
            
            chat_list.append({
                'id': str(chat['_id']),
                'nickname': chat.get('nickname', 'New Chat'),
                'created_at': chat['created_at'].isoformat(),
                'updated_at': chat['updated_at'].isoformat(),
                'last_message': last_message['content'][:50] + '...' if last_message and len(last_message['content']) > 50 else last_message['content'] if last_message else None
            })
        
        return jsonify({
            'success': True,
            'chats': chat_list
        })
    
    except Exception as e:
        print(f"❌ Error getting chats: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/chats/new', methods=['POST'])
@token_required
def create_chat(current_user):
    """Create a new chat session"""
    try:
        user_id = str(current_user['_id'])
        chat_id = create_new_chat(user_id)
        
        if chat_id:
            return jsonify({
                'success': True,
                'chat_id': chat_id
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create chat'
            }), 500
    
    except Exception as e:
        print(f"❌ Error creating chat: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/chats/<chat_id>/messages', methods=['GET'])
@token_required
def get_chat_messages(current_user, chat_id):
    """Get all messages for a specific chat"""
    try:
        user_id = str(current_user['_id'])
        
        if db is None:
            return jsonify({'success': False, 'message': 'Database not available'}), 500
        
        # Verify chat belongs to user
        chat = db.chats.find_one({'_id': ObjectId(chat_id), 'user_id': ObjectId(user_id)})
        if not chat:
            return jsonify({'success': False, 'error': 'Chat not found'}), 404
        
        # Get messages
        messages = get_chat_history(chat_id, limit=100)
        
        return jsonify({
            'success': True,
            'chat_id': chat_id,
            'nickname': chat.get('nickname', 'New Chat'),
            'messages': messages
        })
    
    except Exception as e:
        print(f"❌ Error getting messages: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/chats/<chat_id>', methods=['DELETE'])
@token_required
def delete_chat(current_user, chat_id):
    """Delete a chat and all its messages"""
    try:
        user_id = str(current_user['_id'])
        
        if db is None:
            return jsonify({'success': False, 'message': 'Database not available'}), 500
        
        # Verify chat belongs to user
        chat = db.chats.find_one({'_id': ObjectId(chat_id), 'user_id': ObjectId(user_id)})
        if not chat:
            return jsonify({'success': False, 'error': 'Chat not found'}), 404
        
        # Delete all messages in the chat
        db.messages.delete_many({'chat_id': ObjectId(chat_id)})
        
        # Delete the chat
        db.chats.delete_one({'_id': ObjectId(chat_id)})
        
        return jsonify({
            'success': True,
            'message': 'Chat deleted successfully'
        })
    
    except Exception as e:
        print(f"❌ Error deleting chat: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# ERROR HANDLERS
# ==========================================
@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting HeadTTS Flask Backend...")
    print("="*60)
    sys.stdout.flush()
    
    print("📱 Login page: http://localhost:5000/login")
    print("🏠 Dashboard: http://localhost:5000/dashboard")
    print("💚 Health check: http://localhost:5000/api/health")
    print("🔗 API base: http://localhost:5000/api/auth")
    sys.stdout.flush()
    
    # Initialize database
    print("\n🔧 Initializing database...")
    sys.stdout.flush()
    init_database()
    
    print("✅ Database initialized successfully!")
    print("\n🎯 Server starting on http://0.0.0.0:5000")
    print("💡 Press Ctrl+C to stop\n")
    print("="*60 + "\n")
    sys.stdout.flush()
    
    # Use use_reloader=False to avoid Windows socket errors during development
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)