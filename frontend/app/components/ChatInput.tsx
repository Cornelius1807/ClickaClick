import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import surveyNietoAnimation from './animations/survey-nieto-animation';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });


interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  fontScale: number;
  darkMode?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  fontScale,
  darkMode = false,
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const preInputRef = useRef('');

  const handleSend = () => {
    if (input.trim() && !isTranscribing) {
      onSendMessage(input);
      setInput('');
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecordingTime(0);
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    console.log('[MIC] Sending audio for transcription, size:', audioBlob.size, 'type:', audioBlob.type);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(`/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.text?.trim() || '';

      console.log('[MIC] Transcription result:', text);

      if (text) {
        setInput(text);
      } else {
        // No text detected — restore previous input
        setInput(preInputRef.current);
      }
    } catch (err: any) {
      console.error('[MIC] Transcription failed:', err);
      setInput(preInputRef.current);
      alert('No se pudo transcribir el audio. Intenta de nuevo.');
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      preInputRef.current = input;
      chunksRef.current = [];

      // Find a supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      console.log('[MIC] Using MIME type:', mimeType || 'default');

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('[MIC] Chunk received, size:', e.data.size);
        }
      };

      recorder.onstop = () => {
        console.log('[MIC] Recording stopped, chunks:', chunksRef.current.length);
        const allChunks = [...chunksRef.current]; // copy before clearing
        chunksRef.current = [];
        mediaRecorderRef.current = null;

        const blob = new Blob(allChunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        console.log('[MIC] Final blob size:', blob.size, 'type:', blob.type);

        if (blob.size > 0) {
          transcribeAudio(blob);
        } else {
          setInput(preInputRef.current);
        }
      };

      recorder.onerror = (e: any) => {
        console.error('[MIC] Recorder error:', e);
        cleanup();
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Timer to show recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('[MIC] Recording started');
    } catch (err: any) {
      console.error('[MIC] getUserMedia failed:', err);
      alert('No se pudo acceder al micrófono. Revisa los permisos de tu navegador.');
    }
  }, [input, cleanup, transcribeAudio]);

  const stopRecording = useCallback((keepAudio: boolean) => {
    console.log('[MIC] stopRecording, keep:', keepAudio);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (keepAudio) {
        // Request final data chunk, then stop triggers onstop → transcribeAudio
        // DO NOT clear chunksRef here — onstop needs them
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      } else {
        // Cancel — don't process the audio
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
        setInput(preInputRef.current);
        chunksRef.current = [];
      }
    }

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    // Only clear recorder ref if cancelling; if keeping, onstop handles it
    if (!keepAudio) {
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording(true); // Listo → keep & transcribe
    } else if (!isTranscribing) {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const showRecordingUI = isRecording || isTranscribing;

  return (
    <div className={`relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      {/* Recording / Transcribing UI */}
      {showRecordingUI && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          {/* Cancel / Done buttons */}
          {isRecording && (
            <div className={`flex items-center justify-between px-4 pt-3 pb-1 ${
              darkMode ? 'bg-gray-750' : 'bg-orange-50'
            }`}>
              <button
                onClick={() => stopRecording(false)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-gray-200'
                }`}
                style={{ fontSize: `${13 * fontScale}px` }}
              >
                ✕ Cancelar
              </button>

              <button
                onClick={() => stopRecording(true)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  darkMode
                    ? 'bg-orange-600 text-white hover:bg-orange-500'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                }`}
                style={{ fontSize: `${13 * fontScale}px` }}
              >
                ✓ Listo
              </button>
            </div>
          )}

          {/* Status area */}
          <div className={`px-4 py-3 ${darkMode ? 'bg-gray-750' : 'bg-orange-50'}`}>
            {isTranscribing ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <span
                  className={`font-medium ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}
                  style={{ fontSize: `${14 * fontScale}px` }}
                >
                  Transcribiendo tu voz...
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping opacity-50" />
                </div>
                <span
                  className={`font-medium ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}
                  style={{ fontSize: `${14 * fontScale}px` }}
                >
                  🎤 Grabando... {formatTime(recordingTime)}
                </span>
              </div>
            )}
          </div>

          {/* Hint */}
          {isRecording && (
            <div className={`px-4 pb-2 ${darkMode ? 'bg-gray-750' : 'bg-orange-50'}`}>
              <p
                className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}
                style={{ fontSize: `${12 * fontScale}px` }}
              >
                Habla ahora y presiona &quot;✓ Listo&quot; cuando termines
              </p>
            </div>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 p-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isLoading && !isTranscribing) {
              handleSend();
            }
          }}
          placeholder={
            isRecording
              ? 'Grabando tu voz...'
              : isTranscribing
              ? 'Transcribiendo...'
              : 'Escribe tu pregunta...'
          }
          disabled={isLoading || isRecording || isTranscribing}
          className={`flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
            darkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-orange-500'
              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-orange-400'
          }`}
          style={{
            fontSize: `${16 * fontScale}px`,
            padding: `${10 * fontScale}px ${16 * fontScale}px`,
          }}
        />

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          disabled={isLoading || isTranscribing}
          className={`relative rounded-xl transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
              : isTranscribing
              ? 'bg-orange-400 text-white cursor-wait'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-orange-300'
              : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
          } disabled:opacity-50`}
          style={{
            fontSize: `${18 * fontScale}px`,
            width: `${48 * fontScale}px`,
            height: `${44 * fontScale}px`,
          }}
          title={
            isRecording
              ? 'Detener grabación'
              : isTranscribing
              ? 'Transcribiendo...'
              : 'Grabar con micrófono'
          }
        >
          {isRecording ? (
            <span className="animate-pulse">⏹</span>
          ) : isTranscribing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          ) : (
            '🎤'
          )}
          {isRecording && (
            <span
              className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
          )}
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || isTranscribing}
          className={`font-bold rounded-xl transition-all duration-200 ${
            input.trim() && !isTranscribing
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
              : darkMode
              ? 'bg-gray-700 text-gray-500'
              : 'bg-gray-200 text-gray-400'
          } disabled:opacity-50`}
          style={{
            fontSize: `${15 * fontScale}px`,
            padding: `${8 * fontScale}px ${20 * fontScale}px`,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
};
