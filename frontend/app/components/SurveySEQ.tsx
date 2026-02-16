import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import surveyNietoAnimation from './animations/survey-nieto-animation';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface SurveySEQProps {
  onSubmit: (score: number) => void;
  onCancel: () => void;
  fontScale: number;
  darkMode?: boolean;
}

const scoreLabels = ['Muy difícil', 'Difícil', 'Normal', 'Fácil', 'Muy fácil'];
const scoreEmojis = ['😣', '😕', '😐', '😊', '🤩'];

export const SurveySEQ: React.FC<SurveySEQProps> = ({
  onSubmit,
  onCancel,
  fontScale,
  darkMode = false,
}) => {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (score: number) => {
    setSelectedScore(score);
    setSubmitted(true);
    setTimeout(() => onSubmit(score), 1200);
  };

  return (
    <div className="flex items-start gap-2 mb-4 animate-fadeInUp">
      {/* Nieto avatar */}
      <div className="flex-shrink-0 mt-1" style={{ width: 48, height: 48 }}>
        <div
          className={`rounded-full p-1 ${darkMode ? 'bg-gray-700' : 'bg-orange-100'}`}
          style={{ width: 48, height: 48, overflow: 'hidden' }}
        >
          <Lottie
            animationData={surveyNietoAnimation}
            loop
            autoplay
            style={{ width: 40, height: 40, marginTop: -2 }}
          />
        </div>
      </div>

      {/* Survey card */}
      <div
        className={`rounded-2xl shadow-md overflow-hidden ${
          darkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-orange-100'
        }`}
        style={{
          maxWidth: '340px',
          animation: 'fadeInUp 0.5s ease-out',
        }}
      >
        {/* Header strip */}
        <div
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center gap-2"
        >
          <span style={{ fontSize: `${16 * fontScale}px` }}>📋</span>
          <span
            className="font-bold"
            style={{ fontSize: `${13 * fontScale}px` }}
          >
            ¡Tu opinión nos importa!
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p
            className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}
            style={{ fontSize: `${15 * fontScale}px` }}
          >
            ¿Qué tan fácil fue usar esta ayuda?
          </p>
          <p
            className={`mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            style={{ fontSize: `${12 * fontScale}px` }}
          >
            Califica del 1 al 5, donde 1 es muy difícil y 5 es muy fácil
          </p>

          {!submitted ? (
            <>
              {/* Score buttons */}
              <div className="flex justify-between gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleSelect(score)}
                    onMouseEnter={() => setHoveredScore(score)}
                    onMouseLeave={() => setHoveredScore(null)}
                    className={`flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                      hoveredScore === score
                        ? 'bg-orange-500 text-white shadow-lg scale-110'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                    style={{
                      width: `${52 * fontScale}px`,
                      height: `${58 * fontScale}px`,
                      fontSize: `${20 * fontScale}px`,
                    }}
                  >
                    <span style={{ fontSize: `${22 * fontScale}px`, lineHeight: 1 }}>
                      {scoreEmojis[score - 1]}
                    </span>
                    <span
                      className="font-bold mt-0.5"
                      style={{ fontSize: `${14 * fontScale}px` }}
                    >
                      {score}
                    </span>
                  </button>
                ))}
              </div>

              {/* Hover label */}
              <div
                className="text-center transition-all duration-200"
                style={{
                  height: `${20 * fontScale}px`,
                  fontSize: `${12 * fontScale}px`,
                }}
              >
                {hoveredScore !== null && (
                  <span className={`font-medium ${
                    darkMode ? 'text-orange-300' : 'text-orange-600'
                  }`}>
                    {scoreLabels[hoveredScore - 1]}
                  </span>
                )}
              </div>

              {/* Skip button */}
              <button
                onClick={onCancel}
                className={`w-full mt-1 py-1.5 rounded-lg text-center transition-colors ${
                  darkMode
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                style={{ fontSize: `${11 * fontScale}px` }}
              >
                Ahora no, gracias
              </button>
            </>
          ) : (
            /* Thank you state */
            <div className="text-center py-3" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <span style={{ fontSize: `${32 * fontScale}px` }}>
                {selectedScore !== null ? scoreEmojis[selectedScore - 1] : '🎉'}
              </span>
              <p
                className={`font-bold mt-1 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}
                style={{ fontSize: `${15 * fontScale}px` }}
              >
                ¡Gracias por tu respuesta!
              </p>
              <p
                className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                style={{ fontSize: `${12 * fontScale}px` }}
              >
                Tu opinión nos ayuda a mejorar ✨
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
