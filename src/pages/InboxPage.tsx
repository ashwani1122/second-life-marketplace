import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader, MessageSquare } from "lucide-react";

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

export default function InboxPage(): JSX.Element {
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchChats = async () => {
        setLoading(true);
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        alert(userId);
        if (!userId) {
            
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
            .order('created_at', { ascending: false }); 
            alert(rawChats);
        if (chatsError) throw chatsError;

        const processedChats: ChatListItem[] = (rawChats || []).map((chat: any) => {
            const productTitle = chat.products?.title || "Unknown Product";
            const isSeller = chat.seller_id === userId;
            
            // Determine the partner's name
            const partnerName = isSeller 
                ? chat.buyer?.full_name || "Buyer"
                : chat.seller?.full_name || "Seller";
                
            // Find the last message and unread status
            const lastMessage = (chat.messages || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            
            const isUnread = lastMessage && lastMessage.sender_id !== userId && !lastMessage.read;

            return {
                id: chat.id,
                product_id: chat.product_id,
                product_title: productTitle,
                partner_name: partnerName,
                last_message_content: lastMessage?.content || "[Attachment]",
                last_message_time: lastMessage?.created_at || chat.created_at,
                is_unread: isUnread,
            };
            });

            setChats(processedChats);
        } catch (error) {
            console.error("Error fetching inbox chats:", error);
        } finally {
            setLoading(false);
        }
        };

        fetchChats();
    }, []);

    if (!currentUserId) {
        return <div className="p-10 text-center">Please sign in to view your inbox.</div>;
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin w-6 h-6 text-indigo-600" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-indigo-600" />
            Your Inbox
        </h1>
        <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {chats.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
                You don't have any active chats yet.
            </div>
            ) : (
            chats.map((chat) => (
                <Link 
                key={chat.id} 
                // 🎯 KEY STEP: Navigate to the product page with the chat ID in the URL state 🎯
                to={`/product/${chat.product_id}`} 
                state={{ openChatId: chat.id }} 
                className={`flex items-center p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${chat.is_unread ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                    <span className={`font-semibold ${chat.is_unread ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                        {chat.partner_name} 
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        for: {chat.product_title}
                    </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 truncate mt-1">
                    {chat.last_message_content}
                    </p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-4">
                    <time className="text-xs text-slate-400">
                    {new Date(chat.last_message_time).toLocaleDateString()}
                    </time>
                    {chat.is_unread && (
                    <span className="mt-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" title="Unread Message" />
                    )}
                </div>
                </Link>
            ))
            )}
        </div>
        </div>
    );
    }