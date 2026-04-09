import React, { useState } from 'react';
import TopNavBar from './TopNavBar';
import Footer from './Footer';

const AICompanion = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Welcome back to your sanctuary. I've been reflecting on our session yesterday. How is your heart feeling in this moment?",
      time: '10:24 AM',
    },
    {
      type: 'user',
      text: "I feel a bit overwhelmed by the noise today. I just need some space to breathe and find my center.",
      time: '10:25 AM',
    },
    {
      type: 'bot',
      text: "That is perfectly valid. The world can be loud. Let's focus on a rhythmic grounding exercise together. Shall we start with the forest breath?",
      time: '10:26 AM',
      suggestions: ['Yes, let\'s start', 'Maybe later'],
    },
  ]);

  const emotionalResonance = [
    { name: 'Calm', value: 85 },
    { name: 'Joy', value: 40 },
    { name: 'Reflection', value: 65 },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Manrope'] flex flex-col">
      <TopNavBar activeTab="forums" />

      <main className="relative flex flex-grow flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 sm:px-6 md:px-8 lg:px-10">
        {/* Immersive Background */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP8Bvu7Yf1g5a8V3uvS7pP4mIyURSdN0UYAu3FTtSHwmHQpfdKM72yJKi8k-4iWq2YHZU5trnOcfLhgi4g66WPPw74Re5WsIc8NJLTskztevuJCDIA8nXp1SdiilQ-0rAAZJKCBS5NURPt6gPExBBI-o0_80zrB_riGA3mm1ynt1aTcTmBrVfDXlNDBwcfDFEmXRR7ZbfTb7Z-WdypBqTNC_DjUxcs2KOzczlOPtnSVX_DSU2uQbg8VP-7R7w7u0HTskSy50P4xXE"
            alt="Zen garden background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-surface/20 via-surface/80 to-surface"></div>
        </div>

        <div className="relative z-10 flex h-full w-full max-w-6xl flex-col gap-6 pb-8 md:flex-row md:gap-8 md:pb-12">
          {/* Left: Avatar Area */}
          <div className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="group relative mb-6 h-64 w-64 sm:h-72 sm:w-72 md:mb-8 md:h-[420px] md:w-[420px] lg:h-[500px] lg:w-[500px]">
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-pulse bg-primary/5"></div>
              <img
                className="w-full h-full object-contain drop-shadow-2xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9cYWwD2dS5aUg7BQkfDf4xWSyaMLQF8HNx1cMnHecAhxPk03pHjCnaFWzpBs8n2nBtcFGtZr6DuZeJ5XMNiTnTJyhLxkql6eCBAV2GNl8delKhgaLoz1YdcKSODMZRJ6_DqAFtMrhVGAh2GS8mbSUMst9MvHKHj00ZFDD42f8AobmSaYvDOfRlPx6w9S98oRTDRBUQttdyA1jQ9AyXBmulTdXXty-kBULbJmOMDoVPTH_tCSIfky-VaoD0dYCndY7TTV6YFbuLQo"
                alt="AI Avatar"
              />
              <div className="absolute -right-2 top-5 flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface/70 p-2 backdrop-blur-md botanical-shadow md:top-10 md:-right-4 md:gap-3 md:p-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant md:text-xs">Actively Listening</span>
              </div>
            </div>

            {/* Emotional Resonance Meter */}
            <div className="w-full max-w-md rounded-2xl bg-surface-container-low/60 p-4 backdrop-blur-lg botanical-shadow md:p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">Emotional Resonance</span>
                <span className="text-xs text-on-surface-variant font-medium">92% Alignment</span>
              </div>
              <div className="flex items-end gap-2 h-16 mb-2">
                {emotionalResonance.map((emotion) => (
                  <div key={emotion.name} className="flex-1 bg-primary/20 rounded-t-lg relative group h-full">
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500"
                      style={{ height: `${emotion.value}%` }}
                    ></div>
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-on-surface text-surface px-2 py-0.5 rounded">
                      {emotion.name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant italic">
                The guide detects a deep sense of tranquil presence.
              </p>
            </div>
          </div>

          {/* Right: Chat Interface */}
          <div className="flex h-[540px] w-full flex-col rounded-3xl border border-white/20 bg-surface/40 backdrop-blur-2xl botanical-shadow sm:h-[580px] md:w-[380px] lg:h-[600px] lg:w-[450px]">
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-4 md:p-6">
              <div>
                <h3 className="font-bold text-on-surface">Digital Sanctuary</h3>
                <p className="text-xs text-on-surface-variant">Guided by Verdant AI</p>
              </div>
              <span className="material-symbols-outlined text-primary-dim">settings_input_antenna</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow space-y-4 overflow-y-auto p-4 md:space-y-6 md:p-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.type === 'user' ? 'self-end' : ''}`}
                >
                  <div
                    className={`rounded-2xl p-3 text-sm leading-relaxed md:p-4 ${
                      msg.type === 'user'
                        ? 'bg-primary text-on-primary rounded-tr-none botanical-shadow'
                        : 'bg-surface-container-highest/60 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          className="text-[10px] border border-primary/30 rounded-full px-3 py-1 text-primary hover:bg-primary/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className={`text-[10px] text-on-surface-variant uppercase tracking-tighter ${msg.type === 'user' ? 'mr-2 self-end' : 'ml-2'}`}>
                    {msg.type === 'user' ? 'You' : 'Companion'} • {msg.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-outline-variant/10 bg-surface-container-low/40 p-4 md:p-6">
              <div className="relative flex items-center">
                <input
                  className="w-full rounded-xl border-none border-b-2 border-outline-variant/30 bg-surface-container-low py-3 pl-4 pr-16 text-sm placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-0 md:py-4"
                  placeholder="Share your thoughts..."
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="absolute right-2 flex gap-1">
                  <button className="p-2 text-primary-dim hover:bg-primary/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button className="p-2 bg-primary text-on-primary rounded-full hover:scale-105 transition-transform shadow-sm">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 px-1">
                <div className="flex gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-primary transition-colors">
                    sentiment_satisfied
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-primary transition-colors">
                    attach_file
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">End Session</span>
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
