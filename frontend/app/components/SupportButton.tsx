import React, { useState } from 'react';
import type { SupportStatus } from '@/types';

interface SupportButtonProps {
  sessionId: string;
  getRoute: (sessionId: string) => Promise<SupportStatus>;
  fontScale: number;
}

export const SupportButton: React.FC<SupportButtonProps> = ({
  sessionId,
  getRoute,
  fontScale,
}) => {
  const [status, setStatus] = useState<SupportStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setShowPopup(false);
    try {
      const result = await getRoute(sessionId);
      setStatus(result);

      if (result.waLink) {
        // Abrir WhatsApp directamente
        window.open(result.waLink, '_blank');
        // Mostrar brevemente quién los atiende
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      } else {
        // No hay enlace: mostrar mensaje de por qué
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    } catch (error) {
      console.error('Error fetching support route:', error);
      setStatus({ isOpen: false, message: 'Error al conectar con soporte. Intenta de nuevo.' });
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-52 right-4 z-40">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-4 px-4 rounded-full shadow-lg text-center transition-colors`}
        style={{
          fontSize: `${14 * fontScale}px`,
          width: `${80 * fontScale}px`,
          height: `${80 * fontScale}px`,
        }}
        title="Requiero más asistencia"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
        ) : (
          <>
            💬
            <br />
            <span className="text-xs">Ayuda</span>
          </>
        )}
      </button>

      {showPopup && status && (
        <div
          className={`absolute bottom-20 right-0 p-3 rounded-xl shadow-xl max-w-[220px] border ${
            status.isOpen
              ? 'bg-green-50 border-green-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <p
            className={`font-semibold leading-snug ${
              status.isOpen ? 'text-green-800' : 'text-orange-800'
            }`}
            style={{ fontSize: `${12 * fontScale}px` }}
          >
            {status.message}
          </p>
          {status.name && (
            <p
              className="text-green-600 mt-1"
              style={{ fontSize: `${11 * fontScale}px` }}
            >
              👤 {status.name}
            </p>
          )}
          <button
            onClick={() => setShowPopup(false)}
            className="absolute -top-2 -left-2 w-5 h-5 bg-gray-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
