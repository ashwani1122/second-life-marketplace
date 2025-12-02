import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

function safeParse(value: any): any {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return value;
  try {
    const first = JSON.parse(value);
    if (typeof first === "string") {
      try {
        return JSON.parse(first);
      } catch {
        return first;
      }
    }
    return first;
  } catch {
    return value;
  }
}

type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string | null;
  payload: any;
  read: boolean;
  created_at: string;
  title: string | null;
  body: string | null;
  data: any;
};

export default function NotificationsPage(): JSX.Element {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("getUser error", error);
          toast.error("Failed to load user.");
          return;
        }
        const uid = data?.user?.id ?? null;
        if (!mounted) return;
        setCurrentUserId(uid);

        if (uid) {
          await fetchNotifications(uid);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("getUser catch", err);
        toast.error("Failed to load notifications.");
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchNotifications = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, user_id, actor_id, type, payload, read, created_at, title, body, data"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("fetchNotifications error", error);
        toast.error("Failed to load notifications.");
        setNotifications([]);
      } else {
        const list: NotificationRow[] = (data ?? []).map((n: any) => ({
          ...n,
          payload: safeParse(n.payload),
          data: safeParse(n.data),
        }));
        setNotifications(list);
      }
    } catch (err) {
      console.error("fetchNotifications catch", err);
      toast.error("Failed to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;
    setMarkingAll(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", currentUserId)
        .eq("read", false);

      if (error) {
        console.error("markAllAsRead error", error);
        toast.error("Could not mark notifications as read.");
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("markAllAsRead catch", err);
      toast.error("Could not mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (n: NotificationRow) => {
    const payload = n.payload || n.data || {};
    const productId = payload.product_id;
    const bookingId = payload.booking_id;

    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    } else if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const renderTitle = (n: NotificationRow): string => {
    if (n.title) return n.title;
    switch (n.type) {
      case "booking_request":
        return "New booking request";
      case "booking":
      case "booking_update":
        return "Booking update";
      case "sale":
        return "Sale update";
      default:
        return "Notification";
    }
  };

  const renderBody = (n: NotificationRow): string => {
    if (n.body) return n.body;

    const payload = n.payload || {};
    const message = payload.message;
    const offered = payload.offered_price;

    if (n.type === "booking_request") {
      return (
        message ||
        `You received a new booking request${
          offered ? ` (offer: ₹${offered})` : ""
        }.`
      );
    }

    if (n.type === "booking_update" || n.type === "booking") {
      const status = payload.status || "updated";
      return `Your booking has been ${status}.`;
    }

    if (n.type === "sale") {
      const status = payload.status || "updated";
      return `Sale ${status}.`;
    }

    return message || "You have a new notification.";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Notifications</h1>
        <p className="text-sm text-slate-500">
          Please sign in to view your notifications.
        </p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You’re all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? "Marking..." : "Mark all as read"}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6 text-sm text-slate-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                n.read
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                  : "bg-indigo-50 dark:bg-slate-800 border-indigo-100 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm">
                  {renderTitle(n)}
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap">
                  {n.created_at
                    ? formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })
                    : ""}
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {renderBody(n)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
