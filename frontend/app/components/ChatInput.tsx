import React, { useEffect, useRef, useState } from 'react';
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
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number[]>([]);
  const [showMicWarning, setShowMicWarning] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const isActiveRef = useRef(false);
  const preRecordingInputRef = useRef('');
  const accumulatedTranscriptRef = useRef('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const cleanupResources = () => {
    // First mark inactive so no restarts happen
    isActiveRef.current = false;

    if (recognitionRef.current) {
      // Remove handlers to prevent any callbacks during/after stop
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onstart = null;
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = undefined;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const stopAll = (cancel: boolean) => {
    const savedText = accumulatedTranscriptRef.current;
    cleanupResources();
    setIsListening(false);
    setAudioLevel([]);
    setShowMicWarning(false);
    setLiveTranscript('');
    if (cancel) {
      setInput(preRecordingInputRef.current);
    } else {
      // Put the transcribed text in the input (use saved text, even if empty)
      setInput(savedText || preRecordingInputRef.current);
    }
    accumulatedTranscriptRef.current = '';
  };

  const runAudioViz = () => {
    if (!analyserRef.current || !isActiveRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars = 8;
    const step = Math.floor(dataArray.length / bars);
    const levels: number[] = [];
    for (let i = 0; i < bars; i++) {
      levels.push(dataArray[i * step] / 255);
    }
    setAudioLevel(levels);
    animFrameRef.current = requestAnimationFrame(runAudioViz);
  };

  const startRecognition = () => {
    const SR =
      typeof window !== 'undefined'
        ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        : null;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;
    recognitionRef.current = rec;

    rec.onresult = (event: any) => {
      if (!isActiveRef.current) return;

      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interimTranscript += r[0].transcript;
      }

      const text = finalTranscript || interimTranscript;
      if (text) {
        accumulatedTranscriptRef.current = text;
        setLiveTranscript(text);
        setShowMicWarning(false);
        // Reset silence timer on speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      }
    };

    rec.onerror = (event: any) => {
      if (!isActiveRef.current) return;
      console.error('Speech recognition error:', event.error);
      // Don't stop on errors — just show warning for no-speech
      if (event.error === 'no-speech') {
        setShowMicWarning(true);
      }
    };

    rec.onend = () => {
      // Browser ended recognition internally.
      // Auto-restart with a NEW instance if user hasn't stopped.
      if (isActiveRef.current) {
        // Null out old ref first
        recognitionRef.current = null;
        // Longer delay to let Chrome's STT service settle
        setTimeout(() => {
          if (isActiveRef.current) {
            startRecognition();
          }
        }, 500);
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current) startRecognition();
        }, 1000);
      }
    }
  };

  const handleVoiceInput = async () => {
    if (isActiveRef.current) {
      stopAll(false);
      return;
    }

    const SR =
      typeof window !== 'undefined'
        ? (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        : null;
    if (!SR) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    // Get microphone
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('No se pudo acceder al micrófono. Revisa los permisos de tu navegador.');
      return;
    }
    streamRef.current = stream;

    // Audio analyser
    const audioCtx = new AudioContext();
    audioContextRef.current = audioCtx;
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    // Init state
    preRecordingInputRef.current = input;
    accumulatedTranscriptRef.current = '';
    setShowMicWarning(false);
    setLiveTranscript('');

    // Mark active and show UI
    isActiveRef.current = true;
    setIsListening(true);

    // Start viz
    runAudioViz();

    // Silence timeout
    silenceTimerRef.current = setTimeout(() => {
      if (isActiveRef.current && !accumulatedTranscriptRef.current) {
        setShowMicWarning(true);
        setTimeout(() => {
          if (isActiveRef.current && !accumulatedTranscriptRef.current) {
            stopAll(false);
          }
        }, 4000);
      }
    }, 20000);

    // Start recognition
    startRecognition();
  };

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      cleanupResources();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      {/* Recording UI */}
      {isListening && (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          {/* Cancel / Done buttons */}
          <div className={`flex items-center justify-between px-4 pr-20 pt-3 pb-1 ${
            darkMode ? 'bg-gray-750' : 'bg-orange-50'
          }`}>
            <button
              onClick={() => stopAll(true)}
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
              onClick={() => stopAll(false)}
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

          {/* Live transcript display */}
          {liveTranscript && (
            <div className={`px-4 py-2 ${darkMode ? 'bg-gray-750' : 'bg-orange-50'}`}>
              <p
                className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                style={{ fontSize: `${14 * fontScale}px` }}
              >
                &ldquo;{liveTranscript}&rdquo;
              </p>
            </div>
          )}

          {/* Wave bars + "Escuchando..." */}
          <div className={`flex items-center justify-center gap-1 py-2 px-4 ${
            darkMode ? 'bg-gray-750' : 'bg-orange-50'
          }`}>
            <div className="flex items-end gap-0.5 h-8">
              {audioLevel.length > 0
                ? audioLevel.map((level, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-75"
                    style={{
                      width: 4,
                      height: `${Math.max(4, level * 32)}px`,
                      backgroundColor: level > 0.1
                        ? (darkMode ? '#fb923c' : '#ea580c')
                        : (darkMode ? '#6b7280' : '#d1d5db'),
                      transition: 'height 75ms ease',
                    }}
                  />
                ))
                : Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full animate-pulse"
                    style={{
                      width: 4,
                      height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
                      backgroundColor: darkMode ? '#4b5563' : '#d1d5db',
                    }}
                  />
                ))}
            </div>
            <span
              className={`ml-2 font-medium ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}
              style={{ fontSize: `${12 * fontScale}px` }}
            >
              {showMicWarning ? '' : '🎤 Escuchando...'}
            </span>
          </div>
        </div>
      )}

      {/* Mic warning with nieto */}
      {showMicWarning && (
        <div
          className={`flex items-center gap-3 px-4 py-2 ${
            darkMode ? 'bg-gray-750' : 'bg-amber-50'
          }`}
          style={{ animation: 'fadeInUp 0.4s ease-out' }}
        >
          <div style={{ width: 44, height: 44, flexShrink: 0 }}>
            <Lottie
              animationData={surveyNietoAnimation}
              loop
              autoplay
              style={{ width: 44, height: 44 }}
            />
          </div>
          <p
            className={`text-sm ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}
            style={{ fontSize: `${12 * fontScale}px` }}
          >
            🎤 No escucho nada... ¿Tienes el micrófono activado? También puedes escribir tu pregunta abajo ✍️
          </p>
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
            if (e.key === 'Enter' && !isLoading) {
              handleSend();
            }
          }}
          placeholder={isListening ? 'Habla y tu texto aparecerá aquí...' : 'Escribe tu pregunta...'}
          disabled={isLoading}
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
          onClick={handleVoiceInput}
          disabled={isLoading}
          className={`relative rounded-xl transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
              : darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-orange-300'
              : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
          } disabled:opacity-50`}
          style={{
            fontSize: `${18 * fontScale}px`,
            width: `${48 * fontScale}px`,
            height: `${44 * fontScale}px`,
          }}
          title={isListening ? 'Detener micrófono' : 'Usar micrófono'}
        >
          {isListening ? (
            <span className="animate-pulse">⏹</span>
          ) : (
            '🎤'
          )}
          {isListening && (
            <span
              className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping"
              style={{ animationDuration: '1.5s' }}
            />
          )}
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={`font-bold rounded-xl transition-all duration-200 ${
            input.trim()
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
