import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 1. Fetch user/session on mount & listen for auth changes
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession error", error);
        setCurrentUserId(null);
        return;
      }
      setCurrentUserId(data.session?.user?.id || null);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch initial unread count
  useEffect(() => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }

    const fetchCount = async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .neq("sender_id", currentUserId); // unread = not sent by me + read=false

      if (error) {
        console.error("Error fetching initial unread count:", error);
        setUnreadCount(0);
        return;
      }

      setUnreadCount(count || 0);
    };

    fetchCount();
  }, [currentUserId]);

  // 3. Realtime subscription for INSERT & UPDATE
  useEffect(() => {
    if (!currentUserId) return;

    // cleanup previous channel
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
      } catch {
        /* ignore */
      } finally {
        channelRef.current = null;
      }
    }

    const channel = supabase
      .channel(`unread-tracker-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          if (
            payload.new &&
            payload.new.sender_id !== currentUserId &&
            payload.new.read === false
          ) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload: any) => {
          const wasUnread =
            payload.old?.read === false &&
            payload.new?.read === true &&
            payload.new?.sender_id !== currentUserId;

          if (wasUnread) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      try {
        if (channel) {
          channel.unsubscribe();
          supabase.removeChannel(channel);
        }
      } catch {
        /* ignore */
      }
    };
  }, [currentUserId]);

  return unreadCount;
};
