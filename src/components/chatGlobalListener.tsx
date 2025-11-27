import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // You are already using sonner
import { useLocation } from "react-router-dom";

export const ChatGlobalListener = () => {
  const location = useLocation();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Get current user
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      userIdRef.current = data.user?.id || null;
    };
    getUser();

    // 2. Set up Realtime Subscription for NEW messages
    const channel = supabase
      .channel("global-messages-listener")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;

          // Don't notify if I sent the message
          if (newMessage.sender_id === userIdRef.current) return;

          // Don't notify if I am currently on the product page for this chat
          // (Optional: requires more logic to check strictly against current URL)
          
          // Fetch the Sender's Name to make the toast pretty
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = profile?.full_name || "Someone";

          // 3. Trigger Toast Notification
          toast.message(`New message from ${senderName}`, {
            description: newMessage.content || "Sent an attachment",
            action: {
              label: "View",
              onClick: () => {
                // Navigate to your Inbox or the specific Product Page
                // Assuming you have an inbox route:
                window.location.href = `/inbox`; 
              },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component renders nothing visually
};