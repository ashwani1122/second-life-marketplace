import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Loader, MessageSquare, Clock, User, Box } from "lucide-react";
import { ChatListItem } from "@/types/chatList";
import { toast } from "sonner";

// Helper function for time formatting
const formatTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffInDays =
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  if (Number.isNaN(diffInDays)) return "";

  if (diffInDays < 1) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString();
  }
};

export default function InboxPage(): JSX.Element {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchChats = useCallback(async () => {
    setLoading(true);

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error("getUser error", authErr);
      toast.error("Failed to load user.");
      setCurrentUserId(null);
      setLoading(false);
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      setCurrentUserId(null);
      setLoading(false);
      return;
    }
    setCurrentUserId(userId);

    try {
      // 1. Fetch chats where the user is either the seller OR the buyer
      const { data: rawChats, error: chatsError } = await supabase
        .from("chats")
        .select(
          `
          id,
          product_id,
          created_at,
          products (
            title,
            seller_id,
            status
          ),
          buyer_id,
          seller_id,
          messages (
            content,
            created_at,
            read,
            sender_id
          ),
          buyer:profiles!buyer_id (
            full_name
          ),
          seller:profiles!seller_id (
            full_name
          )
        `
        )
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

      if (chatsError) {
        console.error("chatsError", chatsError);
        toast.error("Failed to load your conversations.");
        setChats([]);
        return;
      }
        alert(JSON.stringify(rawChats));
      const processedChats: ChatListItem[] = (rawChats || [])
        .map((chat: any) => {
          const productTitle = chat.products?.title || "Unknown product";
          const productStatus = chat.products?.status;
          const isSeller = chat.seller_id === userId;

          const partnerName = isSeller
            ? chat.buyer?.full_name || "Buyer"
            : chat.seller?.full_name || "Seller";

          // Sort messages by created_at desc and pick last one
          const sortedMessages = (chat.messages || [])
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

          const lastMessage = sortedMessages[0];

          // Only unread if there IS a last message
          const isUnread =
            !!lastMessage &&
            lastMessage.sender_id !== userId &&
            lastMessage.read === false;

          const lastMessageTime =
            lastMessage?.created_at || chat.created_at || null;

          return {
            id: chat.id,
            product_id: chat.product_id,
            product_title: productTitle,
            partner_name: partnerName,
            productStatus,
            last_message_content: lastMessage
              ? lastMessage.content || "[Attachment]"
              : "No messages yet",
            last_message_time: lastMessageTime,
            is_unread: isUnread,
          } as ChatListItem;
        })
        // sort chats by last message time desc
        .sort((a, b) => {
          const tA = a.last_message_time
            ? new Date(a.last_message_time).getTime()
            : 0;
          const tB = b.last_message_time
            ? new Date(b.last_message_time).getTime()
            : 0;
          return tB - tA;
        });

      setChats(processedChats);
    } catch (error) {
      console.error("Error fetching inbox chats:", error);
      toast.error("Failed to load your inbox.");
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  if (!currentUserId && !loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Please sign in to view your inbox.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <Loader className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-10 border-b pb-4 border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-indigo-500" />
        Conversations
      </h1>

      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-dashed border-slate-300 dark:border-slate-700">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-600 dark:text-slate-400">
              No active chats
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Start a conversation on a product listing to see it here.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.id}
              to={`/product/${chat.product_id}`}
              state={{ openChatId: chat.id }}
              onClick={(e) => {
                alert(chat.productStatus);
                if (chat.productStatus !== "active") {
                e.preventDefault();
                toast.error("This product is no longer available.");
                }
              }}
              className={`
                flex items-center p-5 rounded-xl shadow-md transition-all duration-200 
                border ${
                  chat.is_unread
                    ? "border-indigo-400 shadow-indigo-200/50"
                    : "border-slate-200 dark:border-slate-700"
                }
                ${
                  chat.is_unread
                    ? "bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60"
                    : "bg-white dark:bg-slate-800 hover:shadow-lg dark:hover:bg-slate-700/50"
                }
              `}
            >
              <div className="flex-1 min-w-0 flex items-center gap-4">
                {/* Partner Icon */}
                <div
                  className={`p-3 rounded-full ${
                    chat.is_unread
                      ? "bg-indigo-200 dark:bg-indigo-700"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  <User
                    className={`w-5 h-5 ${
                      chat.is_unread
                        ? "text-indigo-800 dark:text-indigo-300"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </div>

                <div>
                  {/* Partner Name & Unread Dot */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        chat.is_unread
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {chat.partner_name}
                    </span>
                    {chat.is_unread && (
                      <span
                        className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                        title="New Message"
                      />
                    )}
                  </div>

                  {/* Product Context */}
                  <div className="flex items-center text-sm mt-0.5 text-slate-500 dark:text-slate-400">
                    <Box className="w-4 h-4 mr-1 text-indigo-400/80" />
                    <span className="font-medium">{chat.product_title}</span>
                  </div>

                  {/* Last Message Preview */}
                  <p
                    className={`text-sm mt-1 truncate max-w-md ${
                      chat.is_unread
                        ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {chat.last_message_content}
                  </p>
                </div>
              </div>

              {/* Time Stamp */}
              <div className="flex flex-col items-end shrink-0 ml-4">
                <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                  <Clock className="w-3 h-3 mr-1" />
                  <time>
                    {formatTime(
                      chat.last_message_time as unknown as string
                    )}
                  </time>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
