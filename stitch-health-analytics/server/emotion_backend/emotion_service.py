#!/usr/bin/env python3
"""
Emotion Analysis Microservice
Provides emotion detection and text analysis via REST API
Runs on port 5001 by default
"""

import json
import os
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Emotion Analysis Models (lazy loaded)
emotion_pipeline = None
whisper_model = None

def get_emotion_pipeline():
    """Lazy load emotion detection model"""
    global emotion_pipeline
    if emotion_pipeline is None:
        try:
            from transformers import pipeline
            emotion_pipeline = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                top_k=None
            )
            print("✓ Emotion detection model loaded")
        except Exception as e:
            print(f"✗ Failed to load emotion model: {e}")
            return None
    return emotion_pipeline

def get_emotion_scores(predictions):
    """Convert transformer predictions to structured emotion data"""
    scores = {}
    predicted_emotion = 'neutral'
    confidence = 0.5
    
    if predictions and len(predictions) > 0:
        # Handle both single prediction and list of predictions
        if isinstance(predictions[0], list):
            predictions = predictions[0]
        
        # Extract top emotion
        top_result = predictions[0]
        predicted_emotion = top_result['label'].lower()
        confidence = float(top_result['score'])
        
        # Create scores object
        for pred in predictions:
            label = pred['label'].lower()
            score = float(pred['score'])
            scores[label] = score
    
    return {
        'predicted_emotion': predicted_emotion,
        'confidence': confidence,
        'scores': scores
    }

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'message': 'Emotion Analysis Service is running',
        'port': os.getenv('EMOTION_PORT', 5001)
    })

@app.route('/api/analyze/emotion', methods=['POST'])
def analyze_emotion():
    """
    Analyze emotion from text
    Request: { "text": "I am so happy!" }
    Response: { "emotion": { "predicted_emotion": "joy", "confidence": 0.95, "scores": {...} } }
    """
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'text is required'
            }), 400
        
        # Get or load emotion model
        pipeline = get_emotion_pipeline()
        if not pipeline:
            return jsonify({
                'success': True,
                'emotion': {
                    'predicted_emotion': 'neutral',
                    'confidence': 0.5,
                    'scores': {'neutral': 0.5}
                }
            })
        
        # Run emotion analysis
        predictions = pipeline(text)
        emotion_data = get_emotion_scores(predictions)
        
        return jsonify({
            'success': True,
            'emotion': emotion_data,
            'text_length': len(text)
        })
    
    except Exception as e:
        print(f"Emotion analysis error: {e}")
        return jsonify({
            'success': True,
            'emotion': {
                'predicted_emotion': 'neutral',
                'confidence': 0.5,
                'scores': {'neutral': 0.5}
            },
            'error': str(e)
        })

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    """
    Comprehensive text analysis
    Includes emotion, basic NLU
    """
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'text is required'
            }), 400
        
        # Basic text analysis
        analysis = {
            'text': text,
            'length': len(text),
            'word_count': len(text.split()),
            'char_count': len(text),
            'has_sentiment': bool(text)  # Placeholder
        }
        
        # Add emotion analysis
        pipeline = get_emotion_pipeline()
        if pipeline:
            predictions = pipeline(text)
            analysis['emotion'] = get_emotion_scores(predictions)
        else:
            analysis['emotion'] = {
                'predicted_emotion': 'neutral',
                'confidence': 0.5,
                'scores': {'neutral': 0.5}
            }
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    
    except Exception as e:
        print(f"Text analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/batch-emotion', methods=['POST'])
def batch_emotion():
    """
    Analyze emotions for multiple texts
    Request: { "texts": ["text1", "text2", ...] }
    """
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts or not isinstance(texts, list):
            return jsonify({
                'success': False,
                'error': 'texts array is required'
            }), 400
        
        pipeline = get_emotion_pipeline()
        if not pipeline:
            return jsonify({
                'success': True,
                'results': [
                    {
                        'text': text,
                        'emotion': {
                            'predicted_emotion': 'neutral',
                            'confidence': 0.5,
                            'scores': {'neutral': 0.5}
                        }
                    }
                    for text in texts
                ]
            })
        
        results = []
        for text in texts:
            predictions = pipeline(text)
            emotion_data = get_emotion_scores(predictions)
            results.append({
                'text': text,
                'emotion': emotion_data
            })
        
        return jsonify({
            'success': True,
            'results': results
        })
    
    except Exception as e:
        print(f"Batch emotion analysis error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('EMOTION_PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    
    print(f"\n{'='*60}")
    print(f"🎭 Emotion Analysis Microservice")
    print(f"{'='*60}")
    print(f"Starting on http://127.0.0.1:{port}")
    print(f"Health check: http://127.0.0.1:{port}/api/health")
    print(f"{'='*60}\n")
    
    app.run(host='127.0.0.1', port=port, debug=debug)
