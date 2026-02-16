import React, { useRef, useState } from 'react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  fontScale: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  fontScale,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleVoiceInput = () => {
    if (
      typeof window !== 'undefined' &&
      (window as any).webkitSpeechRecognition
    ) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (!SpeechRecognition) {
        alert('Tu navegador no soporta reconocimiento de voz');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.start();
    } else {
      alert('Tu navegador no soporta reconocimiento de voz');
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-300">
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
        placeholder="Escribe tu pregunta..."
        disabled={isLoading}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{
          fontSize: `${16 * fontScale}px`,
          padding: `${8 * fontScale}px ${16 * fontScale}px`,
        }}
      />

      <button
        onClick={handleVoiceInput}
        disabled={isLoading || isListening}
        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:bg-gray-400"
        style={{
          fontSize: `${16 * fontScale}px`,
          width: `${50 * fontScale}px`,
          height: `${44 * fontScale}px`,
        }}
        title="Usar micrófono"
      >
        🎤
      </button>

      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:bg-gray-400"
        style={{
          fontSize: `${16 * fontScale}px`,
          padding: `${8 * fontScale}px ${24 * fontScale}px`,
        }}
      >
        Enviar
      </button>
    </div>
  );
};
