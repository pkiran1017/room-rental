import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProfileImageUrl } from '@/lib/utils';

interface MessagePopupProps {
  senderName: string;
  senderImage?: string;
  messagePreview: string;
  chatRoomId: string;
  duration?: number;
  onDismiss?: () => void;
  onClick?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const MessagePopup: React.FC<MessagePopupProps> = ({
  senderName,
  senderImage,
  messagePreview,
  duration = 5000,
  onDismiss,
  onClick,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, isHovering, onDismiss]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-[9999] animate-in slide-in-from-right duration-300`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        onClick={onClick}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all cursor-pointer max-w-sm"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {senderImage ? (
              <img
                src={getProfileImageUrl(senderImage)}
                alt={senderName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-white text-sm font-semibold">
                {senderName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-sm">{senderName}</p>
              <p className="text-blue-100 text-xs">New message</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              onDismiss?.();
            }}
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
            {messagePreview}
          </p>
        </div>

        {/* Footer / Action */}
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 flex justify-end gap-2 border-t border-gray-200 dark:border-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              onDismiss?.();
            }}
            className="text-gray-600 dark:text-gray-400"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Reply
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessagePopup;
