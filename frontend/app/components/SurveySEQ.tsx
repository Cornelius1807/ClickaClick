import React from 'react';

interface SurveySEQProps {
  onSubmit: (score: number) => void;
  onCancel: () => void;
  fontScale: number;
}

export const SurveySEQ: React.FC<SurveySEQProps> = ({
  onSubmit,
  onCancel,
  fontScale,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2
          className="text-2xl font-bold text-gray-900 mb-4 text-center"
          style={{ fontSize: `${28 * fontScale}px` }}
        >
          ¿Cómo te pareció?
        </h2>
        <p
          className="text-gray-600 mb-6 text-center"
          style={{ fontSize: `${16 * fontScale}px` }}
        >
          Por favor, cuéntanos qué tan fácil fue usar esta asistencia
        </p>

        <div className="flex justify-between gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => onSubmit(score)}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 hover:bg-blue-500 hover:text-white transition-all text-2xl font-bold"
              style={{
                width: `${56 * fontScale}px`,
                height: `${56 * fontScale}px`,
                fontSize: `${28 * fontScale}px`,
              }}
            >
              {score}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold rounded-lg"
          style={{
            fontSize: `${16 * fontScale}px`,
            padding: `${12 * fontScale}px ${16 * fontScale}px`,
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
