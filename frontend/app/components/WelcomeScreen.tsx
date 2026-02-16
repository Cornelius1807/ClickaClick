import React from 'react';

interface WelcomeScreenProps {
  onSelectDevice: (device: 'android' | 'ios') => void;
  fontScale: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectDevice,
  fontScale,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1
          className="text-4xl font-bold text-gray-900 mb-4"
          style={{ fontSize: `${40 * fontScale}px` }}
        >
          ClickaClick
        </h1>

        <p
          className="text-xl text-gray-600 mb-8"
          style={{ fontSize: `${20 * fontScale}px` }}
        >
          Bienvenido a nuestro asistente de ayuda digital. Primero, cuéntanos qué dispositivo usas.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => onSelectDevice('ios')}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-bold py-6 px-4 rounded-xl transition-all shadow-lg text-lg"
            style={{
              fontSize: `${20 * fontScale}px`,
              padding: `${24 * fontScale}px ${16 * fontScale}px`,
            }}
          >
            📱 Tengo iPhone (Manzanita)
          </button>

          <button
            onClick={() => onSelectDevice('android')}
            className="w-full bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-bold py-6 px-4 rounded-xl transition-all shadow-lg text-lg"
            style={{
              fontSize: `${20 * fontScale}px`,
              padding: `${24 * fontScale}px ${16 * fontScale}px`,
            }}
          >
            🤖 Tengo Android
          </button>
        </div>

        <p
          className="text-sm text-gray-500 mt-8"
          style={{ fontSize: `${14 * fontScale}px` }}
        >
          Debes seleccionar tu dispositivo para continuar
        </p>
      </div>
    </div>
  );
};
