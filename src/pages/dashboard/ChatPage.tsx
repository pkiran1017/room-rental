import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Star } from 'lucide-react';
import type { ChatRoom } from '@/types';
import { getChatRooms, starChat, unstarChat } from '@/services/chatService';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { getProfileImageUrl } from '@/lib/utils';

const ChatPage: React.FC = () => {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { openExistingChat } = useChat();
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                setIsLoading(true);
                const data = await getChatRooms();
                setChatRooms(data);
            } catch (error) {
            } finally {
                setIsLoading(false);
            }
        };

        fetchChatRooms();

        // Listen for message events to refresh the list
        const handleMessageEvent = () => {
            fetchChatRooms();
        };

        window.addEventListener('chat:message-received', handleMessageEvent);
        window.addEventListener('chat:messages-read', handleMessageEvent);

        return () => {
            window.removeEventListener('chat:message-received', handleMessageEvent);
            window.removeEventListener('chat:messages-read', handleMessageEvent);
        };
    }, []);

    const handleChatClick = (room: ChatRoom) => {
        // Open the chat modal with this conversation
        openExistingChat(room);
    };

    const handleStarClick = async (e: React.MouseEvent, room: ChatRoom) => {
        e.stopPropagation(); // Prevent opening the chat
        try {
            const starredCount = chatRooms.filter(r => r.is_starred).length;
            
            if (!room.is_starred && starredCount >= 5) {
                alert('You can only star up to 5 conversations');
                return;
            }

            if (room.is_starred) {
                const updatedRoom = await unstarChat(room.room_id!);
                setChatRooms(chatRooms.map(r => r.room_id === room.room_id ? updatedRoom : r));
            } else {
                const updatedRoom = await starChat(room.room_id!);
                setChatRooms(chatRooms.map(r => r.room_id === room.room_id ? updatedRoom : r));
            }
        } catch (error) {
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Messages</h1>
                    <p className="text-muted-foreground">Your chat conversations</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : chatRooms.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium mb-2">No messages yet</p>
                            <p className="text-sm">Start chatting with room owners from room listings</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {(() => {
                                    // Sort conversations: starred first, then by most recent
                                    const sortedRooms = [...chatRooms].sort((a, b) => {
                                    // First, sort by starred status
                                    if (a.is_starred && !b.is_starred) return -1;
                                    if (!a.is_starred && b.is_starred) return 1;
                                    
                                    // Then, sort by last message time (most recent first)
                                    const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                                    const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                                    return timeB - timeA;
                                });

                                return sortedRooms.map((room, index) => {
                                    // Add divider between starred and non-starred
                                    const isFirstNonStarred = index > 0 && sortedRooms[index - 1].is_starred && !room.is_starred;
                                    
                                    return (
                                        <div key={room.room_id}>
                                            {isFirstNonStarred && (
                                                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    All Conversations
                                                </div>
                                            )}
                                            {(() => {
                                                // Determine which participant is the other person
                                                const participant1 = typeof room.participant_1 === 'object' ? room.participant_1 : null;
                                                const participant2 = typeof room.participant_2 === 'object' ? room.participant_2 : null;
                                                
                                                const otherParticipant = 
                                                    participant1?.id !== currentUser?.id ? participant1 : participant2;
                                                
                                                const userName = otherParticipant?.name || 'Unknown User';
                                                const userImage = otherParticipant?.profile_image;
                                                const roomTitle = room.room_details?.title || room.room_title || 'Chat';
                                                const hasUnread = (room.unread_count || 0) > 0;

                                                return (
                                                    <div
                                                        className="w-full p-4 flex items-center gap-4 transition-all text-left group cursor-pointer hover:bg-muted"
                                                        onClick={() => handleChatClick(room)}
                                                    >
                                                        {/* Profile Image */}
                                                        <div className="flex-shrink-0">
                                                            {userImage ? (
                                                                <img 
                                                                    src={getProfileImageUrl(userImage)} 
                                                                    alt={userName}
                                                                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                                                    {userName.charAt(0)?.toUpperCase() || 'U'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold truncate">
                                                                        {userName}
                                                                    </p>
                                                                </div>
                                                                {room.last_message_at && (
                                                                    <span className="text-xs text-muted-foreground ml-2">
                                                                        {new Date(room.last_message_at).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm truncate text-muted-foreground">
                                                                        {roomTitle}
                                                                    </p>
                                                                    <p className={`text-xs mt-1 ${hasUnread ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                                                                        {hasUnread ? 'New message' : 'No new message'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                                    {/* Star Button */}
                                                                    <button
                                                                        onClick={(e) => handleStarClick(e, room)}
                                                                        className="p-1 hover:bg-yellow-100 rounded transition-colors group/star"
                                                                        title={room.is_starred ? 'Unstar' : 'Star'}
                                                                    >
                                                                        <Star
                                                                            size={18}
                                                                            className={`transition-colors ${
                                                                                room.is_starred
                                                                                    ? 'fill-yellow-400 text-yellow-400'
                                                                                    : 'text-gray-300 group-hover/star:text-yellow-400'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ChatPage;
