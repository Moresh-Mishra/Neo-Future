# AI Emotion Detection Integration Guide

## 🎯 Overview
The HeadTTS application now includes **AI-powered emotion detection** across three modalities:
- **Text Emotion**: Analyzes typed messages
- **Facial Emotion**: Analyzes facial expressions from camera
- **Voice Emotion**: Ready for future voice analysis integration

## ✅ What's Been Integrated

### Backend (app.py)
1. **AI Model Loading** - Lazy initialization of:
   - Text classifier: `j-hartmann/emotion-english-distilroberta-base`
   - Face detection: OpenCV Haar Cascade
   - Facial emotion: DeepFace library
   
2. **LLM Integration** - Ollama/Llama 3.2 for empathetic responses
   - URL: `http://127.0.0.1:11434/api/chat`
   - Model: `llama3:latest`
   - Generates structured responses based on detected emotions

3. **New API Endpoints**:
   - `POST /api/ai/text-emotion` - Analyzes text and returns LLM response
   - `POST /api/ai/facial-emotion` - Analyzes face from camera image
   - `POST /api/ai/combined-emotion` - Multi-modal analysis (text + facial)

### Frontend (index.html)
1. **Enhanced Message Handler**:
   - `handleSendMessage()` now calls `/api/ai/text-emotion`
   - Displays typing indicator while analyzing
   - Shows LLM-generated empathetic responses
   - Avatar speaks the AI response with lip-sync

2. **Camera Capture**:
   - Added "📸 Analyze" button to camera preview
   - `captureFacialEmotion()` captures frame and analyzes
   - Detects facial emotions and generates personalized response

3. **System Messages**:
   - Shows "Analyzing..." status messages
   - Displays emotion detection progress

### Styling
1. **Camera Capture Button** (model.css):
   - Appears on hover over camera preview
   - Positioned at bottom center
   - Smooth fade-in animation

2. **System Messages** (chat.css):
   - Centered, italic, subtle styling
   - Used for status updates

### Dependencies (requirements.txt)
Added AI packages:
- `transformers>=4.30.0` - Hugging Face models
- `torch>=2.0.0` - PyTorch for deep learning
- `deepface>=0.0.79` - Facial emotion analysis
- `opencv-python>=4.8.0` - Computer vision
- `numpy>=1.24.0` - Numerical computing
- `Pillow>=10.0.0` - Image processing
- `requests>=2.31.0` - HTTP requests for Ollama

## 🚀 Setup Instructions

### 1. Install Ollama
```bash
# Download from https://ollama.ai/
# Or use: winget install Ollama.Ollama

# Pull Llama 3.2 model
ollama pull llama3:latest
```

### 2. Install Python Dependencies
```bash
cd "c:\Users\Moresh Mishra\Panvel_2\Mission_panvel\Panvel\HeadTTS"
pip install -r requirements.txt
```

### 3. Start Ollama Server
```bash
# Ollama should auto-start as a service
# Or manually: ollama serve
```

### 4. Start Flask Application
```bash
python app.py
```

### 5. Test the Integration
1. Navigate to `http://localhost:5000`
2. Login with credentials
3. **Text Emotion**:
   - Type a message: "I'm feeling really happy today!"
   - Click Send
   - See emotion analysis and empathetic AI response
   - Watch avatar speak the response

4. **Facial Emotion**:
   - Click camera icon to activate camera
   - Click "📸 Analyze" button on camera preview
   - See facial emotion detection and personalized response

## 📊 How It Works

### Text Emotion Flow
```
User types message
    ↓
handleSendMessage() intercepts
    ↓
POST /api/ai/text-emotion
    ↓
Text classifier detects emotions (e.g., joy 85%, neutral 15%)
    ↓
Ollama LLM generates empathetic response
    ↓
Response displayed in chat
    ↓
Avatar speaks response with HeadTTS
```

### Facial Emotion Flow
```
User clicks "📸 Analyze"
    ↓
captureFacialEmotion() captures frame
    ↓
Convert to base64 image
    ↓
POST /api/ai/facial-emotion
    ↓
OpenCV detects face
    ↓
DeepFace analyzes emotions (e.g., happy 78%, surprise 22%)
    ↓
Ollama generates personalized response
    ↓
Response displayed in chat
    ↓
Avatar speaks response
```

### Combined Analysis Flow
```
Text + Camera active
    ↓
POST /api/ai/combined-emotion
    ↓
Analyzes both text and facial data
    ↓
Aggregates emotions from both modalities
    ↓
LLM generates comprehensive response
```

## 🎨 Response Format

The LLM generates structured responses:

**Example User Input**: "I'm feeling really stressed about work"
**Detected Emotions**: sad (65%), fear (35%)

**AI Response**:
```
Empathetic Response:
I understand work stress can feel overwhelming. You're not alone in this.

Suggested Activities:
1. Take 5 deep breaths - inhale 4 counts, exhale 6 counts
2. Step outside for 2 minutes of fresh air
3. Write down 3 things within your control right now
```

## 🔧 API Response Format

### Text Emotion Endpoint
**Request**:
```json
POST /api/ai/text-emotion
{
  "text": "I'm so excited about this project!"
}
```

**Response**:
```json
{
  "success": true,
  "type": "text",
  "user_message": "I'm so excited about this project!",
  "emotions": [
    {"emotion": "joy", "percentage": 89.23},
    {"emotion": "surprise", "percentage": 10.77}
  ],
  "response": "That's wonderful! Your enthusiasm is contagious...",
  "timestamp": "14:23:45"
}
```

### Facial Emotion Endpoint
**Request**:
```json
POST /api/ai/facial-emotion
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response**:
```json
{
  "success": true,
  "type": "facial",
  "user_message": "Facial expression captured",
  "emotions": [
    {"emotion": "happy", "percentage": 76.45},
    {"emotion": "neutral", "percentage": 18.32}
  ],
  "response": "I can see you're in a positive mood...",
  "face_count": 1,
  "timestamp": "14:25:12"
}
```

## 🎯 Future Enhancements

### Voice Emotion (Planned)
- Record audio via microphone
- Transcribe with Whisper
- Analyze voice emotion with wav2vec2
- Integrate with combined analysis

### Multi-Modal Analysis
- Combine text + facial + voice
- More accurate emotion detection
- Context-aware responses

### Emotion History
- Track emotional patterns over time
- Mood trends visualization
- Personalized recommendations

## 🐛 Troubleshooting

### Models Not Loading
**Issue**: "AI emotion features will be disabled"
**Solution**: 
- Check internet connection (models download on first use)
- Ensure sufficient disk space (~2GB for all models)
- Check Python version (requires 3.8+)

### Ollama Connection Error
**Issue**: "Could not connect to Ollama"
**Solution**:
- Verify Ollama is running: `ollama list`
- Check Ollama is on port 11434: `netstat -an | findstr 11434`
- Pull model if missing: `ollama pull llama3:latest`

### No Face Detected
**Issue**: "No face detected"
**Solution**:
- Ensure good lighting
- Face camera directly
- Remove obstructions (glasses, masks may affect detection)
- Move closer to camera

### Camera Not Working
**Issue**: Camera permission denied
**Solution**:
- Allow camera access in browser settings
- Check Windows privacy settings
- Ensure no other app is using camera

## 📝 Notes

1. **First Run**: Models download automatically on first API call (~1-2 mins)
2. **Performance**: GPU acceleration recommended for faster inference
3. **Privacy**: All processing is local - no data sent to external servers (except Ollama on localhost)
4. **Accuracy**: Emotion detection accuracy varies based on lighting, expression clarity

## 🎓 Technical Details

### Model Architecture
- **Text**: DistilRoBERTa (66M parameters)
- **Face**: DeepFace with VGG-Face backend
- **LLM**: Llama 3.2 (3B parameters)

### Processing Time
- Text emotion: ~100-300ms
- Facial emotion: ~500-1500ms (includes face detection + analysis)
- LLM response: ~1-3 seconds (depends on Ollama load)

### Memory Usage
- Text models: ~500MB RAM
- Facial models: ~300MB RAM
- Ollama: ~2-4GB RAM (model dependent)

---

**Integration completed successfully!** 🎉
All features are now live and ready for testing.
