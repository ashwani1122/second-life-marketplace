import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotificationsUnreadCount() {
  const [count, setCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const chanRef = useRef<any | null>(null);

  // get current user id
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("getUser error", error);
        }
        if (!mounted) return;
        setUserId(data?.user?.id ?? null);
      } catch (err) {
        console.warn("getUser failed", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchUnread = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", uid)
        .eq("read", false);

      if (error) {
        console.error("fetchUnread notifications error", error);
        return;
      }
      setCount(data?.length ?? 0);
    } catch (err) {
      console.error("fetchUnread notifications catch", err);
    }
  };

  // subscribe to changes
  useEffect(() => {
    if (!userId) return;

    fetchUnread(userId);

    const channel = supabase
      .channel(`notifications-user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnread(userId);
        }
      )
      .subscribe();

    chanRef.current = channel;

    return () => {
      try {
        if (chanRef.current) {
          chanRef.current.unsubscribe();
          try {
            supabase.removeChannel(chanRef.current);
          } catch {
            /* ignore */
          }
          chanRef.current = null;
        }
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return count;
}
