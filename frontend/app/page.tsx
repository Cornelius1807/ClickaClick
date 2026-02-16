'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import walkingNietoAnimation from './components/animations/walking-nieto-animation';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import { useSession, useChat, useSurvey, useSupport } from '@/hooks/useApi';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { SurveySEQ } from './components/SurveySEQ';
import { SupportButton } from './components/SupportButton';
import { TypingIndicator } from './components/TypingIndicator';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import type { ChatMessage, DeviceType } from '@/types';

export default function Home() {
  const {
    session,
    setSession,
    deviceSelected,
    setDeviceSelected,
    messages,
    addMessage,
    isLoading,
    setIsLoading,
    isSEQShown,
    setIsSEQShown,
    darkMode,
    setDarkMode,
    fontScale,
    setFontScale,
    ttsEnabled,
    setTtsEnabled,
    scrolledPastWelcome,
    setScrolledPastWelcome,
  } = useAppStore();

  const { createSession } = useSession();
  const { sendMessage } = useChat();
  const { submitSurveySEQ } = useSurvey();
  const { getRoute } = useSupport();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seqTimerRef = useRef<NodeJS.Timeout>();
  const sessionStartTimeRef = useRef<number>(0);
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [iconAnimating, setIconAnimating] = useState(false);
  const ttsEnabledRef = useRef(ttsEnabled);

  // Keep ref in sync
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // TTS: speak bot messages
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown/formatting from text
    const cleanText = text
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.pitch = 1.4; // Higher pitch for child-like voice

    // Try to find a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang.startsWith('es'))
      || voices[0];
    if (spanishVoice) utterance.voice = spanishVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  // Animated dark mode toggle with ripple + sparkles
  const handleThemeToggle = () => {
    if (isThemeTransitioning) return;
    const goingDark = !darkMode;
    setIsThemeTransitioning(true);
    setIconAnimating(true);

    // Get button position for ripple origin
    const btn = themeToggleRef.current;
    const rect = btn?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : 40;

    // Create ripple overlay
    const overlay = document.createElement('div');
    overlay.className = `theme-transition-overlay ${goingDark ? 'to-dark' : 'to-light'}`;
    const maxDim = Math.max(window.innerWidth, window.innerHeight);
    const size = maxDim * 2.5;
    overlay.style.width = `${size}px`;
    overlay.style.height = `${size}px`;
    overlay.style.left = `${cx - size / 2}px`;
    overlay.style.top = `${cy - size / 2}px`;
    document.body.appendChild(overlay);

    // Spawn sparkle particles
    for (let i = 0; i < 10; i++) {
      const spark = document.createElement('div');
      spark.className = `theme-sparkle ${goingDark ? 'to-dark' : 'to-light'}`;
      const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 60;
      spark.style.left = `${cx - 3}px`;
      spark.style.top = `${cy - 3}px`;
      spark.style.setProperty('--spark-x', `${Math.cos(angle) * dist}px`);
      spark.style.setProperty('--spark-y', `${Math.sin(angle) * dist}px`);
      spark.style.animationDelay = `${Math.random() * 0.15}s`;
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 1000);
    }

    // Trigger expansion
    requestAnimationFrame(() => overlay.classList.add('expanding'));

    // Switch theme midway through the animation
    setTimeout(() => {
      setDarkMode(goingDark);
    }, 200);

    // Cleanup
    setTimeout(() => {
      overlay.remove();
      setIsThemeTransitioning(false);
      setIconAnimating(false);
    }, 700);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll when messages change, loading state changes, or survey appears
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSEQShown]);

  // Keep scrolling to bottom as long bot message content renders (typewriter effect)
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'bot') {
      const interval = setInterval(() => {
        scrollToBottom();
      }, 300);
      // Stop after 10s max (long messages)
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [messages]);

  // Inicializar sesión cuando se selecciona dispositivo
  useEffect(() => {
    const initializeSession = async () => {
      if (deviceSelected && !session) {
        try {
          setIsLoading(true);
          const newSession = await createSession(deviceSelected);
          setSession(newSession);
          sessionStartTimeRef.current = Date.now();

          // Agregar mensaje de bienvenida
          const welcomeText = `¡Hola! Soy el asistente digital de ClickaClick. Estoy aquí para ayudarte con tu ${deviceSelected === 'ios' ? 'iPhone' : 'celular Android'}. ¿Qué necesitas?`;
          addMessage({
            id: '1',
            text: welcomeText,
            sender: 'bot',
            timestamp: Date.now(),
          });

          // Speak welcome message
          if (ttsEnabledRef.current) {
            setTimeout(() => speakText(welcomeText), 500);
          }
        } catch (error) {
          console.error('Error creating session:', error);
          alert('Error al iniciar sesión');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();
  }, [deviceSelected, session, createSession, setSession, setIsLoading, addMessage]);

  // Timer separado para encuesta SEQ (5 minutos después de crear sesión)
  useEffect(() => {
    if (session && !isSEQShown) {
      seqTimerRef.current = setTimeout(() => {
        setIsSEQShown(true);
      }, 300000); // 5 minutos

      return () => {
        if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
      };
    }
  }, [session, isSEQShown, setIsSEQShown]);

  const handleSelectDevice = (device: DeviceType) => {
    setDeviceSelected(device);
    setScrolledPastWelcome(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!session || !deviceSelected) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // Enviar al bot
    try {
      setIsLoading(true);
      const response = await sendMessage(session.sessionId, deviceSelected, text);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.answerText,
        sender: 'bot',
        timestamp: Date.now(),
        videoId: response.videoId,
        steps: response.steps,
        intentName: response.intentName,
      };
      addMessage(botMessage);

      // Speak bot response if TTS is enabled
      if (ttsEnabledRef.current) {
        speakText(response.answerText);
      }

      // Si hay typing delay simulado
      if (response.latencyMs > 5000) {
        console.log(`Response took ${response.latencyMs}ms`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        id: (Date.now() + 1).toString(),
        text: 'Lo sentimos, hubo un error. Por favor intenta de nuevo.',
        sender: 'bot',
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurveySEQ = async (score: number) => {
    if (!session) return;

    try {
      await submitSurveySEQ(session.sessionId, score);
      setIsSEQShown(false);
    } catch (error) {
      console.error('Error submitting survey:', error);
    }
  };

  // Si no hay dispositivo seleccionado, mostrar pantalla de bienvenida
  if (!scrolledPastWelcome || !deviceSelected) {
    return <WelcomeScreen onSelectDevice={handleSelectDevice} fontScale={fontScale} />;
  }

  return (
    <div
      className={`flex flex-col h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'} ${isThemeTransitioning ? 'theme-smooth-transition' : ''}`}
      style={{ fontSize: `${16 * fontScale}px` }}
    >
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white p-4 shadow-lg relative overflow-hidden`}>
        {/* Walking nieto strolling across the header */}
        <div className="walking-nieto-wrapper">
          <div className="walking-nieto">
            <Lottie animationData={walkingNietoAnimation} loop autoplay style={{ width: '100%', height: '100%' }} />
          </div>
        </div>
        <div className="flex justify-between items-center max-w-4xl mx-auto px-4">
          <Image
            src="/images/logo.png"
            alt="ClickaClick"
            width={320}
            height={90}
            className="object-contain brightness-0 invert"
            style={{ width: 'auto', height: '72px' }}
            priority
          />

          <div className="flex gap-3">
            {/* Controles de accesibilidad */}
            <button
              onClick={() => setFontScale(Math.max(0.8, fontScale - 0.1))}
              className={`font-zoom-btn group relative px-2 py-1 rounded font-bold ${
                darkMode
                  ? 'bg-gray-700 text-orange-300 hover:bg-gray-600'
                  : 'bg-white text-orange-600 hover:bg-orange-50'
              }`}
              title="Reducir letra"
            >
              <span className="font-zoom-icon">🔍</span>
              <span className="font-zoom-label">A−</span>
            </button>

            <button
              onClick={() => setFontScale(Math.min(2, fontScale + 0.1))}
              className={`font-zoom-btn group relative px-2 py-1 rounded font-bold ${
                darkMode
                  ? 'bg-gray-700 text-orange-300 hover:bg-gray-600'
                  : 'bg-white text-orange-600 hover:bg-orange-50'
              }`}
              title="Aumentar letra"
            >
              <span className="font-zoom-icon">🔍</span>
              <span className="font-zoom-label">A+</span>
            </button>

            {/* TTS toggle */}
            <button
              onClick={() => {
                const next = !ttsEnabled;
                setTtsEnabled(next);
                if (!next && typeof window !== 'undefined') {
                  window.speechSynthesis?.cancel();
                }
              }}
              className={`px-2 py-1 rounded font-bold transition-all duration-200 ${
                ttsEnabled
                  ? darkMode
                    ? 'bg-orange-600 text-white hover:bg-orange-500'
                    : 'bg-white text-orange-600 hover:bg-orange-50 ring-2 ring-orange-300'
                  : darkMode
                  ? 'bg-gray-700 text-gray-500 hover:bg-gray-600'
                  : 'bg-white text-gray-400 hover:bg-gray-50'
              }`}
              title={ttsEnabled ? 'Desactivar voz del bot' : 'Activar voz del bot'}
            >
              {ttsEnabled ? '🔊' : '🔇'}
            </button>

            <button
              ref={themeToggleRef}
              onClick={handleThemeToggle}
              className={`px-2 py-1 rounded font-bold transition-colors overflow-hidden ${
                darkMode
                  ? 'bg-gray-700 text-orange-300 hover:bg-gray-600'
                  : 'bg-white text-orange-600 hover:bg-orange-50'
              }`}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              disabled={isThemeTransitioning}
            >
              <span className={`theme-icon ${iconAnimating ? 'theme-icon-enter' : ''}`}>
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${
          darkMode ? 'bg-gray-900 text-white' : 'bg-[#fff8f3]'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ChatBubble
                message={message}
                fontScale={fontScale}
                darkMode={darkMode}
              />
              {/* Show suggested questions after the first bot welcome message */}
              {index === 0 && message.sender === 'bot' && messages.length === 1 && !isLoading && deviceSelected && (
                <SuggestedQuestions
                  onSelectQuestion={handleSendMessage}
                  device={deviceSelected}
                  fontScale={fontScale}
                  darkMode={darkMode}
                />
              )}
            </React.Fragment>
          ))}

          {isLoading && (
            <TypingIndicator fontScale={fontScale} />
          )}

          {/* SEQ Survey - inline in chat */}
          {isSEQShown && (
            <SurveySEQ
              onSubmit={handleSurveySEQ}
              onCancel={() => setIsSEQShown(false)}
              fontScale={fontScale}
              darkMode={darkMode}
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        fontScale={fontScale}
        darkMode={darkMode}
      />

      {/* Support Button */}
      {session && (
        <SupportButton
          sessionId={session.sessionId}
          getRoute={getRoute}
          fontScale={fontScale}
        />
      )}

    </div>
  );
}
