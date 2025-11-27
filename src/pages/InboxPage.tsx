import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader, MessageSquare, Clock, User, Box } from "lucide-react";

// Simplified type for the list item
interface ChatListItem {
    id: string;
    product_id: string;
    product_title: string;
    partner_name: string;
    last_message_content?: string;
    last_message_time: string;
    is_unread: boolean;
}

// Helper function for time formatting
const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays < 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString();
    }
};

export default function InboxPage(): JSX.Element {
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchChats = useCallback(async () => {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
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
                .select(`
                    id, 
                    product_id, 
                    products(title, seller_id),
                    buyer_id, 
                    seller_id,
                    messages(content, created_at, read, sender_id),
                    buyer:profiles!buyer_id(full_name),
                    seller:profiles!seller_id(full_name)
                `)
                .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                // Order by the creation time of the chat itself, and rely on client-side sorting for messages
                .order('created_at', { ascending: false }); 
                
            if (chatsError) throw chatsError;

            const processedChats: ChatListItem[] = (rawChats || []).map((chat: any) => {
                const productTitle = chat.products?.title || "Unknown Product";
                const isSeller = chat.seller_id === userId;
                
                // Determine the partner's name
                const partnerName = isSeller 
                    ? chat.buyer?.full_name || "Buyer"
                    : chat.seller?.full_name || "Seller";
                    
                // Sort messages by time to get the last one
                const sortedMessages = (chat.messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                const lastMessage = sortedMessages[0];
                
                // Determine unread status: It's unread if the last message was sent by the partner AND is marked false
                const isUnread = lastMessage && lastMessage.sender_id !== userId && !lastMessage.read;

                return {
                    id: chat.id,
                    product_id: chat.product_id,
                    product_title: productTitle,
                    partner_name: partnerName,
                    last_message_content: lastMessage?.content || "[Attachment/Media]",
                    last_message_time: lastMessage?.created_at || chat.created_at,
                    is_unread: isUnread,
                };
            }).sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()); // Sort chats by the time of the *last message*

            setChats(processedChats);
        } catch (error) {
            console.error("Error fetching inbox chats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();
        
        // This subscription would be more complex (listening to messages table, filtered by recipient_id), 
        // but since we are relying on a separate custom hook (useUnreadCount) for the dot,
        // we'll keep the inbox view fetching data periodically or rely on navigation/component mount to refresh.
        // For simplicity and to avoid duplicated logic, we rely on the mount/unmount pattern here.
    }, [fetchChats]);

    if (!currentUserId) {
        return <div className="p-10 text-center text-slate-500">Please sign in to view your inbox.</div>;
    }

    if (loading) {
        return <div className="flex justify-center items-center h-[80vh]"><Loader className="animate-spin w-8 h-8 text-indigo-600" /></div>;
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
                            // Enhanced styling for readability and visual feedback
                            className={`
                                flex items-center p-5 rounded-xl shadow-md transition-all duration-200 
                                border ${chat.is_unread ? 'border-indigo-400 shadow-indigo-200/50' : 'border-slate-200 dark:border-slate-700'}
                                ${chat.is_unread 
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60' 
                                    : 'bg-white dark:bg-slate-800 hover:shadow-lg dark:hover:bg-slate-700/50'
                                }
                            `}
                        >
                            <div className="flex-1 min-w-0 flex items-center gap-4">
                                {/* Partner Icon */}
                                <div className={`p-3 rounded-full ${chat.is_unread ? 'bg-indigo-200 dark:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    <User className={`w-5 h-5 ${chat.is_unread ? 'text-indigo-800 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                                </div>
                                
                                <div>
                                    {/* Partner Name & Unread Dot */}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${chat.is_unread ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                                            {chat.partner_name}
                                        </span>
                                        {chat.is_unread && (
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="New Message" />
                                        )}
                                    </div>

                                    {/* Product Context */}
                                    <div className="flex items-center text-sm mt-0.5 text-slate-500 dark:text-slate-400">
                                        <Box className="w-4 h-4 mr-1 text-indigo-400/80" />
                                        <span className="font-medium">{chat.product_title}</span>
                                    </div>
                                    
                                    {/* Last Message Preview */}
                                    <p className={`text-sm mt-1 truncate max-w-md ${chat.is_unread ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {chat.last_message_content}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Time Stamp */}
                            <div className="flex flex-col items-end shrink-0 ml-4">
                                <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <time>{formatTime(chat.last_message_time)}</time>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}