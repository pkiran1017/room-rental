import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Message, ChatRoom } from '@/types';

interface RealtimeChatConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface MessageCallback {
  onMessageReceived?: (message: Message) => void;
  onTypingStatusChanged?: (userId: number, isTyping: boolean) => void;
  onReadReceiptChanged?: (messageIds: string[]) => void;
  onUserOnlineStatusChanged?: (userId: number, isOnline: boolean) => void;
  onError?: (error: Error) => void;
}

class RealtimeChatService {
  private supabase: any;
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, MessageCallback> = new Map();
  private typingTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private currentUserId: number | null = null;

  constructor(config?: RealtimeChatConfig) {
    if (config) {
      this.initialize(config);
    }
  }

  /**
   * Initialize Supabase client
   */
  initialize(config: RealtimeChatConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  /**
   * Set current user ID for tracking
   */
  setCurrentUserId(userId: number) {
    this.currentUserId = userId;
  }

  /**
   * Subscribe to a chat room for realtime messages
   */
  subscribeToChatRoom(
    chatRoomId: string,
    callbacks: MessageCallback,
    onSubscriptionReady?: () => void
  ): RealtimeChannel | null {
    const channelName = `chat:${chatRoomId}`;
    
    // Check if Supabase is initialized
    if (!this.supabase) {
      callbacks.onError?.(new Error('Supabase not initialized. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.'));
      return null;
    }
    
    // Unsubscribe existing channel
    if (this.channels.has(channelName)) {
      this.unsubscribeFromChatRoom(chatRoomId);
    }

    const channel = this.supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false, ack: false },
          presenceOpts: {
            key: this.currentUserId?.toString() || 'guest'
          }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          // Fetch sender information if not included
          if (!payload.new.sender) {
            const { data: sender } = await this.supabase
              .from('users')
              .select('id, name, profile_image')
              .eq('id', payload.new.sender_id)
              .single();
            
            if (sender) {
              payload.new.sender = sender;
            }
          }
          
          const message = this.formatMessage(payload.new);
          callbacks.onMessageReceived?.(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Handle read receipt updates - only trigger when message is marked as read
          const isNowRead = payload.new?.is_read === true;
          const wasNotReadBefore = (payload.old as any)?.is_read !== true;
          
          if (isNowRead && wasNotReadBefore) {
            // Convert ID to string to match message ID format
            const messageId = payload.new?.id?.toString() || '';
            if (messageId) {
              callbacks.onReadReceiptChanged?.([messageId]);
            }
          }
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        callbacks.onTypingStatusChanged?.(payload.payload.userId, true);
      })
      .on('broadcast', { event: 'stop_typing' }, (payload: any) => {
        callbacks.onTypingStatusChanged?.(payload.payload.userId, false);
      })
      .on('broadcast', { event: 'read_receipt' }, (payload: any) => {
        if (payload.payload?.messageIds) {
          callbacks.onReadReceiptChanged?.(payload.payload.messageIds);
        }
      })

      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          onSubscriptionReady?.();
        }
      });

    this.channels.set(channelName, channel);
    this.callbacks.set(channelName, callbacks);

    return channel;
  }

  /**
   * Unsubscribe from a chat room
   */
  async unsubscribeFromChatRoom(chatRoomId: string) {
    const channelName = `chat:${chatRoomId}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.callbacks.delete(channelName);
    }
  }

  /**
   * Send a message via broadcast
   */
  async sendTypingIndicator(chatRoomId: string, isTyping: boolean = true) {
    const channelName = `chat:${chatRoomId}`;
    const channel = this.channels.get(channelName);

    if (!channel) return;

    const eventType = isTyping ? 'typing' : 'stop_typing';

    await channel.send({
      type: 'broadcast',
      event: eventType,
      payload: {
        userId: this.currentUserId,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Mark messages as read and broadcast read receipts
   */
  async sendReadReceipt(chatRoomId: string, messageIds: string[]) {
    const channelName = `chat:${chatRoomId}`;
    const channel = this.channels.get(channelName);
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    try {
      // First, update the backend database
      const response = await fetch(`${apiBaseUrl}/chat/room/${chatRoomId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`Failed to mark messages as read: ${response.statusText}`);
      }

      // Then broadcast the read receipt event for real-time sync
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'read_receipt',
          payload: {
            messageIds,
            userId: this.currentUserId,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      // Still try to send broadcast even if API fails
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'read_receipt',
          payload: {
            messageIds,
            userId: this.currentUserId,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Get message history with pagination
   */
  async getMessageHistory(
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        id,
        chat_room_id,
        sender_id,
        message,
        is_read,
        read_at,
        created_at,
        sender:sender_id(
          id,
          name,
          profile_image
        )
      `)
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data || []).map(this.formatMessage).reverse();
  }

  /**
   * Fetch user's chat rooms with last message
   */
  async getChatRooms(): Promise<ChatRoom[]> {
    const { data, error } = await this.supabase
      .from('chat_rooms')
      .select(`
        *,
        participant_1:users!participant_1(id, name, profile_image),
        participant_2:users!participant_2(id, name, profile_image),
        last_message:messages(
          id,
          message,
          created_at,
          sender_id
        )
      `)
      .or(`participant_1.eq.${this.currentUserId},participant_2.eq.${this.currentUserId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Search messages in a chat
   */
  async searchMessages(
    chatRoomId: string,
    query: string,
    limit: number = 20
  ): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .ilike('message', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {

      throw error;
    }

    return (data || []).map(this.formatMessage);
  }

  /**
   * Format message response from Supabase
   */
  private formatMessage(msg: any): Message {
    let deliveryStatus: 'sent' | 'read' = 'sent';
    
    // If message has is_read flag, it's been read
    if (msg.is_read) {
      deliveryStatus = 'read';
    }
    // Otherwise, remain as 'sent'
    
    return {
      id: msg.id?.toString() || '',
      chat_room_id: msg.chat_room_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender?.name || 'Unknown',
      sender_image: msg.sender?.profile_image,
      message: msg.message,
      message_text: msg.message,
      is_read: msg.is_read,
      read_status: msg.is_read,
      delivery_status: deliveryStatus,
      read_at: msg.read_at,
      created_at: msg.created_at
    };
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Cleanup and disconnect all channels
   */
  async disconnect() {
    for (const [, channel] of this.channels) {
      await this.supabase.removeChannel(channel);
    }
    this.channels.clear();
    this.callbacks.clear();
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }
}

// Singleton instance
export const realtimeChatService = new RealtimeChatService();

export default RealtimeChatService;
