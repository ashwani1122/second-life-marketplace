// src/hooks/useNotifications.tsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes to notifications for current user (v2 channel)
 * returns { unreadCount, notifications, requestPermission, stop }
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      // initial fetch of recent notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);
      if (mounted.current && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      }

      // realtime subscribe
      const channel = supabase
        .channel(`notifications-user-${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload: any) => {
            const n = payload.new;
            setNotifications((s) => [n, ...s].slice(0, 50));
            setUnreadCount((c) => c + 1);

            // in-app toast
            toast(`${n.type}: ${n.payload?.message ?? "You have a new notification"}`, {
              description: n.payload ? JSON.stringify(n.payload) : undefined,
            });

            // desktop notification
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try {
                new Notification("Nexo", { body: n.payload?.message ?? n.type });
              } catch {}
            }

            // optional sound
            try {
              const audio = new Audio("/sounds/notify.mp3"); // add a short sound file in public/
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch {}
          }
        )
        .subscribe();

      channelRef.current = channel;
    })();

    return () => {
      mounted.current = false;
      if (channelRef.current) {
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch {}
      }
    };
  }, []);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const p = await Notification.requestPermission();
      return p;
    }
    return Notification.permission;
  };

  const markAllRead = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;
      await supabase.from("notifications").update({ read: true }).eq("user_id", userId).is("read", false);
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return { notifications, unreadCount, requestPermission, markAllRead };
}
