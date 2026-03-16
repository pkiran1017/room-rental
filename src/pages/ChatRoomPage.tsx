import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ChatMessages from '@/components/chat/ChatMessages';
import ChatInput from '@/components/chat/ChatInput';
import { useAuth } from '@/context/AuthContext';
import {
    getChatMessages,
    sendMessage,
    markMessagesAsRead,
    getChatRooms
} from '@/services/chatService';
import type { Message, ChatRoom } from '@/types';

const ChatRoomPage: React.FC = () => {
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetchedMessage, setLastFetchedMessage] = useState<number>(0);

    // Load all chat rooms
    useEffect(() => {
        const loadChats = async () => {
            try {
                const chats = await getChatRooms();
                const chat = chats.find(c => c.id === parseInt(chatId || '0'));
                if (chat) {
                    setChatRoom(chat);
                }
            } catch (err) {
            }
        };

        loadChats();
    }, [chatId]);

    // Initial message load
    useEffect(() => {
        const loadMessages = async () => {
            if (!chatId) return;

            try {
                setIsLoading(true);
                const data = await getChatMessages(chatId, 100, 0);

                setMessages(data);
                if (data.length > 0) {
                    setLastFetchedMessage(parseInt(data[data.length - 1].id) || 0);
                }
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load messages');
            } finally {
                setIsLoading(false);
            }
        };

        loadMessages();
    }, [chatId, user?.id]);

    // Polling for new messages every 3-5 seconds
    useEffect(() => {
        if (!chatId || isLoading) return;

        const pollInterval = setInterval(async () => {
            try {
                const newMessages = await getChatMessages(chatId, 100, lastFetchedMessage);
                if (newMessages.length > 0) {
                    setMessages(prev => {
                        const updated = [...prev];
                        
                        newMessages.forEach(polledMsg => {
                            const existingIndex = updated.findIndex(m => m.id === polledMsg.id);
                            
                            if (existingIndex >= 0) {
                                // Update existing message
                                const existingMsg = updated[existingIndex];
                                
                                // If read, mark as read
                                if (polledMsg.is_read) {
                                    updated[existingIndex] = {
                                        ...existingMsg,
                                        is_read: true,
                                        delivery_status: 'read' as const
                                    };
                                }
                            } else {
                                const delivery_status = polledMsg.is_read ? 'read' : 'sent' as const;
                                updated.push({
                                    ...polledMsg,
                                    delivery_status
                                });
                            }
                        });
                        
                        return updated;
                    });
                    
                    if (newMessages.length > 0) {
                        setLastFetchedMessage(parseInt(newMessages[newMessages.length - 1].id) || lastFetchedMessage);
                    }
                }
            } catch (err) {
            }
        }, 4000); // Poll every 4 seconds

        return () => clearInterval(pollInterval);
    }, [chatId, lastFetchedMessage, isLoading, user?.id]);

    const handleSendMessage = useCallback(async (messageText: string) => {
        if (!chatId || !user) return;

        setIsSending(true);
        setError(null);

        try {
            const newMessage = await sendMessage(chatId, messageText);
            
            const delivery_status: 'sent' | 'read' = newMessage.is_read ? 'read' : 'sent';
            
            const messageWithStatus: Message = {
                ...newMessage,
                delivery_status
            };
            
            setMessages(prev => [...prev, messageWithStatus]);
            setLastFetchedMessage(parseInt(newMessage.id) || lastFetchedMessage);
            
            // Dispatch event for chat list updates
            window.dispatchEvent(new CustomEvent('chat:message-received', {
                detail: { chatRoomId: chatId, message: messageWithStatus }
            }));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            throw err;
        } finally {
            setIsSending(false);
        }
    }, [chatId, user, lastFetchedMessage]);

    const handleMarkAsRead = useCallback(async (messageIds: string[]) => {
        if (!chatId || messageIds.length === 0) return;
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

        try {
            await markMessagesAsRead(chatId);
            setMessages(prev =>
                prev.map(msg =>
                    messageIds.includes(msg.id)
                        ? { ...msg, is_read: true, read_status: true, delivery_status: 'read' }
                        : msg
                )
            );
            const roomIdForEvent = chatRoom?.room_id || chatId;
            window.dispatchEvent(new CustomEvent('chat:messages-read', {
                detail: { chatRoomId: roomIdForEvent }
            }));
        } catch (err) {
        }
    }, [chatId, chatRoom?.room_id]);

    const otherParticipant = chatRoom ? {
        name: chatRoom.receiver_name || chatRoom.initiator_name || 'User',
        id: chatRoom.receiver_id || chatRoom.initiator_id
    } : null;

    return (
        <div className="container mx-auto h-[calc(100vh-120px)] flex flex-col">
                {/* Chat Header */}
                <Card className="rounded-none border-l-0 border-r-0 border-t-0">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/dashboard/chat')}
                            >
                                <ArrowLeft size={20} />
                            </Button>
                            <div>
                                {chatRoom && (
                                    <>
                                        <h2 className="text-lg font-semibold">{otherParticipant?.name}</h2>
                                        <p className="text-sm text-gray-500">
                                            {chatRoom.room_title || 'Room Chat'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-gray-300`} />
                            <Button
                                variant="ghost"
                                size="icon"
                            >
                                <Settings2 size={20} />
                            </Button>
                        </div>
                    </div>
                </Card>

                <Separator />

                {/* Messages Section */}
                <div className="flex-1 overflow-hidden">
                    <ChatMessages
                        messages={messages}
                        currentUserId={user?.id || 0}
                        isLoading={isLoading}
                        error={error}
                        onMarkAsRead={handleMarkAsRead}
                    />
                </div>

                {/* Chat Input */}
                <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isSending}
                    disabled={!chatId || !user}
                    error={error}
                    maxLength={2000}
                />
            </div>
        );
    };

    export default ChatRoomPage;
