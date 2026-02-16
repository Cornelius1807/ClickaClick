import React, { useState, useEffect } from 'react';
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

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await getRoute(sessionId);
      setStatus(result);

      if (result.waLink) {
        window.open(result.waLink, '_blank');
      }
    } catch (error) {
      console.error('Error fetching support route:', error);
      alert('Error al conectar con soporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-4 rounded-full shadow-lg text-center"
        style={{
          fontSize: `${14 * fontScale}px`,
          width: `${80 * fontScale}px`,
          height: `${80 * fontScale}px`,
        }}
        title="Requiero más asistencia"
      >
        💬
        <br />
        <span className="text-xs">Ayuda</span>
      </button>

      {status && (
        <div className="absolute bottom-20 right-0 bg-white p-3 rounded-lg shadow-lg max-w-xs whitespace-nowrap">
          <p
            className="text-gray-900 font-semibold"
            style={{ fontSize: `${12 * fontScale}px` }}
          >
            {status.message}
          </p>
          {status.name && (
            <p
              className="text-sm text-gray-600 mt-1"
              style={{ fontSize: `${11 * fontScale}px` }}
            >
              Con: {status.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
