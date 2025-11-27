import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Custom hook to track the number of unread messages for the current user
export const useUnreadCount = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // --- 1. Fetch User ID on Mount ---
    useEffect(() => {
        const fetchUser = async () => {
            // NOTE: Using getSession is generally better than getUser() for simple auth checks
            const { data } = await supabase.auth.getSession();
            setCurrentUserId(data.session?.user?.id || null);
        };
        fetchUser();

        // Listen for auth changes to update the user ID (and trigger fetch/subscribe)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);


    // --- 2. Fetch Initial Unread Count ---
    useEffect(() => {
        if (!currentUserId) {
            setUnreadCount(0);
            return;
        }

        const fetchCount = async () => {
            // Count messages where 'read' is false AND the sender is NOT the current user
            // This is how we define 'unread messages waiting for me'.
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('read', false)
                .neq('sender_id', currentUserId); 

            if (error) {
                console.error("Error fetching initial unread count:", error);
                setUnreadCount(0);
                return;
            }
            setUnreadCount(count || 0);
        };
        
        fetchCount();
    }, [currentUserId]);

    // --- 3. Subscribe to Real-time Changes ---
    useEffect(() => {
        if (!currentUserId) return;

        // Cleanup previous channel if it exists
        if (channelRef.current) {
            channelRef.current.unsubscribe();
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        // Subscribe to messages table for INSERTS (new messages) and UPDATES (read status change)
        const channel = supabase
            .channel(`unread-tracker-${currentUserId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload: any) => {
                    // If a new message is received AND it's not from the current user, increment the count
                    if (payload.new.sender_id !== currentUserId && payload.new.read === false) {
                        setUnreadCount(count => count + 1);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                (payload: any) => {
                    // Scenario 1: A message I RECEIVED is marked TRUE (e.g., I opened the chat).
                    // This means we need to decrement the count.
                    const wasUnread = payload.old.read === false;
                    const isNowRead = payload.new.read === true;
                    const notSentByMe = payload.new.sender_id !== currentUserId;

                    if (wasUnread && isNowRead && notSentByMe) {
                        setUnreadCount(count => Math.max(0, count - 1));
                    }
                    
                    // Note: If you mark all messages in a chat as read (batch update), 
                    // this single update event logic may not catch all changes simultaneously, 
                    // but the initial fetch will correct the total count on the next re-render.
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            // Cleanup on component unmount/user change
            if (channel) {
                channel.unsubscribe();
                supabase.removeChannel(channel);
            }
        };
    }, [currentUserId]);

    return unreadCount;
};