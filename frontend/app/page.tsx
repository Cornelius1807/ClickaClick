'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useSession, useChat, useSurvey, useSupport } from '@/hooks/useApi';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { SurveySEQ } from './components/SurveySEQ';
import { SupportButton } from './components/SupportButton';
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
      className={`flex flex-col h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}
      style={{ fontSize: `${16 * fontScale}px` }}
    >
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-blue-600'} text-white p-4 shadow-lg`}>
        <div className="flex justify-between items-center max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">ClickaClick</h1>

          <div className="flex gap-4">
            {/* Controles de accesibilidad */}
            <button
              onClick={() => setFontScale(Math.max(0.8, fontScale - 0.1))}
              className="px-2 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
              title="Reducir letra"
            >
              A−
            </button>

            <button
              onClick={() => setFontScale(Math.min(2, fontScale + 0.1))}
              className="px-2 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
              title="Aumentar letra"
            >
              A+
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-2 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 ${
          darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              fontScale={fontScale}
            />
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-300 px-4 py-3 rounded-lg">
                <p className="text-gray-900">Escribiendo...</p>
              </div>
            </div>
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
