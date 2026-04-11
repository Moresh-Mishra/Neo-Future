# MERN Stack Chat System with Emotion Analysis

## Architecture Overview

This is a **MERN Stack** (MongoDB, Express, React, Node.js) project with Python microservices for ML models:

```
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  AICompanion.jsx│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Express.js Backend     │ (Port 5000)
│  - Chat Routes          │
│  - AI Routes            │
│  - MySQL Persistence    │
└────────┬────────────────┘
         │
         ├─────────────────────────────┐
         ▼                             ▼
    ┌─────────────┐           ┌──────────────────┐
    │  MySQL      │           │ Python Emotion   │ (Port 5001)
    │  Database   │           │ Service (Flask)  │
    │  - Chats    │           │ - Emotion        │
    │  - Messages │           │ - Analysis       │
    └─────────────┘           └──────────────────┘
                                     │
                                     ▼
                              ┌─────────────────┐
                              │  Ollama LLM     │ (Port 11434)
                              │  llama3.2       │
                              └─────────────────┘
```

## Setup Instructions

### 1. Install Node Dependencies

```bash
cd d:\Nuo_future\Neo-Future\stitch-health-analytics\server
npm install
```

### 2. Install Python Emotion Service Dependencies

```bash
# Activate virtualenv
d:\Nuo_future\.venv\Scripts\activate

# Install Python packages
pip install -r d:\Nuo_future\Neo-Future\stitch-health-analytics\server\emotion_backend\requirements.txt
```

### 3. Ensure MySQL is Running

```bash
# Verify MySQL is running (should already be)
mysql -u root -p -e "SELECT 1"
```

### 4. Database Initialization

The Express server will **automatically create** chat tables on startup via `initChatTables()` function. No manual SQL execution needed!

### 5. Start Services (in separate terminals)

**Terminal 1 - Start Ollama LLM:**
```bash
ollama serve
```

**Terminal 2 - Start Python Emotion Service:**
```bash
d:\Nuo_future\.venv\Scripts\python.exe d:\Nuo_future\Neo-Future\stitch-health-analytics\server\emotion_backend\emotion_service.py
```

**Terminal 3 - Start Express Backend:**
```bash
cd d:\Nuo_future\Neo-Future\stitch-health-analytics\server
npm start
```

**Terminal 4 - Start React Frontend:**
```bash
cd d:\Nuo_future\Neo-Future\stitch-health-analytics
npm start
```

## API Endpoints

### Chat Management Routes (`/api/chats`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/chats/new` | Create new chat |
| GET    | `/api/chats?user_id=1` | List user's chats |
| GET    | `/api/chats/{chat_id}/messages` | Get chat messages |
| POST   | `/api/chats/{chat_id}/messages` | Store message |
| DELETE | `/api/chats/{chat_id}` | Delete chat |
| PATCH  | `/api/chats/{chat_id}` | Update chat title |

### AI & Emotion Routes (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/ai/text-emotion` | Analyze emotion + generate response |
| POST   | `/api/ai/chat` | Simple chat (no emotion) |
| POST   | `/api/ai/analyze` | Emotion analysis only |

### Example Requests

**Create Chat:**
```bash
curl -X POST http://127.0.0.1:5000/api/chats/new \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "title": "My First Chat"}'
```

**Send Message with Emotion Analysis:**
```bash
curl -X POST http://127.0.0.1:5000/api/ai/text-emotion \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "I am feeling happy today!",
    "user_id": 1,
    "chat_id": 123,
    "history": []
  }'
```

**Get Chat Messages:**
```bash
curl http://127.0.0.1:5000/api/chats/123/messages
```

## Environment Configuration

**Frontend (.env):**
```
REACT_APP_EMOTION_API_BASE_URL=http://127.0.0.1:5000
```

**Backend (server/.env):**
```
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DATABASE=exercise_db
PORT=5000
PYTHON_EMOTION_SERVICE=http://127.0.0.1:5001
OLLAMA_API_URL=http://127.0.0.1:11434/api/chat
OLLAMA_MODEL=llama3.2:latest
```

**Emotion Service (server/emotion_backend/.env):**
```
EMOTION_PORT=5001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Key Features

✅ **Chat Persistence** - All conversations stored in MySQL
✅ **Conversation History** - 12-turn context window sent to LLM
✅ **Emotion Analysis** - Real-time emotion detection using transformers
✅ **Multi-Chat Support** - Create, manage, and switch between chats
✅ **Auto-Chat Creation** - New chats created if needed
✅ **Graceful Fallbacks** - Works even if emotion service is down
✅ **CORS Enabled** - React frontend can communicate with backend

## Database Schema

### ai_chats
```sql
- chat_id (PK)
- user_id (FK to users)
- title VARCHAR(255)
- created_at TIMESTAMP
- updated_at TIMESTAMP
```

### ai_chat_messages
```sql
- message_id (PK)
- chat_id (FK to ai_chats)
- role ENUM('user', 'assistant', 'system')
- content TEXT
- emotion JSON
- created_at TIMESTAMP
```

## Troubleshooting

### "Cannot find module 'axios'"
```bash
cd server && npm install axios
```

### Emotion service not responding
The Express backend includes fallbacks - it will use neutral emotion if the Python service is down.

### Chat tables not being created
Check that MySQL is running and user_id foreign key constraint doesn't fail. Tables are auto-created on server startup.

### Ollama connection refused
Ensure Ollama is running: `ollama serve` on port 11434

## Architecture Highlights

### Why Node.js/Express for Routing?
- Unified API layer for frontend
- Easier deployment and scaling
- Better performance for HTTP handling
- Simpler middleware integration

### Why Python for Emotion Models?
- Transformers library (best-in-class NLP)
- PyTorch ecosystem
- Easy model loading and inference
- Specialized ML tooling

### Database Choice - MySQL
- Relational structure for chats/messages
- ACID guarantees for chat persistence
- Complex queries for chat history
- Fits project's existing architecture

## Next Steps

1. ✅ Verify all services start without errors
2. ✅ Test chat creation via API
3. ✅ Verify messages persist in MySQL
4. ✅ Test emotion analysis works
5. ✅ Frontend loads and displays chat history
6. Optional: Add chat deletion UI to frontend
7. Optional: Auto-rename chats from first message

