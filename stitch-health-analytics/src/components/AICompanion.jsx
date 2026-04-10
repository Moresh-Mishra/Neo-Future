import React, { useState, useRef, useEffect } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';

const PANVEL_BASE_URL = process.env.REACT_APP_PANVEL_BASE_URL || '';
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const AVATAR_BASE_URL = PANVEL_BASE_URL
  ? `${PANVEL_BASE_URL}/static/avatars`
  : `${PUBLIC_URL}/avatars`;
const TTS_ENDPOINTS = ['webgpu', 'ws://127.0.0.1:8882/', 'wasm'];
const VOICE_URL = `${PUBLIC_URL}/voices`;

const AVATARS = {
  julia: {
    avatar: {
      url: `${AVATAR_BASE_URL}/julia.glb`,
      body: 'F',
      avatarMood: 'neutral',
    },
    view: {
      cameraY: 0,
    },
  },
  david: {
    avatar: {
      url: `${AVATAR_BASE_URL}/david.glb`,
      body: 'M',
      avatarMood: 'neutral',
    },
    view: {
      cameraY: -0.04,
    },
  },
};

const AVATAR_LABELS = {
  julia: 'Julia',
  david: 'David',
};

const PANVEL_CAMERA = {
  cameraView: 'upper',
  cameraRotateEnable: false,
  mixerGainSpeech: 3,
};

const AICompanion = () => {
  // Input State
  const [message, setMessage] = useState('');
  
  // Message Management
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Welcome back to your sanctuary. I've been reflecting on our session yesterday. How is your heart feeling in this moment?",
      time: '10:24 AM',
      role: 'ai',
    },
    {
      type: 'user',
      text: "I feel a bit overwhelmed by the noise today. I just need some space to breathe and find my center.",
      time: '10:25 AM',
      role: 'user',
    },
    {
      type: 'bot',
      text: "That is perfectly valid. The world can be loud. Let's focus on a rhythmic grounding exercise together. Shall we start with the forest breath?",
      time: '10:26 AM',
      suggestions: ['Yes, let\'s start', 'Maybe later'],
      role: 'ai',
    },
  ]);

  // Chat Management States (from Panvel)
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState('julia');
  const [avatarMood, setAvatarMood] = useState('neutral');
  const [error, setError] = useState(null);
  const [avatarReady, setAvatarReady] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const messagesEndRef = useRef(null);
  const avatarContainerRef = useRef(null);
  const avatarInstanceRef = useRef({ head: null, headtts: null });
  const cameraStreamRef = useRef(null);
  const cameraVideoRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakResponse = async (text) => {
    const headtts = avatarInstanceRef.current?.headtts;
    if (!headtts || !text) {
      return;
    }

    try {
      setIsSpeaking(true);
      await headtts.synthesize({ input: text });
    } catch (speechError) {
      console.error('HeadTTS synthesize error:', speechError);
      setIsSpeaking(false);
    }
  };

  // Initialize chat on component mount
  useEffect(() => {
    initializeChat();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensureHeadSetup = async () => {
      if (!avatarContainerRef.current) {
        return null;
      }

      if (avatarInstanceRef.current.head && avatarInstanceRef.current.headtts) {
        return avatarInstanceRef.current;
      }

      const TalkingHead = window.TalkingHead;
      const HeadTTS = window.HeadTTS;

      if (!TalkingHead || !HeadTTS) {
        throw new Error('TalkingHead modules not loaded');
      }

      const head = new TalkingHead(avatarContainerRef.current, {
        ttsEndpoint: 'N/A',
        lipsyncModules: [],
        cameraView: PANVEL_CAMERA.cameraView,
        mixerGainSpeech: PANVEL_CAMERA.mixerGainSpeech,
        cameraRotateEnable: PANVEL_CAMERA.cameraRotateEnable,
      });

      const headtts = new HeadTTS({
        endpoints: TTS_ENDPOINTS,
        languages: ['en-us'],
        voices: ['af_bella', 'am_fenrir'],
        voiceURL: VOICE_URL,
        audioCtx: head.audioCtx,
        trace: 0,
      });

      headtts.onmessage = (msg) => {
        if (msg.type === 'audio') {
          try {
            head.speakAudio(msg.data, {});
          } catch (speechError) {
            console.error('TalkingHead playback error:', speechError);
          }
        } else if (msg.type === 'error') {
          console.error('HeadTTS error:', msg.data?.error || 'Unknown error');
        }
      };

      headtts.onend = () => {
        setIsSpeaking(false);
      };

      avatarInstanceRef.current = { head, headtts };
      return avatarInstanceRef.current;
    };

    const loadAvatar = async () => {
      if (!avatarContainerRef.current) {
        return;
      }

      setAvatarReady(false);
      setAvatarError('');

      try {
        const instance = await ensureHeadSetup();
        if (cancelled || !instance) {
          return;
        }

        const person = AVATARS[currentAvatar] || AVATARS.julia;

        await Promise.all([
          instance.head.showAvatar(person.avatar),
          instance.headtts.connect(),
        ]);

        instance.head.setView(instance.head.viewName, person.view);
        instance.head.cameraClock = 999;
        instance.headtts.setup({
          voice: person.avatar.body === 'M' ? 'am_fenrir' : 'af_bella',
          language: 'en-us',
          speed: 1,
          audioEncoding: 'wav',
        });

        if (!cancelled) {
          setAvatarReady(true);
        }
      } catch (loadError) {
        console.error('Avatar load error:', loadError);
        if (!cancelled) {
          setAvatarError(loadError?.message ? `3D avatar unavailable: ${loadError.message}` : '3D avatar unavailable');
        }
      }
    };

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [currentAvatar]);

  useEffect(() => {
    if (!avatarInstanceRef.current?.head) {
      return;
    }
    avatarInstanceRef.current.head.avatarMood = avatarMood;
  }, [avatarMood]);

  // Initialize chat session with Panvel backend
  const initializeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, running in demo mode');
        return;
      }

      // Fetch user profile
      const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileRes.json();
      const userId = profileData?.user?.id;

      if (userId) {
        // Try HeadTTS modular session endpoint first, then fallback to unified Panvel chats endpoint.
        const attempts = [
          {
            url: `${PANVEL_BASE_URL}/api/session/create`,
            parseChatId: (data) => data.session_id,
            body: JSON.stringify({ user_id: userId }),
          },
          {
            url: `${PANVEL_BASE_URL}/api/chats/new`,
            parseChatId: (data) => data.chat_id,
            body: JSON.stringify({}),
          },
        ];

        for (const attempt of attempts) {
          const chatRes = await fetch(attempt.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: attempt.body,
          });

          if (chatRes.ok) {
            const chatData = await chatRes.json();
            const chatId = attempt.parseChatId(chatData);
            if (chatData.success && chatId) {
              setCurrentChatId(chatId);
              console.log('Chat session created:', chatId);
              break;
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat initialization error:', err);
      // Continue in demo mode
    }
  };

  // Format time string
  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Handle message submission with Panvel API integration
  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isSpeaking) {
      return;
    }

    const userMessage = message.trim();
    setMessage('');
    setError(null);

    // Add user message to UI
    const newUserMessage = {
      type: 'user',
      text: userMessage,
      time: formatTime(),
      role: 'user',
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      // Call Panvel emotion detection API
      const apiUrl = `${PANVEL_BASE_URL}/api/ai/combined-emotion`;
      const requestBody = {
        text: userMessage,
        chat_id: currentChatId,
      };

      console.log('Sending message to Panvel backend:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI Response from Panvel:', data);

      // Update chat ID if this was a new chat
      if (data.chat_id) {
        setCurrentChatId(data.chat_id);
      }

      // Update avatar mood and emotions
      if (data.avatarMood) {
        setAvatarMood(data.avatarMood);
      }
      // Get response message
      let responseMessage = data.response;
      if (typeof responseMessage === 'object' && responseMessage !== null) {
        responseMessage = responseMessage.message || JSON.stringify(responseMessage);
      }

      // Add AI response to UI
      if (responseMessage) {
        const aiMessage = {
          type: 'bot',
          text: responseMessage,
          time: formatTime(),
          role: 'ai',
          emotion: data.avatarMood,
        };
        setMessages(prev => [...prev, aiMessage]);

        speakResponse(responseMessage);
      }
    } catch (err) {
      console.error('Error calling AI API:', err);
      setError(err.message || 'Failed to get response');

      // Fallback response
      const fallbackMessage = {
        type: 'bot',
        text: "I'm having trouble processing that right now. Please try again.",
        time: formatTime(),
        role: 'ai',
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard enter to send message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setTimeout(() => {
      handleSendMessage();
    }, 50);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Check permissions.');
      setIsCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const handleCameraToggle = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Manrope'] flex flex-col">
      <TopNavBar activeTab="forums" />

      <main className="relative flex flex-grow flex-col items-center justify-start overflow-hidden px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-40"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8Bvu7Yf1g5a8V3uvS7pP4mIyURSdN0UYAu3FTtSHwmHQpfdKM72yJKi8k-4iWq2YHZU5trnOcfLhgi4g66WPPw74Re5WsIc8NJLTskztevuJCDIA8nXp1SdiilQ-0rAAZJKCBS5NURPt6gPExBBI-o0_80zrB_riGA3mm1ynt1aTcTmBrVfDXlNDBwcfDFEmXRR7ZbfTb7Z-WdypBqTNC_DjUxcs2KOzczlOPtnSVX_DSU2uQbg8VP-7R7w7u0HTskSy50P4xXE"
            alt="Zen garden background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/80 to-surface"></div>
        </div>

        <div className="relative z-10 flex h-full w-full max-w-6xl flex-col gap-6 pb-8 md:flex-row md:gap-8 md:pb-12">
          {/* Left: Avatar Area */}
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="group relative mb-6 h-52 w-52 sm:h-64 sm:w-64 md:mb-8 md:h-[min(46vh,320px)] md:w-[min(46vh,320px)] lg:h-[min(56vh,420px)] lg:w-[min(56vh,420px)]">
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse bg-primary/5"></div>
              <div className="absolute inset-0 overflow-hidden rounded-full bg-surface/20 shadow-2xl">
                <div ref={avatarContainerRef} className="h-full w-full" />
                {!avatarReady && !avatarError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
                {avatarError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface/70 px-6 text-center text-xs text-on-surface-variant">
                    {avatarError}
                  </div>
                )}
              </div>
              {isCameraOn && (
                <div className="absolute bottom-3 left-3 h-16 w-16 overflow-hidden rounded-full border border-white/30 bg-surface/40 shadow-lg">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="absolute -right-2 top-5 flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface/70 p-2 backdrop-blur-md botanical-shadow md:top-10 md:-right-4 md:gap-3 md:p-3">
                <div className={`w-3 h-3 ${isSpeaking ? 'bg-primary animate-pulse' : 'bg-primary'} rounded-full`}></div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant md:text-xs">
                  {isSpeaking ? 'Speaking' : 'Actively Listening'}
                </span>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface/70 p-1 backdrop-blur-sm">
              {Object.keys(AVATARS).map((avatarKey) => (
                <button
                  key={avatarKey}
                  onClick={() => setCurrentAvatar(avatarKey)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    currentAvatar === avatarKey
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {AVATAR_LABELS[avatarKey]}
                </button>
              ))}
            </div>

          </div>

          {/* Right: Chat Interface - Fully Functional */}
          <div className="flex h-[540px] w-full flex-col rounded-3xl border border-white/20 bg-surface/40 backdrop-blur-2xl botanical-shadow sm:h-[580px] md:w-[380px] lg:h-[600px] lg:w-[450px]">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-4 md:p-6">
              <div>
                <h3 className="font-bold text-on-surface">Digital Sanctuary</h3>
                <p className="text-xs text-on-surface-variant">
                  {isLoading ? 'Processing your message...' : `Guided by Verdant AI • ${currentAvatar.charAt(0).toUpperCase() + currentAvatar.slice(1)}`}
                </p>
              </div>
              <span className="material-symbols-outlined text-primary-dim">settings_input_antenna</span>
            </div>

            {/* Chat Messages Area - Dynamic & Scrollable */}
            <div className="flex-grow space-y-4 overflow-y-auto p-4 md:space-y-6 md:p-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-on-surface-variant text-sm text-center">
                    Begin your conversation with Verdant AI...
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col gap-1 max-w-[85%] ${msg.type === 'user' ? 'self-end' : ''}`}
                    >
                      <div
                        className={`rounded-2xl p-3 text-sm leading-relaxed md:p-4 transition-all ${
                          msg.type === 'user'
                            ? 'bg-primary text-on-primary rounded-tr-none botanical-shadow'
                            : 'bg-surface-container-highest/60 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                      
                      {/* Suggestion Buttons */}
                      {msg.suggestions && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.suggestions.map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-[10px] border border-primary/30 rounded-full px-3 py-1 text-primary hover:bg-primary/10 transition-colors duration-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Message Timestamp */}
                      <span className={`text-[10px] text-on-surface-variant uppercase tracking-tighter ${msg.type === 'user' ? 'mr-2 self-end' : 'ml-2'}`}>
                        {msg.type === 'user' ? 'You' : 'Companion'} • {msg.time}
                      </span>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-2 items-start">
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="rounded-lg bg-red-900/20 border border-red-500/30 p-3 text-xs text-red-200">
                      {error}
                    </div>
                  )}

                  {/* Auto-scroll reference */}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area - Fully Functional */}
            <div className="border-t border-outline-variant/10 bg-surface-container-low/40 p-4 md:p-6">
              <div className="relative flex items-center">
                <input
                  className="w-full rounded-xl border-none border-b-2 border-outline-variant/30 bg-surface-container-low py-3 pl-4 pr-16 text-sm placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-0 md:py-4 disabled:opacity-50"
                  placeholder="Share your thoughts..."
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || isSpeaking}
                />
                <div className="absolute right-2 flex gap-1">
                  <button
                    onClick={handleCameraToggle}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      isCameraOn
                        ? 'bg-primary/20 text-primary'
                        : 'text-primary-dim hover:bg-primary/10'
                    }`}
                    title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
                  >
                    <span className="material-symbols-outlined">videocam</span>
                  </button>
                  <button 
                    className="p-2 text-primary-dim hover:bg-primary/10 rounded-full transition-colors duration-200"
                    title="Microphone (coming soon)"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading || isSpeaking}
                    className="p-2 bg-primary text-on-primary rounded-full hover:scale-105 transition-transform shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    title="Send message"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              {cameraError && (
                <div className="mt-2 text-[11px] text-red-200">
                  {cameraError}
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex justify-between items-center mt-3 px-1">
                <div className="flex gap-4">
                  <span 
                    className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-primary transition-colors duration-200"
                    title="Emoji (coming soon)"
                  >
                    sentiment_satisfied
                  </span>
                  <span 
                    className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-primary transition-colors duration-200"
                    title="Attach file (coming soon)"
                  >
                    attach_file
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                  {currentChatId ? 'Session Active' : 'Demo Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AICompanion;
