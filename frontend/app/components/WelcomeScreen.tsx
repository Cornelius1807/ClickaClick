'use client';

import React, { useState } from 'react';
import Lottie from 'lottie-react';
import iphoneAnimation from './animations/iphone-animation';
import androidAnimation from './animations/android-animation';

interface WelcomeScreenProps {
  onSelectDevice: (device: 'android' | 'ios') => void;
  fontScale: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectDevice,
  fontScale,
}) => {
  const [hoveredCard, setHoveredCard] = useState<'ios' | 'android' | null>(null);
  const [selectedCard, setSelectedCard] = useState<'ios' | 'android' | null>(null);

  const handleSelect = (device: 'ios' | 'android') => {
    setSelectedCard(device);
    // Small delay for the selection animation before navigating
    setTimeout(() => {
      onSelectDevice(device);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #ff9a56 0%, #ff6f3c 25%, #ff4f3c 50%, #ff6f3c 75%, #ff9a56 100%)',
      }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" 
          style={{ animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute top-1/4 right-10 w-32 h-32 bg-white/8 rounded-full"
          style={{ animation: 'pulse 3s ease-in-out infinite 1s' }} />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="font-extrabold text-white mb-3 drop-shadow-lg"
            style={{ 
              fontSize: `${44 * fontScale}px`,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}
          >
            ClickaClick
          </h1>
          <p
            className="text-white/90 font-medium leading-relaxed"
            style={{ fontSize: `${18 * fontScale}px` }}
          >
            ¡Hola! 👋 Soy tu asistente digital.
            <br />
            ¿Qué celular tienes?
          </p>
        </div>

        {/* Device Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* iPhone Card */}
          <button
            onClick={() => handleSelect('ios')}
            onMouseEnter={() => setHoveredCard('ios')}
            onMouseLeave={() => setHoveredCard(null)}
            disabled={selectedCard !== null}
            className={`
              relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 
              transition-all duration-300 ease-out
              shadow-xl hover:shadow-2xl
              flex flex-col items-center gap-3
              border-3 
              ${selectedCard === 'ios' 
                ? 'border-gray-800 scale-105 ring-4 ring-gray-400/50' 
                : selectedCard === 'android'
                  ? 'opacity-40 scale-95 border-transparent'
                  : hoveredCard === 'ios'
                    ? 'border-gray-600 scale-105 -translate-y-1'
                    : 'border-transparent hover:border-gray-400'
              }
            `}
            style={{ borderWidth: '3px' }}
          >
            {/* Lottie Animation */}
            <div className={`w-24 h-28 transition-transform duration-300 ${hoveredCard === 'ios' ? 'scale-110' : ''}`}>
              <Lottie
                animationData={iphoneAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Label */}
            <div className="text-center">
              <p className="font-bold text-gray-800" style={{ fontSize: `${16 * fontScale}px` }}>
                iPhone
              </p>
              <p className="text-gray-500 mt-1" style={{ fontSize: `${12 * fontScale}px` }}>
                (Manzanita 🍎)
              </p>
            </div>

            {/* Selection checkmark */}
            {selectedCard === 'ios' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center shadow-lg"
                style={{ animation: 'scaleIn 0.3s ease-out' }}>
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>

          {/* Android Card */}
          <button
            onClick={() => handleSelect('android')}
            onMouseEnter={() => setHoveredCard('android')}
            onMouseLeave={() => setHoveredCard(null)}
            disabled={selectedCard !== null}
            className={`
              relative bg-white/95 backdrop-blur-sm rounded-3xl p-5 
              transition-all duration-300 ease-out
              shadow-xl hover:shadow-2xl
              flex flex-col items-center gap-3
              border-3
              ${selectedCard === 'android' 
                ? 'border-green-600 scale-105 ring-4 ring-green-400/50' 
                : selectedCard === 'ios'
                  ? 'opacity-40 scale-95 border-transparent'
                  : hoveredCard === 'android'
                    ? 'border-green-500 scale-105 -translate-y-1'
                    : 'border-transparent hover:border-green-400'
              }
            `}
            style={{ borderWidth: '3px' }}
          >
            {/* Lottie Animation */}
            <div className={`w-24 h-28 transition-transform duration-300 ${hoveredCard === 'android' ? 'scale-110' : ''}`}>
              <Lottie
                animationData={androidAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Label */}
            <div className="text-center">
              <p className="font-bold text-gray-800" style={{ fontSize: `${16 * fontScale}px` }}>
                Android
              </p>
              <p className="text-gray-500 mt-1" style={{ fontSize: `${12 * fontScale}px` }}>
                (Robotito 🤖)
              </p>
            </div>

            {/* Selection checkmark */}
            {selectedCard === 'android' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg"
                style={{ animation: 'scaleIn 0.3s ease-out' }}>
                <span className="text-white text-sm">✓</span>
              </div>
            )}
          </button>
        </div>

        {/* Footer hint */}
        <p
          className="text-center text-white/70 font-medium"
          style={{ fontSize: `${13 * fontScale}px` }}
        >
          Toca tu celular para empezar ☝️
        </p>
      </div>

      {/* Inline CSS for scaleIn animation */}
      <style jsx>{`
        @keyframes scaleIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
