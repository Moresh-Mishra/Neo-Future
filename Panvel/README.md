# EmWell AI - Emotional Intelligence Chatbot 🤖💙

> An advanced AI-powered emotional intelligence platform featuring 3D avatars, real-time emotion detection, and personalized mental wellness support.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Project Overview

**EmWell AI** is a cutting-edge emotional intelligence platform that combines artificial intelligence, 3D visualization, and mental wellness support. Built for the Panvel Hackathon, this platform provides users with an empathetic AI companion capable of understanding emotions through text and voice, delivering personalized responses via realistic 3D avatars.

### ✨ Key Features

- 🎭 **Multi-Modal Emotion Detection** - Analyzes text and voice for emotional context
- 🗣️ **3D Avatar Integration** - Realistic avatars with lip-sync and facial expressions  
- 🎯 **Personalized Responses** - AI-driven conversations tailored to emotional state
- 💾 **Session Management** - Persistent chat history and user profiles
- 🔒 **Secure Authentication** - JWT-based user authentication system
- 📱 **Responsive Design** - Works seamlessly across desktop and mobile devices
- 🌍 **Multi-Language Support** - Built-in language processing capabilities
- 📊 **Emotion Analytics** - Track emotional patterns and wellness progress

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[HTML/CSS/JS] --> B[3D Avatar Engine]
        A --> C[TTS Engine]  
        A --> D[Voice Recording]
    end
    
    subgraph "API Layer"
        E[Flask Application] --> F[Authentication]
        E --> G[Chat Management]
        E --> H[Emotion Processing]
    end
    
    subgraph "AI/ML Layer"
        I[Text Emotion Analysis] --> J[Transformers/BERT]
        K[Voice Emotion Analysis] --> L[Wav2Vec2]
        M[Response Generation] --> N[LangChain Memory]
    end
    
    subgraph "Data Layer"
        O[MongoDB Atlas] --> P[User Profiles]
        O --> Q[Chat Sessions]
        O --> R[Emotion Data]
    end
    
    A --> E
    E --> I
    E --> K
    E --> O
```

### 🔄 Data Flow

1. **User Input** → Text/Voice captured by frontend
2. **Emotion Analysis** → AI models process emotional content  
3. **Context Building** → LangChain maintains conversation memory
4. **Response Generation** → AI generates empathetic responses
5. **Avatar Rendering** → 3D avatar delivers response with TTS
6. **Data Persistence** → Session data stored in MongoDB

---

## 🛠️ Tech Stack

### **Backend**
- **Framework:** Flask 2.3.3 (Python)
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** JWT (JSON Web Tokens)
- **AI/ML:** Transformers, PyTorch, DeepFace
- **Memory:** LangChain for conversation context

### **Frontend**  
- **Core:** Vanilla JavaScript (ES6 Modules)
- **3D Graphics:** Three.js + TalkingHead library
- **Audio:** Web Audio API, MediaRecorder API
- **Styling:** Modern CSS with CSS Grid/Flexbox
- **Icons:** Font Awesome integration

### **AI & Machine Learning**
- **Text Emotion:** Transformer models (BERT-based)
- **Voice Emotion:** Wav2Vec2 models  
- **Speech Recognition:** Whisper (OpenAI)
- **Text-to-Speech:** Browser-native Web Speech API
- **Computer Vision:** OpenCV, DeepFace (facial analysis)

### **Deployment & Infrastructure**
- **Development:** Local Flask server
- **Production:** Vercel (Serverless functions)
- **Database:** MongoDB Atlas (Cloud)
- **CDN:** Three.js via CDN, static assets

---

## 📁 Project Structure

```
EmWell/
│
├── 📚 DOCUMENTATION
│   ├── README.md                    # Main documentation
│   ├── PROJECT_ANALYSIS.md          # Detailed project analysis
│   ├── AI_INTEGRATION_GUIDE.md      # AI integration guide
│   ├── AI_VOICE_EMOTION_INTEGRATION.md
│   └── VOICE_EMOTION_GUIDE.md
│
├── 🐍 BACKEND (Flask Application)
│   ├── app.py                       # Main Flask server (2185 lines)
│   ├── requirements.txt             # Python dependencies
│   ├── db.py                        # Database utilities (213 lines)
│   ├── session_routes.py            # Session management (95 lines)  
│   ├── message_routes.py            # Message handling (150 lines)
│   ├── emotion_activities.py        # Emotion-based activities
│   └── .env                         # Environment variables
│
├── 🎨 FRONTEND ASSETS
│   ├── templates/                   # HTML templates
│   │   ├── index.html              # Main chat interface (2114 lines)
│   │   ├── login.html              # Authentication page  
│   │   ├── home.html               # Landing page
│   │   ├── review.html             # Session review
│   │   └── test_voice_emotion.html # Voice testing
│   │
│   └── static/                     # Static assets
│       ├── modules/                # JavaScript ES6 modules
│       │   ├── headtts.mjs         # Main TTS engine (1050+ lines)
│       │   ├── worker-tts.mjs      # Web Worker for TTS
│       │   ├── utils.mjs           # Utility functions
│       │   ├── language.mjs        # Language processing
│       │   └── language-en-us.mjs  # English language data
│       │
│       ├── styles/                 # CSS stylesheets
│       │   ├── variables.css       # CSS custom properties
│       │   ├── layout.css          # Main layout system
│       │   ├── chat.css            # Chat interface styles
│       │   ├── sidebar.css         # Navigation sidebar
│       │   ├── model.css           # 3D model viewer
│       │   ├── home.css            # Landing page styles
│       │   └── responsive.css      # Mobile responsiveness
│       │
│       ├── avatars/                # 3D avatar models
│       │   ├── julia.glb           # Female avatar (GLB format)
│       │   └── david.glb           # Male avatar (GLB format)
│       │  
│       └── voices/                 # Voice synthesis data
│           ├── af_bella.bin        # Female voice data
│           └── am_fenrir.bin       # Male voice data
│
├── 📖 LANGUAGE RESOURCES
│   └── dictionaries/
│       └── en-us.txt               # English pronunciation dictionary
│
├── 📊 REPORTS & ANALYTICS  
│   └── Report/
│       ├── pdf_report.py           # PDF report generation
│       └── report_generator.py     # Analytics reporting
│
└── 🧪 TESTING & UTILITIES
    ├── simple_pdf_test.py          # PDF testing
    └── test_reports/               # Generated test reports
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.9+
- MongoDB Atlas account
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/panvel-ai-chat.git
cd panvel-ai-chat
```

2. **Set up environment**
```bash
cd HeadTTS
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas credentials
```

4. **Run the application**
```bash
python app.py
```

5. **Access the application**
- Login Page: http://localhost:5000/login
- Main Chat: http://localhost:5000/
- Landing Page: http://localhost:5000/home

---

## 🔧 Configuration

### Environment Variables

```env
# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=headtts

# JWT Configuration  
JWT_SECRET_KEY=your_super_secret_key_here

# AI Model Configuration (Optional)
LLM_DEBUG_OUTPUT=false
EMOTION_API_ENDPOINT=https://api.example.com/emotion
VOICE_API_ENDPOINT=https://api.example.com/voice

# Development Settings
FLASK_ENV=development
FLASK_DEBUG=True
```

### MongoDB Collections

- **users** - User profiles and authentication data
- **chat_sessions** - Chat session metadata  
- **messages** - Individual chat messages with emotion data
- **emotion_analytics** - Aggregated emotion insights

---

## 📡 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login  
POST /api/auth/logout
GET  /api/auth/profile
```

### Chat Management

```http
GET    /api/sessions              # List user sessions
POST   /api/sessions              # Create new session
GET    /api/sessions/{id}         # Get session details
DELETE /api/sessions/{id}         # Delete session

GET    /api/sessions/{id}/messages # Get session messages
POST   /api/sessions/{id}/messages # Send new message
```

### Emotion Analysis

```http
POST /api/emotions/analyze-text    # Analyze text emotion
POST /api/emotions/analyze-voice   # Analyze voice emotion  
GET  /api/emotions/activities      # Get emotion-based activities
```

---

## 🎭 Features Deep Dive

### Emotion Detection System
- **Text Analysis:** Uses transformer models to detect emotional tone, sentiment, and intensity
- **Voice Analysis:** Processes audio for emotional markers using Wav2Vec2
- **Facial Recognition:** Optional webcam-based emotion detection via DeepFace
- **Multi-Modal Fusion:** Combines multiple input sources for accurate emotion assessment

### 3D Avatar System  
- **Realistic Models:** High-quality GLB format avatars with facial rigging
- **Lip Synchronization:** Real-time mouth movement matching TTS output
- **Emotional Expression:** Dynamic facial expressions based on conversation context
- **Customization:** Multiple avatar options (Julia, David) with voice matching

### Conversation Intelligence
- **Memory Management:** LangChain maintains conversation context across sessions
- **Personalization:** Adapts responses based on user emotional patterns  
- **Activity Suggestions:** Recommends wellness activities based on detected emotions
- **Progress Tracking:** Analytics dashboard for emotional wellness journey

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Prepare for deployment**
```bash
# Remove heavy AI dependencies for serverless deployment
pip install --no-deps -r requirements-light.txt
```

2. **Configure vercel.json**
```json
{
  "functions": {
    "api/*.py": { "runtime": "python3.9" }
  },
  "build": {
    "env": {
      "PYTHON_VERSION": "3.9"
    }
  }
}
```

3. **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

### Traditional Server Deployment
- **Docker:** Multi-stage build with Python + Nginx
- **Railway/Render:** Direct Flask deployment with AI models
- **AWS/GCP:** Container deployment with managed databases

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Three.js Community** - For excellent 3D web graphics capabilities  
- **Hugging Face** - For state-of-the-art AI model accessibility
- **MongoDB Atlas** - For reliable cloud database services
- **TalkingHead Library** - For seamless 3D avatar integration

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/yourusername/panvel-ai-chat/issues)
- **Email:** your.email@example.com
- **Documentation:** [Full Documentation](https://docs.example.com)

---

<div align="center">

**Made with ❤️ for Panvel Hackathon 2026**

[⭐ Star this repo](https://github.com/yourusername/panvel-ai-chat) • [🐛 Report Bug](https://github.com/yourusername/panvel-ai-chat/issues) • [💡 Request Feature](https://github.com/yourusername/panvel-ai-chat/issues)

</div>
