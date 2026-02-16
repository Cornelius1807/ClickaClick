'use client';

import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    scrollToBottom();
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
          addMessage({
            id: '1',
            text: `¡Hola! Soy el asistente digital de ClickaClick. Estoy aquí para ayudarte con tu ${deviceSelected === 'ios' ? 'iPhone' : 'celular Android'}. ¿Qué necesitas?`,
            sender: 'bot',
            timestamp: Date.now(),
          });

          // Configurar timer para encuesta SEQ a los 300s (5 min)
          seqTimerRef.current = setTimeout(() => {
            if (!isSEQShown) {
              setIsSEQShown(true);
            }
          }, 300000);
        } catch (error) {
          console.error('Error creating session:', error);
          alert('Error al iniciar sesión');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeSession();

    return () => {
      if (seqTimerRef.current) clearTimeout(seqTimerRef.current);
    };
  }, [deviceSelected, session, createSession, setSession, setIsLoading, addMessage, isSEQShown, setIsSEQShown]);

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

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        fontScale={fontScale}
      />

      {/* Support Button */}
      {session && (
        <SupportButton
          sessionId={session.sessionId}
          getRoute={getRoute}
          fontScale={fontScale}
        />
      )}

      {/* SEQ Survey */}
      {isSEQShown && (
        <SurveySEQ
          onSubmit={handleSurveySEQ}
          onCancel={() => setIsSEQShown(false)}
          fontScale={fontScale}
        />
      )}
    </div>
  );
}
