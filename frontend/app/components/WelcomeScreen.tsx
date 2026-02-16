'use client';

import React, { useState } from 'react';
import Lottie from 'lottie-react';
import Image from 'next/image';
import iphoneAnimation from './animations/iphone-animation';
import androidAnimation from './animations/android-animation';
import heroWelcomeAnimation from './animations/hero-welcome-animation';

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
    setTimeout(() => {
      onSelectDevice(device);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #fff8f3 0%, #fff0e6 30%, #ffe8d6 60%, #ffdfc4 100%)',
      }}
    >
      {/* Subtle animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #ff9a56 0%, transparent 70%)', animation: 'pulse 5s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #ff6f3c 0%, transparent 70%)', animation: 'pulse 6s ease-in-out infinite 2s' }} />
        <div className="absolute top-1/3 right-5 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffa94d 0%, transparent 70%)', animation: 'pulse 4s ease-in-out infinite 1s' }} />
      </div>

      <div className="relative z-10 max-w-lg w-full">
        {/* Hero Lottie Animation */}
        <div className="flex justify-center mb-2">
          <div className="w-48 h-48 sm:w-56 sm:h-56">
            <Lottie
              animationData={heroWelcomeAnimation}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        {/* Logo Image */}
        <div className="flex justify-center mb-3">
          <Image
            src="/images/logo.png"
            alt="ClickaClick"
            width={220}
            height={70}
            className="object-contain drop-shadow-md"
            priority
          />
        </div>

        {/* Subtitle */}
        <div className="text-center mb-8">
          <p
            className="text-gray-600 font-medium leading-relaxed"
            style={{ fontSize: `${17 * fontScale}px` }}
          >
            ¡Hola! 👋 Soy tu asistente digital.
            <br />
            <span className="text-orange-500 font-semibold">¿Qué celular tienes?</span>
          </p>
        </div>

        {/* Device Cards */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          {/* iPhone Card */}
          <button
            onClick={() => handleSelect('ios')}
            onMouseEnter={() => setHoveredCard('ios')}
            onMouseLeave={() => setHoveredCard(null)}
            disabled={selectedCard !== null}
            className={`
              relative bg-white rounded-3xl p-5 
              transition-all duration-300 ease-out
              flex flex-col items-center gap-3
              ${selectedCard === 'ios' 
                ? 'border-gray-800 scale-105 ring-4 ring-gray-300/60 shadow-2xl' 
                : selectedCard === 'android'
                  ? 'opacity-30 scale-95 border-gray-200 shadow-md'
                  : hoveredCard === 'ios'
                    ? 'border-gray-500 scale-105 -translate-y-2 shadow-2xl'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
              }
            `}
            style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: selectedCard === 'ios' ? '#1f2937' : hoveredCard === 'ios' ? '#6b7280' : '#e5e7eb' }}
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
              relative bg-white rounded-3xl p-5 
              transition-all duration-300 ease-out
              flex flex-col items-center gap-3
              ${selectedCard === 'android' 
                ? 'border-green-600 scale-105 ring-4 ring-green-300/60 shadow-2xl' 
                : selectedCard === 'ios'
                  ? 'opacity-30 scale-95 border-gray-200 shadow-md'
                  : hoveredCard === 'android'
                    ? 'border-green-500 scale-105 -translate-y-2 shadow-2xl'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
              }
            `}
            style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: selectedCard === 'android' ? '#16a34a' : hoveredCard === 'android' ? '#22c55e' : '#e5e7eb' }}
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
          className="text-center text-gray-400 font-medium"
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
