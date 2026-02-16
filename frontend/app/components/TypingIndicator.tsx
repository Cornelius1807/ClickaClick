'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import nietoAnimation from './animations/nieto-animation';

const FRASES_TIERNAS = [
  '"Ya casi, abue... déjame pensar bien para explicarte bonito"',
  '"Un ratito nomás, abuelita... quiero darte la mejor respuesta"',
  '"Espérame un toquecito, abue, que ya te lo explico pasito a pasito"',
  '"Ahorita te respondo, abuelito... con calma que así sale mejor"',
  '"Dame un segundito, abue... estoy buscando la forma más fácil"',
  '"¡Ya merito! Solo quiero asegurarme de que te quede clarito"',
  '"Tranqui, abue... tu nieto virtual está pensando en ti"',
  '"Un momentito... ¡ya casi lo tengo! Va a ser súper fácil"',
  '"Déjame organizarme para que te lo explique bien bonito, abue"',
  '"¡Paciencia, abuelita! Tu nieto favorito ya casi tiene la respuesta"',
  '"Estoy preparando los pasitos para ti, abue... ¡ya mero!"',
  '"Un ratito más, abuelito querido... esto va a ser pan comido"',
];

interface TypingIndicatorProps {
  fontScale: number;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ fontScale }) => {
  const [fraseIndex, setFraseIndex] = useState(() =>
    Math.floor(Math.random() * FRASES_TIERNAS.length)
  );
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setFraseIndex((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * FRASES_TIERNAS.length);
          } while (next === prev);
          return next;
        });
        setFadeState('in');
      }, 400);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-sm">
        {/* Card con animación y mensaje */}
        <div className="bg-gray-200 rounded-2xl rounded-bl-sm shadow-sm overflow-hidden">
          {/* Top: dots */}
          <div className="px-5 pt-3 pb-1 flex items-center gap-2">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>

          {/* Lottie character + phrase */}
          <div className="flex items-center gap-3 px-4 pb-3">
            <div className="flex-shrink-0" style={{ width: 64, height: 64 }}>
              <Lottie
                animationData={nietoAnimation}
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div
              className={`typing-phrase ${fadeState === 'in' ? 'typing-phrase-in' : 'typing-phrase-out'}`}
              style={{
                fontSize: `${11 * fontScale}px`,
                lineHeight: `${15 * fontScale}px`,
              }}
            >
              <span className="text-gray-500 italic">
                {FRASES_TIERNAS[fraseIndex]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
