
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client"; // Adjust path to your Supabase client
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const ChatGlobalListener = () => {
  const navigate = useNavigate();
  // Use a ref to store the user ID without triggering re-renders
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
        const { data } = await supabase.auth.getUser();
        userIdRef.current = data.user?.id || null;
    };
    checkUser();

    // 2. Listen for ANY new message insert
    const channel = supabase
        .channel("global-chat-listener")
        .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
            const newMessage = payload.new;
            const currentUserId = userIdRef.current;

          // Crucial check: Don't notify the sender (me)
            if (!currentUserId || newMessage.sender_id === currentUserId) {
                return;
            }

          // Fetch Sender Name for a nice toast message
            let senderName = "Someone";
            const { data: profile } = await supabase
                .from("profiles")
            .select("full_name")
            .eq("id", newMessage.sender_id)
            .single();
          
          if (profile?.full_name) senderName = profile.full_name;

          // Show Notification
          toast(`New message from ${senderName}`, {
            description: newMessage.content ? newMessage.content.substring(0, 50) + "..." : "Sent an attachment",
            action: {
              label: "View Inbox",
              onClick: () => navigate("/inbox"), // Navigates to the Inbox page
            },
            duration: 8000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  return null;
};