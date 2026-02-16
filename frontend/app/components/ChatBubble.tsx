import React, { useEffect, useState, useRef, useMemo } from 'react';
import type { ChatMessage } from '@/types';

interface ChatBubbleProps {
  message: ChatMessage;
  fontScale: number;
  darkMode?: boolean;
}

// Parse markdown-like bold (***text***, **text**) and return React elements
function parseInlineFormatting(text: string, darkMode: boolean): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match ***text***, **text**, or regular text
  const regex = /\*{2,3}([^*]+)\*{2,3}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className={`font-bold ${darkMode ? 'text-orange-300' : 'text-orange-700'}`}
      >
        {match[1]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

// Split bot text into intro, numbered steps, and closing
function parseStructuredResponse(text: string) {
  const lines = text.split('\n');
  const intro: string[] = [];
  const steps: { num: string; text: string }[] = [];
  const closing: string[] = [];
  let foundSteps = false;
  let doneSteps = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const stepMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (stepMatch && !doneSteps) {
      foundSteps = true;
      steps.push({ num: stepMatch[1], text: stepMatch[2] });
    } else if (foundSteps && !stepMatch && trimmed.length > 0) {
      // If the previous was a step and this line has no number,
      // check if it could be continuation or closing
      if (steps.length > 0 && !doneSteps && !trimmed.match(/^(\d+)\./)) {
        // Could be a continuation of the last step or the closing remark
        // Heuristic: if short or starts with "Si " / "No " / emoji, it's closing
        if (trimmed.length > 80 || /^(Si |No |Listo|Recuerda|Eso es|Espero|Y |Cualquier|Escríbeme|Un abrazo)/.test(trimmed)) {
          doneSteps = true;
          closing.push(trimmed);
        } else {
          // Append to last step
          steps[steps.length - 1].text += ' ' + trimmed;
        }
      }
    } else if (doneSteps) {
      if (trimmed.length > 0) closing.push(trimmed);
    } else {
      if (trimmed.length > 0) intro.push(trimmed);
    }
  }

  return { intro, steps, closing, hasSteps: steps.length > 0 };
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, fontScale, darkMode = false }) => {
  const isBot = message.sender === 'bot';
  const [displayedText, setDisplayedText] = useState(isBot ? '' : message.text);
  const [isTyping, setIsTyping] = useState(isBot);
  const [doneTyping, setDoneTyping] = useState(!isBot);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isBot) return;

    let i = 0;
    const text = message.text;
    const speed = Math.max(8, Math.min(25, 1500 / text.length));

    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
        setDoneTyping(true);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [message.text, isBot]);

  // Parse the displayed text for structured rendering
  const parsed = useMemo(() => parseStructuredResponse(displayedText), [displayedText]);

  // Decide: render structured (with step cards) only when there are steps
  const renderStructured = parsed.hasSteps && isBot;

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`${isBot ? 'max-w-sm sm:max-w-md md:max-w-lg' : 'max-w-xs sm:max-w-sm'} rounded-2xl ${
          isBot
            ? darkMode
              ? 'bg-gray-700 text-gray-100'
              : 'bg-white text-gray-900 shadow-md border border-orange-100'
            : darkMode
              ? 'bg-orange-600 text-white'
              : 'bg-orange-500 text-white'
        } ${isBot && renderStructured ? 'p-0 overflow-hidden' : 'px-4 py-3'}`}
        style={{
          fontSize: `${14 * fontScale}px`,
          lineHeight: `${22 * fontScale}px`,
        }}
      >
        {/* User messages or simple bot messages */}
        {(!renderStructured) && (
          <div className="break-words whitespace-pre-wrap">
            {isBot ? parseInlineFormatting(displayedText, darkMode) : displayedText}
            {isBot && isTyping && (
              <span className={`inline-block w-0.5 h-4 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} ml-0.5 animate-pulse align-middle`} />
            )}
          </div>
        )}

        {/* Structured bot response with step cards */}
        {renderStructured && (
          <div>
            {/* Intro section */}
            {parsed.intro.length > 0 && (
              <div className={`px-4 pt-4 pb-3 ${darkMode ? '' : ''}`}>
                {parsed.intro.map((line, i) => (
                  <p key={i} className="break-words">
                    {parseInlineFormatting(line, darkMode)}
                  </p>
                ))}
              </div>
            )}

            {/* Steps section */}
            {parsed.steps.length > 0 && (
              <div className={`px-3 py-2 space-y-2 ${darkMode ? 'bg-gray-800/50' : 'bg-orange-50/80'}`}>
                <div className={`flex items-center gap-2 px-1 pb-1 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                  <span className="text-sm">📋</span>
                  <span className="text-xs font-semibold uppercase tracking-wide">Pasos a seguir</span>
                </div>
                {parsed.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 p-3 rounded-xl transition-all duration-500 ${
                      doneTyping ? 'opacity-100 translate-y-0' : 'opacity-90'
                    } ${
                      darkMode
                        ? 'bg-gray-700 border border-gray-600'
                        : 'bg-white border border-orange-100 shadow-sm'
                    }`}
                    style={{
                      transitionDelay: doneTyping ? `${i * 80}ms` : '0ms',
                    }}
                  >
                    {/* Step number badge */}
                    <div
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        darkMode
                          ? 'bg-orange-600 text-white'
                          : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm'
                      }`}
                      style={{ fontSize: `${12 * fontScale}px` }}
                    >
                      {step.num}
                    </div>
                    {/* Step text */}
                    <div className="flex-1 break-words" style={{ fontSize: `${13 * fontScale}px` }}>
                      {parseInlineFormatting(step.text, darkMode)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Closing section */}
            {parsed.closing.length > 0 && (
              <div className={`px-4 pt-3 pb-4 ${darkMode ? 'border-t border-gray-600' : 'border-t border-orange-100'}`}>
                {parsed.closing.map((line, i) => (
                  <p key={i} className={`break-words ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontSize: `${13 * fontScale}px` }}>
                    {parseInlineFormatting(line, darkMode)}
                  </p>
                ))}
              </div>
            )}

            {/* Show cursor while still typing */}
            {isTyping && (
              <div className="px-4 pb-3">
                <span className={`inline-block w-0.5 h-4 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} animate-pulse`} />
              </div>
            )}
          </div>
        )}

        {isBot && message.videoId && (
          <div className={`${renderStructured ? 'px-3 pb-3' : 'mt-3'}`}>
            <iframe
              width="100%"
              height={Math.round(200 * fontScale)}
              src={`https://www.youtube.com/embed/${message.videoId}`}
              style={{ borderRadius: '8px' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {isBot && message.steps && message.steps.length > 0 && (
          <div className={`${renderStructured ? 'px-3 pb-3' : 'mt-3'} space-y-2`}>
            <div className={`flex items-center gap-2 ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>
              <span className="text-sm">📝</span>
              <span className="text-xs font-semibold uppercase tracking-wide">Resumen</span>
            </div>
            {message.steps.map((step) => (
              <div key={step.step} className={`flex gap-2 p-2 rounded-lg text-sm ${darkMode ? 'bg-gray-800/50' : 'bg-orange-50'}`}>
                <span className={`font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{step.step}.</span>
                <span>{step.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
