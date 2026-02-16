import React from 'react';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  fontScale: number;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, fontScale }) => {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-xs px-4 py-3 rounded-lg ${
          isBot
            ? 'bg-gray-200 text-gray-900'
            : 'bg-blue-500 text-white'
        }`}
        style={{
          fontSize: `${14 * fontScale}px`,
          lineHeight: `${20 * fontScale}px`,
        }}
      >
        <div className="break-words whitespace-pre-wrap">
          {message.text}
        </div>

        {isBot && message.videoId && (
          <div className="mt-3">
            <iframe
              width="100%"
              height={Math.round(200 * fontScale)}
              src={`https://www.youtube.com/embed/${message.videoId}`}
              style={{ borderRadius: '4px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {isBot && message.steps && message.steps.length > 0 && (
          <div className="mt-3 bg-white bg-opacity-20 p-2 rounded">
            {message.steps.map((step) => (
              <p key={step.step} className="text-sm mb-1">
                <strong>{step.step}.</strong> {step.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
