import React, { useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import type { Message } from '@/types';

interface ChatMessagesProps {
    messages: Message[];
    currentUserId: number;
    isLoading?: boolean;
    error?: string | null;
    typingUsers?: Map<number, { name: string; isTyping: boolean }>;
    onMarkAsRead?: (messageIds: string[]) => void;
    onScrollTop?: () => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
    messages,
    currentUserId,
    isLoading,
    error,
    typingUsers = new Map(),
    onMarkAsRead,
    onScrollTop
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const markedIdsRef = useRef<Set<string>>(new Set());

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // Mark messages as read when the chat box is visible
    useEffect(() => {
        if (!onMarkAsRead || typeof document === 'undefined') return;
        if (document.visibilityState !== 'visible') return;

        const unreadMessages = messages
            .filter(msg => !msg.is_read && msg.sender_id !== currentUserId)
            .map(msg => msg.id)
            .filter(id => !markedIdsRef.current.has(id));

        if (unreadMessages.length > 0) {
            onMarkAsRead(unreadMessages);
            unreadMessages.forEach(id => markedIdsRef.current.add(id));
        }
    }, [messages, currentUserId, onMarkAsRead]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const element = e.currentTarget;
        if (element.scrollTop === 0) {
            onScrollTop?.();
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-red-600 space-y-2">
                    <AlertCircle className="w-12 h-12 mx-auto" />
                    <p className="font-medium">{error}</p>
                    <p className="text-sm">Unable to load messages</p>
                </div>
            </div>
        );
    }

    if (isLoading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-600 text-sm">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center space-y-2">
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className="h-full w-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
        >
            <div className="flex flex-col p-4 space-y-1">
                {/* Load more indicator */}
                {isLoading && messages.length > 0 && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                )}

                {/* Messages */}
                {messages.map((message, index) => {
                    const isOwn = message.sender_id === currentUserId;
                    const prevMessage = index > 0 ? messages[index - 1] : null;

                    // Determine if we should show avatar/name
                    const showAvatar =
                        !isOwn &&
                        (!prevMessage || prevMessage.sender_id !== message.sender_id || 
                         new Date(prevMessage.created_at || 0).getTime() - new Date(message.created_at || 0).getTime() > 60000);

                    return (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={isOwn}
                            showTimestamp={true}
                            showAvatar={showAvatar}
                            senderName={message.sender_name}
                            senderImage={message.sender_image}
                        />
                    );
                })}

                {/* Typing Indicator */}
                {Array.from(typingUsers.entries()).map(([userId, { name, isTyping }]) => (
                    userId !== currentUserId && (
                        <TypingIndicator
                            key={`typing-${userId}`}
                            isTyping={isTyping}
                            userName={name}
                            animated={true}
                        />
                    )
                ))}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-1" />
            </div>
        </ScrollArea>
    );
};

export default ChatMessages;
