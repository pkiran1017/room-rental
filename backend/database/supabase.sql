-- ============================================================
-- Room Rental & Expense Management System - Supabase Schema
-- PostgreSQL / Supabase SQL
-- Run this in Supabase SQL Editor
-- 
-- ⚠️  WARNING: This script will DROP and RECREATE all tables ⚠️
-- All existing chat data will be DELETED
-- Only run this for initial setup or when you want to reset
-- 
-- HOW TO USE:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create New Query
-- 3. Paste this ENTIRE file
-- 4. Click RUN
-- 5. Wait for "Success" message
-- ============================================================

-- Set schema
set search_path = public;

-- ============================================================
-- STEP 1: DROP EXISTING TABLES, FUNCTIONS, TRIGGERS
-- ============================================================

do $$ 
begin
    raise notice '🗑️  Dropping existing tables, functions, and triggers...';
end $$;

-- Drop triggers first
drop trigger if exists trigger_update_last_message on public.messages cascade;

-- Drop functions
drop function if exists update_last_message_at() cascade;
drop function if exists mark_messages_as_read(text, bigint) cascade;
drop function if exists get_unread_count(bigint) cascade;

-- Drop tables in correct order (respecting foreign keys)
drop table if exists public.messages cascade;
drop table if exists public.chat_rooms cascade;
drop table if exists public.rooms cascade;
drop table if exists public.users cascade;

do $$ 
begin
    raise notice '✅ Previous tables and functions dropped successfully';
    raise notice '';
    raise notice '📦 Creating new tables...';
end $$;

-- ============================================================
-- REFERENCE TABLES (Synced from MySQL)
-- ============================================================
-- These are lightweight mirrors synced from MySQL database
-- Backend syncs data here before creating chat rooms

-- Users table (minimal info for chat)
create table public.users (
    id bigint primary key,
    name text not null,
    profile_image text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Rooms table (minimal info for chat context)
create table public.rooms (
    id bigint primary key,
    room_id text not null,
    title text not null,
    images jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ============================================================
-- CHAT TABLES (Primary realtime source)
-- ============================================================

-- Chat rooms table
create table public.chat_rooms (
    id bigint generated always as identity primary key,
    room_id text not null unique,
    room_listing_id bigint null references public.rooms(id) on delete set null,
    participant_1 bigint not null references public.users(id) on delete cascade,
    participant_2 bigint not null references public.users(id) on delete cascade,
    created_at timestamptz default now(),
    last_message_at timestamptz,
    is_active boolean default true,
    is_starred boolean default false,
    
    -- Ensure unique chat room per room listing and participants
    constraint unique_chat_per_listing unique (room_listing_id, participant_1, participant_2)
);

-- Messages table
create table public.messages (
    id bigint generated always as identity primary key,
    chat_room_id text not null references public.chat_rooms(room_id) on delete cascade,
    sender_id bigint not null references public.users(id) on delete cascade,
    message text not null,
    is_read boolean default false,
    read_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    -- Ensure message is not empty
    constraint message_not_empty check (length(trim(message)) > 0)
);

do $$ 
begin
    raise notice '✅ Tables created: users, rooms, chat_rooms, messages';
    raise notice '';
    raise notice '🔍 Creating indexes for performance...';
end $$;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Users indexes
create index idx_users_name on public.users(name);

-- Rooms indexes
create index idx_rooms_room_id on public.rooms(room_id);

-- Chat rooms indexes
create index idx_chat_rooms_participants on public.chat_rooms(participant_1, participant_2);
create index idx_chat_rooms_room_listing on public.chat_rooms(room_listing_id);
create index idx_chat_rooms_is_active on public.chat_rooms(is_active) where is_active = true;
create index idx_chat_rooms_last_message on public.chat_rooms(last_message_at desc nulls last);
create index idx_chat_rooms_room_id on public.chat_rooms(room_id);
create index idx_chat_rooms_is_starred on public.chat_rooms(participant_1, participant_2, is_starred) where is_starred = true;
create index idx_chat_rooms_starred_users on public.chat_rooms(participant_1, is_starred) where is_starred = true;
create index idx_chat_rooms_starred_users_p2 on public.chat_rooms(participant_2, is_starred) where is_starred = true;

-- Messages indexes
create index idx_messages_chat_room on public.messages(chat_room_id);
create index idx_messages_sender on public.messages(sender_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_messages_unread on public.messages(chat_room_id, is_read) where is_read = false;
create index idx_messages_chat_room_created on public.messages(chat_room_id, created_at desc);

do $$ 
begin
    raise notice '✅ Created 16 performance indexes';
    raise notice '';
    raise notice '⚙️  Creating functions...';
end $$;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to automatically update last_message_at in chat_rooms
create or replace function update_last_message_at()
returns trigger as $$
begin
    update public.chat_rooms
    set last_message_at = new.created_at
    where room_id = new.chat_room_id;
    return new;
end;
$$ language plpgsql;

-- Function to mark messages as read
create or replace function mark_messages_as_read(p_chat_room_id text, p_user_id bigint)
returns void as $$
begin
    update public.messages
    set is_read = true,
        read_at = now()
    where chat_room_id = p_chat_room_id
      and sender_id != p_user_id
      and is_read = false;
end;
$$ language plpgsql;

-- Function to get unread message count for a user
create or replace function get_unread_count(p_user_id bigint)
returns table(chat_room_id text, unread_count bigint) as $$
begin
    return query
    select m.chat_room_id, count(*)::bigint as unread_count
    from public.messages m
    join public.chat_rooms cr on m.chat_room_id = cr.room_id
    where (cr.participant_1 = p_user_id or cr.participant_2 = p_user_id)
      and m.sender_id != p_user_id
      and m.is_read = false
    group by m.chat_room_id;
end;
$$ language plpgsql;

do $$ 
begin
    raise notice '✅ Created 3 helper functions';
    raise notice '';
    raise notice '⚡ Setting up triggers...';
end $$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Drop trigger if exists
drop trigger if exists trigger_update_last_message on public.messages;

-- Trigger to update last_message_at when new message is inserted
create trigger trigger_update_last_message
    after insert on public.messages
    for each row
    execute function update_last_message_at();

do $$ 
begin
    raise notice '✅ Triggers configured';
    raise notice '';
    raise notice '🔴 Enabling realtime for tables...';
end $$;

-- ============================================================
-- REALTIME CONFIGURATION
-- ============================================================

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'messages'
    ) then
        alter publication supabase_realtime add table public.messages;
    end if;

    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'chat_rooms'
    ) then
        alter publication supabase_realtime add table public.chat_rooms;
    end if;
end $$;

do $$ 
begin
    raise notice '✅ Realtime enabled for messages and chat_rooms';
    raise notice '';
    raise notice '🔒 Configuring security...';
end $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Currently disabled for simplicity - backend uses service key
-- Enable and configure policies for production security

alter table public.users disable row level security;
alter table public.rooms disable row level security;
alter table public.chat_rooms disable row level security;
alter table public.messages disable row level security;

do $$ 
begin
    raise notice '✅ RLS disabled (backend uses service key)';
    raise notice '';
    raise notice '✅✅✅ SETUP COMPLETE! ✅✅✅';
    raise notice '';
    raise notice '🎉 Your Supabase realtime chat database is ready!';
    raise notice '📦 Tables: users, rooms, chat_rooms, messages';
    raise notice '🔍 Indexes: 13 performance indexes created';
    raise notice '⚙️  Functions: 3 helper functions ready';
    raise notice '⚡ Triggers: Auto-update last_message_at enabled';
    raise notice '🔴 Realtime: Enabled for live chat updates';
    raise notice '';
    raise notice '🚀 Next steps:';
    raise notice '   1. Backend will auto-sync users and rooms';
    raise notice '   2. Start chatting via your app';
    raise notice '   3. Messages will sync in realtime';
    raise notice '';
end $$;

-- ============================================================
-- OPTIONAL: Enable RLS with policies (Uncomment for production)
-- ============================================================
/*
-- Enable RLS
alter table public.chat_rooms enable row level security;
alter table public.messages enable row level security;

-- Chat rooms policies
create policy "Users can view their own chat rooms"
    on public.chat_rooms for select
    using (auth.uid()::bigint = participant_1 or auth.uid()::bigint = participant_2);

create policy "Users can create chat rooms"
    on public.chat_rooms for insert
    with check (auth.uid()::bigint = participant_1 or auth.uid()::bigint = participant_2);

-- Messages policies
create policy "Users can view messages in their chat rooms"
    on public.messages for select
    using (
        exists (
            select 1 from public.chat_rooms cr
            where cr.room_id = chat_room_id
            and (cr.participant_1 = auth.uid()::bigint or cr.participant_2 = auth.uid()::bigint)
        )
    );

create policy "Users can send messages to their chat rooms"
    on public.messages for insert
    with check (
        sender_id = auth.uid()::bigint
        and exists (
            select 1 from public.chat_rooms cr
            where cr.room_id = chat_room_id
            and (cr.participant_1 = auth.uid()::bigint or cr.participant_2 = auth.uid()::bigint)
        )
    );

create policy "Users can update their own messages"
    on public.messages for update
    using (sender_id = auth.uid()::bigint);
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify everything is set up correctly

-- Check tables exist
select tablename from pg_tables where schemaname = 'public' 
and tablename in ('users', 'rooms', 'chat_rooms', 'messages')
order by tablename;

-- Check indexes
select indexname from pg_indexes where schemaname = 'public' 
and tablename in ('chat_rooms', 'messages')
order by indexname;

-- Check functions
select routine_name from information_schema.routines 
where routine_schema = 'public' 
and routine_name in ('update_last_message_at', 'mark_messages_as_read', 'get_unread_count');

-- Check realtime is enabled
select schemaname, tablename from pg_publication_tables 
where pubname = 'supabase_realtime';

-- ============================================================
-- COMPLETE! 
-- ============================================================
-- Your Supabase database is now ready for realtime chat
-- Backend will automatically sync users and rooms data
-- Messages will be delivered in realtime via Supabase Realtime
-- ============================================================
