'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
import chatMascotAnimation from './animations/chat-mascot-animation';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
  device: 'ios' | 'android';
  fontScale: number;
  darkMode: boolean;
}

const QUESTIONS_POOL = [
  // General
  "¿Cómo conecto mi celular al WiFi?",
  "¿Cómo aumento el tamaño de la letra?",
  "¿Cómo hago una llamada?",
  "¿Cómo envío un mensaje de WhatsApp?",
  "¿Cómo saco una foto con la cámara?",
  "¿Cómo bajo una aplicación?",
  "¿Cómo pongo una alarma?",
  "¿Cómo veo mis fotos guardadas?",
  "¿Cómo subo el volumen del celular?",
  "¿Cómo apago y prendo el celular?",
  // Más avanzado
  "¿Cómo hago una videollamada?",
  "¿Cómo envío una foto por WhatsApp?",
  "¿Cómo guardo un contacto nuevo?",
  "¿Cómo cambio el fondo de pantalla?",
  "¿Cómo activo el modo oscuro?",
  "¿Cómo uso el GPS o Google Maps?",
  "¿Cómo pongo el celular en silencio?",
  "¿Cómo borro una aplicación?",
  "¿Cómo conecto el Bluetooth?",
  "¿Cómo leo un correo electrónico?",
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  onSelectQuestion,
  device,
  fontScale,
  darkMode,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Pick 5 random questions on mount
  const questions = useMemo(() => shuffleArray(QUESTIONS_POOL).slice(0, 5), []);

  useEffect(() => {
    // Animate in after a short delay
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = (question: string, index: number) => {
    setSelectedIndex(index);
    // Small delay for visual feedback before sending
    setTimeout(() => {
      onSelectQuestion(question);
    }, 200);
  };

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex flex-col items-center mb-4">
        {/* Lottie mascot */}
        <div className="w-32 h-28 mb-2">
          <Lottie
            animationData={chatMascotAnimation}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Suggestions label */}
        <p
          className={`text-center mb-3 font-medium ${
            darkMode ? 'text-orange-300' : 'text-orange-700'
          }`}
          style={{ fontSize: `${13 * fontScale}px` }}
        >
          ¿En qué te puedo ayudar? Elige una pregunta:
        </p>

        {/* Question cards */}
        <div className="w-full space-y-2">
          {questions.map((question, index) => (
            <button
              key={index}
              onClick={() => handleClick(question, index)}
              disabled={selectedIndex !== null}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-300 transform
                ${selectedIndex === index
                  ? darkMode
                    ? 'bg-orange-600 border-orange-500 text-white scale-[0.97]'
                    : 'bg-orange-500 border-orange-400 text-white scale-[0.97]'
                  : selectedIndex !== null
                    ? 'opacity-40 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gray-800 border-gray-700 text-gray-200 hover:border-orange-500 hover:bg-gray-750 active:scale-[0.97]'
                      : 'bg-white border-orange-200 text-gray-800 hover:border-orange-400 hover:bg-orange-50 shadow-sm active:scale-[0.97]'
                }
              `}
              style={{ fontSize: `${14 * fontScale}px` }}
            >
              <span className="mr-2">💬</span>
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
