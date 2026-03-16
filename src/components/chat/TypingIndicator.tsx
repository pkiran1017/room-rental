import React, { useEffect, useState } from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  animated?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  userName = 'Someone',
  animated = true
}) => {
  const [dots, setDots] = useState('•');

  useEffect(() => {
    if (!isTyping || !animated) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '•') return '•••';
        if (prev === '•••') return '••••';
        return '•';
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isTyping, animated]);

  if (!isTyping) return null;

  return (
    <div className="flex gap-2 mb-3 items-end animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
      <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1">
        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
          {userName}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">{dots}</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
