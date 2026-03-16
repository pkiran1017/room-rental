const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let supabaseAdmin = null;

const initializeSupabase = () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️  Supabase credentials not found. Chat features will not work.');
        return;
    }

    // Client for regular operations
    supabase = createClient(supabaseUrl, supabaseKey);

    // Admin client for privileged operations
    if (supabaseServiceKey) {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }

    console.log('✅ Supabase initialized successfully');
};

const getSupabase = () => {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    return supabase;
};

const getSupabaseAdmin = () => {
    if (!supabaseAdmin) {
        throw new Error('Supabase admin not initialized');
    }
    return supabaseAdmin;
};

// Real-time chat channel setup
const subscribeToChat = (chatRoomId, callback) => {
    const client = getSupabase();
    
    const channel = client
        .channel(`chat:${chatRoomId}`)
        .on('postgres_changes', 
            { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `chat_room_id=eq.${chatRoomId}`
            }, 
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return channel;
};

// Send message to Supabase
const sendMessage = async (chatRoomId, senderId, message) => {
    const client = getSupabase();
    
    const { data, error } = await client
        .from('messages')
        .insert([
            {
                chat_room_id: chatRoomId,
                sender_id: senderId,
                message: message,
                created_at: new Date().toISOString()
            }
        ])
        .select(`
            *,
            sender:sender_id (
                id,
                name,
                profile_image
            )
        `)
        .single();

    if (error) throw error;
    return data;
};

// Get chat history from Supabase
const getChatHistory = async (chatRoomId, limit = 50, offset = 0) => {
    const client = getSupabase();
    
    const { data, error } = await client
        .from('messages')
        .select(`
            *,
            sender:sender_id (
                id,
                name,
                profile_image
            )
        `)
        .eq('chat_room_id', chatRoomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data.reverse();
};

// Create or get chat room
const getOrCreateChatRoom = async (participant1, participant2, roomListingId = null) => {
    const client = getSupabase();
    
    // Check if chat room already exists
    const { data: existingRoom, error: searchError } = await client
        .from('chat_rooms')
        .select(`
            *,
            participant_1:users!participant_1(id, name, profile_image),
            participant_2:users!participant_2(id, name, profile_image),
            room_listing:rooms!room_listing_id(room_id, title, images)
        `)
        .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2}),and(participant_1.eq.${participant2},participant_2.eq.${participant1})`)
        .eq('room_listing_id', roomListingId)
        .single();

    if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
    }

    if (existingRoom) {
        return existingRoom;
    }

    // Create new chat room
    const roomId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: newRoom, error: createError } = await client
        .from('chat_rooms')
        .insert([
            {
                room_id: roomId,
                room_listing_id: roomListingId,
                participant_1: participant1,
                participant_2: participant2,
                created_at: new Date().toISOString()
            }
        ])
        .select(`
            *,
            participant_1:users!participant_1(id, name, profile_image),
            participant_2:users!participant_2(id, name, profile_image),
            room_listing:rooms!room_listing_id(room_id, title, images)
        `)
        .single();

    if (createError) throw createError;
    return newRoom;
};

// Get user's chat rooms
const getUserChatRooms = async (userId) => {
    const client = getSupabase();
    
    const { data, error } = await client
        .from('chat_rooms')
        .select(`
            *,
            participant_1:users!participant_1(id, name, profile_image),
            participant_2:users!participant_2(id, name, profile_image),
            room_listing:rooms!room_listing_id(room_id, title, images)
        `)
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

    if (error) throw error;
    
    // Fetch latest message and unread count for each room
    const roomsWithMessages = await Promise.all(
        (data || []).map(async (room) => {
            // Get latest message (use room.room_id, not room.id!)
            const { data: messages } = await client
                .from('messages')
                .select('id, message, sender_id, created_at')
                .eq('chat_room_id', room.room_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            // Count unread messages (messages sent by other user that haven't been read)
            const { count: unreadCount } = await client
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .eq('chat_room_id', room.room_id)
                .neq('sender_id', userId)
                .eq('is_read', false);
            
            return {
                ...room,
                last_message: messages || null,
                unread_count: unreadCount || 0
            };
        })
    );
    
    return roomsWithMessages;
};

module.exports = {
    initializeSupabase,
    getSupabase,
    getSupabaseAdmin,
    subscribeToChat,
    sendMessage,
    getChatHistory,
    getOrCreateChatRoom,
    getUserChatRooms
};
