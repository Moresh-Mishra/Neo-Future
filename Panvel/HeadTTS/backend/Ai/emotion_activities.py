"""
Emotion-based Activity Database
Contains curated activities and coping strategies for different emotional states
"""

EMOTION_ACTIVITIES = {
    "angry": {
        "immediate_relief": [
            "Take 10 deep breaths - inhale for 4, hold for 4, exhale for 6",
            "Do 20 jumping jacks or run in place for 1 minute to release tension",
            "Squeeze a stress ball or crumple paper tightly for 30 seconds",
            "Step outside for fresh air and count to 20 slowly",
            "Splash cold water on your face and wrists",
            "Listen to calming music or nature sounds for 5 minutes",
            "Write down what made you angry without filtering",
            "Do a quick wall push or punch a pillow safely"
        ],
        "short_activities": [
            "Walk around the block or pace in a safe space",
            "Draw or scribble aggressively on paper to express feelings",
            "Clean or organize something to channel energy productively",
            "Do a 5-minute guided meditation for anger",
            "Talk to someone you trust about what happened",
            "Practice progressive muscle relaxation",
            "Count backwards from 100 by 3s to distract your mind",
            "Tear up old newspapers or magazines as a physical outlet"
        ],
        "reflection": [
            "Journal about what triggered the anger and why",
            "Identify if the anger is masking hurt, fear, or disappointment",
            "Think of 3 different perspectives on the situation",
            "List what you can and cannot control in this situation",
            "Plan a constructive conversation if needed"
        ]
    },
    
    "sad": {
        "immediate_relief": [
            "Let yourself cry if you need to - it's healthy to release",
            "Hug a pillow, pet, or trusted person",
            "Drink a warm cup of tea or hot chocolate",
            "Wrap yourself in a cozy blanket",
            "Listen to a comforting playlist or your favorite song",
            "Look at photos that bring happy memories",
            "Watch a short funny video or comedy clip",
            "Step outside and feel the sun on your face"
        ],
        "short_activities": [
            "Take a warm shower or bath to soothe yourself",
            "Do gentle stretching or yoga for 10 minutes",
            "Call or text a friend who makes you feel better",
            "Write down 3 things you're grateful for today",
            "Read a favorite book or comforting story",
            "Cook or eat something you enjoy",
            "Watch a comfort movie or show episode",
            "Do a small act of kindness for someone else"
        ],
        "reflection": [
            "Journal about what's making you feel sad",
            "Remind yourself that this feeling is temporary",
            "List times you've overcome sadness before",
            "Identify if you need support from someone",
            "Plan one small thing to look forward to tomorrow"
        ]
    },
    
    "fear": {
        "immediate_relief": [
            "Use the 5-4-3-2-1 grounding technique (5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste)",
            "Practice box breathing - inhale 4, hold 4, exhale 4, hold 4",
            "Hold an ice cube in your hand to ground yourself in the present",
            "Place your hand on your heart and feel it beating",
            "Stomp your feet firmly on the ground to reconnect with reality",
            "Splash cold water on your face",
            "Hum or sing a familiar song out loud",
            "Repeat a calming phrase like 'I am safe right now'"
        ],
        "short_activities": [
            "Talk to someone you trust about what's worrying you",
            "Write down your fears and rate them from 1-10",
            "Do a progressive muscle relaxation exercise",
            "Go for a walk in a familiar, safe place",
            "Listen to a guided meditation for anxiety",
            "Do a physical activity to release nervous energy",
            "Watch a lighthearted show or video",
            "Organize or clean your immediate space"
        ],
        "reflection": [
            "Ask yourself: 'What's the worst that could happen? How likely is it?'",
            "List evidence for and against your fear",
            "Identify what you can control vs. what you can't",
            "Write down coping strategies you've used before",
            "Plan one small step to face the fear if appropriate"
        ]
    },
    
    "happy": {
        "enhance_mood": [
            "Dance to your favorite upbeat song",
            "Call someone you love and share your good news",
            "Take a photo or video to capture this moment",
            "Write down why you're feeling happy to remember later",
            "Do something creative - draw, sing, or write",
            "Share your happiness with someone - compliment them or help",
            "Try something new you've been wanting to do",
            "Spend time in nature and appreciate the beauty around you"
        ],
        "short_activities": [
            "Start a gratitude journal entry",
            "Plan a fun activity for later this week",
            "Exercise or go for an energetic walk",
            "Listen to your favorite music playlist",
            "Cook a special meal or treat for yourself",
            "Connect with friends or family",
            "Work on a hobby you enjoy",
            "Organize something you've been meaning to"
        ],
        "sustain": [
            "Reflect on what contributed to this happiness",
            "Set a positive intention for the rest of the day",
            "Do a random act of kindness",
            "Take care of your body - good food, rest, movement",
            "Make plans to do more of what makes you happy"
        ]
    },
    
    "surprised": {
        "process_emotion": [
            "Take a moment to pause and breathe deeply",
            "Notice how your body feels right now",
            "Write down what just happened",
            "Talk to someone about the surprising event",
            "Give yourself time to process without judgment"
        ],
        "short_activities": [
            "Do a quick body scan meditation",
            "Go for a short walk to clear your head",
            "Journal about the surprise and how you feel",
            "Call a friend to share the news",
            "Do something grounding like organizing or cleaning"
        ],
        "reflection": [
            "Identify whether this is a positive or challenging surprise",
            "Think about how to respond thoughtfully, not reactively",
            "Consider what this means for you moving forward",
            "List any actions you might need to take",
            "Acknowledge your resilience in handling unexpected events"
        ]
    },
    
    "disgust": {
        "immediate_relief": [
            "Remove yourself from the situation if possible",
            "Take deep breaths through your mouth",
            "Drink water or chew gum to reset your senses",
            "Open windows for fresh air",
            "Wash your hands or face with cool water",
            "Focus on something pleasant - a favorite scent or image",
            "Listen to calming music",
            "Do gentle stretching to release tension"
        ],
        "short_activities": [
            "Go outside and breathe fresh air",
            "Clean or organize your space",
            "Take a shower to feel refreshed",
            "Engage in a pleasant sensory experience (favorite food, music, scent)",
            "Talk about what bothered you with someone understanding",
            "Watch something uplifting or funny",
            "Do a creative activity to shift focus",
            "Exercise to release the uncomfortable feeling"
        ],
        "reflection": [
            "Identify what specifically triggered the disgust",
            "Determine if this is about values, boundaries, or physical discomfort",
            "Consider if you need to set boundaries or make changes",
            "Reflect on whether the reaction is proportionate",
            "Think about how to prevent or handle this situation in the future"
        ]
    },
    
    "neutral": {
        "enhance_wellbeing": [
            "Do a 5-minute mindfulness meditation",
            "Take a short walk outside",
            "Drink water and have a healthy snack",
            "Stretch or do light yoga",
            "Listen to music you enjoy",
            "Read something interesting",
            "Connect with a friend or family member",
            "Work on a hobby or interest"
        ],
        "self_care": [
            "Check in with your basic needs - food, water, rest",
            "Tidy your immediate space",
            "Plan something to look forward to",
            "Practice gratitude - list 3 good things",
            "Do some light exercise or movement",
            "Engage in a creative activity",
            "Learn something new for 10 minutes",
            "Help someone else with a small task"
        ],
        "reflection": [
            "Set an intention for the rest of your day",
            "Journal about how you're feeling",
            "Consider your goals and priorities",
            "Reflect on recent wins and challenges",
            "Plan one thing to nourish yourself today"
        ]
    }
}


def get_activities_for_emotion(emotion, category="all", count=3):
    """
    Get curated activities for a specific emotion
    
    Args:
        emotion (str): The emotion (angry, sad, fear, happy, surprised, disgust, neutral)
        category (str): Category of activities - "immediate_relief", "short_activities", 
                       "reflection", "enhance_mood", "sustain", "process_emotion", etc.
                       Use "all" to get from all categories
        count (int): Number of activities to return
    
    Returns:
        list: List of activity strings
    """
    emotion = emotion.lower()
    
    if emotion not in EMOTION_ACTIVITIES:
        emotion = "neutral"
    
    emotion_data = EMOTION_ACTIVITIES[emotion]
    
    if category == "all":
        # Get activities from all categories for this emotion
        all_activities = []
        for activities in emotion_data.values():
            all_activities.extend(activities)
        
        import random
        random.shuffle(all_activities)
        return all_activities[:count]
    
    elif category in emotion_data:
        activities = emotion_data[category]
        import random
        return random.sample(activities, min(count, len(activities)))
    
    else:
        # Fallback: get from first available category
        first_category = list(emotion_data.values())[0]
        import random
        return random.sample(first_category, min(count, len(first_category)))


def get_structured_activities(emotion, immediate=2, short=2, reflection=1):
    """
    Get a structured set of activities across different time frames
    
    Args:
        emotion (str): The emotion
        immediate (int): Number of immediate relief activities
        short (int): Number of short-term activities
        reflection (int): Number of reflection prompts
    
    Returns:
        dict: Dictionary with categorized activities
    """
    emotion = emotion.lower()
    if emotion not in EMOTION_ACTIVITIES:
        emotion = "neutral"
    
    emotion_data = EMOTION_ACTIVITIES[emotion]
    result = {}
    
    import random
    
    # Try to get immediate relief activities
    immediate_key = None
    for key in ["immediate_relief", "process_emotion", "enhance_mood", "enhance_wellbeing"]:
        if key in emotion_data:
            immediate_key = key
            break
    
    if immediate_key:
        result["immediate"] = random.sample(
            emotion_data[immediate_key], 
            min(immediate, len(emotion_data[immediate_key]))
        )
    
    # Try to get short activities
    short_key = None
    for key in ["short_activities", "self_care", "sustain"]:
        if key in emotion_data:
            short_key = key
            break
    
    if short_key:
        result["short_term"] = random.sample(
            emotion_data[short_key],
            min(short, len(emotion_data[short_key]))
        )
    
    # Get reflection activities
    if "reflection" in emotion_data:
        result["reflection"] = random.sample(
            emotion_data["reflection"],
            min(reflection, len(emotion_data["reflection"]))
        )
    
    return result
