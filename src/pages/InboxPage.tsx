import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader, MessageSquare, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // Recommended for "5 mins ago"

export default function InboxPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setUserId(userData.user.id);

      // Fetch chats where I am either buyer OR seller
      // We also fetch the 'products' details and the 'messages' (latest one)
      const { data, error } = await supabase
        .from("chats")
        .select(`
          id,
          product_id,
          products (title, image_url, price),
          seller:profiles!seller_id(full_name, avatar_url),
          buyer:profiles!buyer_id(full_name, avatar_url),
          messages (content, created_at, read, sender_id)
        `)
        .or(`buyer_id.eq.${userData.user.id},seller_id.eq.${userData.user.id}`)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      
      // Process data to find the "Other Person" and "Last Message"
      const formatted = (data || []).map((chat: any) => {
        const isSeller = chat.seller_id === userData.user?.id;
        const otherUser = isSeller ? chat.buyer : chat.seller;
        
        // Sort messages to find the very last one
        // (Supabase returns arrays, even if we limit, sorting in JS is safer here)
        const lastMsg = chat.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          ...chat,
          otherUser,
          lastMessage: lastMsg,
        };
      });

      setChats(formatted);
      setLoading(false);
    };

    loadChats();
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin"/></div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="space-y-2">
        {chats.map((chat) => (
          <Link 
            key={chat.id} 
            to={`/product/${chat.product_id}`} // Or a dedicated /chat/:id route
            className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                 <img src={chat.otherUser?.avatar_url || "/placeholder-user.jpg"} className="w-full h-full object-cover"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold truncate">{chat.otherUser?.full_name}</h3>
                  {chat.lastMessage && (
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(chat.lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-600 font-medium mb-1">
                  Re: {chat.products?.title}
                </p>
                <p className={`text-sm truncate ${!chat.lastMessage?.read && chat.lastMessage?.sender_id !== userId ? "font-bold text-slate-900" : "text-slate-500"}`}>
                  {chat.lastMessage?.content || "Attachment"}
                </p>
              </div>
              <ChevronRight className="text-slate-300" size={18} />
            </div>
          </Link>
        ))}
        {chats.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <MessageSquare className="mx-auto w-10 h-10 mb-2 opacity-50"/>
            No messages yet.
          </div>
        )}
      </div>
    </div>
  );
}