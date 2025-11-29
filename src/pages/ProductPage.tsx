// ProductPageWithChat.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  Loader,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Info,
  ShieldCheck,
  Share2,
  MessageSquare,
  Paperclip,
  Send,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/utils/cart";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import type { RealtimeChannel } from "@supabase/supabase-js";
interface Product {
  id: string;
  title: string;
  description: string;
  reason_for_selling: string;
  price: number;
  location: string;
  purchase_date: string | null;
  status: string | null;
  seller_id?: string | null;
  image_url?: string[] | null;
}

type Profile = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  location?: string | null;
};

const ATTACHMENT_BUCKET = "chat-attachments"; // change if needed

const formatCurrency = (value?: number) =>
  value == null
    ? "-"
    : value.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });
type ChatDrawerProps = {
  chatOpen: boolean;
  sellerName?: string | null;
  productTitle?: string | null;
  messages: any[];
  messagesRef: React.RefObject<HTMLDivElement | null>;
  messageText: string;
  setMessageText: (s: string) => void;
  onSendMessage: (
    content?: string,
    attachmentUrl?: string | null
  ) => Promise<void>;
  onAttachFile: (file: File | null) => Promise<void>;
  onClose: () => void;
  typingUsers: Record<string, number>;
  currentUserId: string | null;
  sending: boolean;
  attachmentUploading: boolean;
};

const ChatDrawerInner: React.FC<ChatDrawerProps> = ({
  chatOpen,
  sellerName,
  productTitle,
  messages,
  messagesRef,
  messageText,
  setMessageText,
  onSendMessage,
  onAttachFile,
  onClose,
  typingUsers,
  currentUserId,
  sending,
}) => {
  // debug mount/unmount (you can comment out later)
  useEffect(() => {
    // console.log("ChatDrawer mounted");
    return () => {
      // console.log("ChatDrawer unmounted");
    };
  }, []);

  if (!chatOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        key="chat-drawer"
        initial={{ x: 420 }}
        animate={{ x: 0 }}
        exit={{ x: 420 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full md:w-[420px] z-50 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold">
              Chat with {sellerName ?? "Seller"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {productTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4" ref={messagesRef}>
          {messages.length === 0 ? (
            <div className="text-center text-sm text-slate-500 mt-8">
              No messages yet — say hi 👋
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === currentUserId;
              return (
                <div
                  key={m.id}
                  className={`mb-3 flex ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      mine
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}
                  >
                    {m.attachment_url ? (
                      <a
                        href={m.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block mb-2 underline"
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon /> Attachment
                        </div>
                      </a>
                    ) : null}
                    {m.content ? (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    ) : null}
                    <div className="text-[11px] mt-2 opacity-70 text-right">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString()
                        : ""}{" "}
                      {mine && (m.read ? "✓✓" : "✓")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 pb-2">
          {Object.keys(typingUsers).filter((uid) => uid !== currentUserId)
            .length > 0 && (
            <div className="text-xs text-slate-500 mb-2">Seller is typing…</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  if (!f) return;
                  onAttachFile(f);
                  e.currentTarget.value = "";
                }}
              />
              <Paperclip />
            </label>

            <input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (messageText.trim())
                    onSendMessage(messageText.trim(), null);
                }
              }}
              placeholder="Write a message..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 bg-transparent outline-none text-sm"
            />

            <Button
              size="sm"
              onClick={() => {
                if (messageText.trim()) onSendMessage(messageText.trim(), null);
              }}
              disabled={sending}
            >
              <Send />
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Messages are stored securely. Please avoid sharing sensitive data in
            chat.
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

const ChatDrawer = React.memo(ChatDrawerInner);

/* ---------------------------
  Main Page Component
----------------------------*/
export default function ProductPageWithChat(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  // chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  // local typing debounce (client-only)
  const typingActiveRef = useRef(false);
  const typingTimerRef = useRef<number | null>(null);

  // load product + images + seller + current user
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (prodErr) throw prodErr;
        if (!mounted) return;
        setProduct(prodData as Product);

        const { data: imageRows, error: imagesErr } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id);
        if (imagesErr) throw imagesErr;
        setImages(
          (imageRows || []).map((r: any) => r.image_url).filter(Boolean)
        );
        setIndex(0);

        const sellerId = (prodData as any)?.seller_id;
        if (sellerId) {
          try {
            const { data: profileRow, error: profileErr } = await supabase
              .from<Profile>("profiles")
              .select("id, full_name, phone, avatar_url, location")
              .eq("id", sellerId)
              .single();
            if (!profileErr) setSellerProfile(profileRow ?? null);
            else setSellerProfile(null);
          } catch (err) {
            console.error("seller profile error", err);
            setSellerProfile(null);
          }
        }

        const { data: authData } = await supabase.auth.getUser();
        setCurrentUserId(authData?.user?.id ?? null);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || "Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // keyboard carousel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!images || images.length === 0) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images]);

  const prev = () =>
    images.length > 0 &&
    setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () =>
    images.length > 0 && setIndex((i) => (i + 1) % images.length);

  const handleAdd = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price ?? 0,
      quantity: 1,
    });
    toast.success("Added to cart", {
      description: `${product.title} is now in your cart.`,
    });
  };
  const loadMessages = useCallback(async (cId: string) => {
    try {
      const { data } = await supabase
        .from("messages")
        .select(
          "id, chat_id, sender_id, content, attachment_url, read, created_at"
        )
        .eq("chat_id", cId)
        .order("created_at", { ascending: true })
        .limit(500);
      setMessages(data || []);
      setTimeout(() => {
        if (messagesRef.current)
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }, 60);
    } catch (err) {
      console.error("loadMessages", err);
    }
  }, []);
  const subscribeToMessages = useCallback((cId: string) => {
    // cleanup previous
    try {
      if (messagesChannelRef.current) {
        messagesChannelRef.current.unsubscribe();
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
    } catch (e) {
      console.warn("cleanup messages channel failed", e);
    }

    const channel = supabase
      .channel(`messages-chat-${cId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${cId}`,
        },
        (payload: any) => {
          setMessages((m) => {
            if (m.some((x) => x.id === payload.new.id)) return m;
            return [...m, payload.new];
          });
          setTimeout(() => {
            if (messagesRef.current)
              messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
          }, 60);
        }
      )
      .subscribe();

    messagesChannelRef.current = channel;
  }, []);

  const subscribeToTyping = useCallback((cId: string) => {
    try {
      if (typingChannelRef.current) {
        typingChannelRef.current.unsubscribe();
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    } catch (e) {
      console.warn("cleanup typing channel failed", e);
    }

    const channel = supabase
      .channel(`typing-chat-${cId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_typing",
          filter: `chat_id=eq.${cId}`,
        },
        (payload: any) =>
          setTypingUsers((t) => ({ ...t, [payload.new.user_id]: Date.now() }))
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_typing",
          filter: `chat_id=eq.${cId}`,
        },
        (payload: any) =>
          setTypingUsers((t) => ({ ...t, [payload.new.user_id]: Date.now() }))
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_typing",
          filter: `chat_id=eq.${cId}`,
        },
        (payload: any) =>
          setTypingUsers((t) => {
            const copy = { ...t };
            delete copy[payload.old.user_id];
            return copy;
          })
      )
      .subscribe();

    typingChannelRef.current = channel;
  }, []);

  const markMessagesAsRead = useCallback(
    async (cId: string) => {
      if (!currentUserId) return;
      try {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("chat_id", cId)
          .neq("sender_id", currentUserId);
      } catch (err) {
        console.error("markMessagesAsRead", err);
      }
    },
    [currentUserId]
  );

  useEffect(() => {
    const state = location.state as { openChatId?: string } | undefined;
    const externalChatId = state?.openChatId; // Only run if data is loaded, user is logged in, chat is closed, and we have an ID from navigation

    if (!loading && currentUserId && !chatOpen && externalChatId) {
      const openExistingChat = async () => {
        setChatOpen(true);
        setChatId(externalChatId); // Call your existing chat handling functions
        await loadMessages(externalChatId);
        subscribeToMessages(externalChatId);
        subscribeToTyping(externalChatId);
        markMessagesAsRead(externalChatId);
      };

      openExistingChat();
    }
  }, [
    loading,
    currentUserId,
    location.state,
    loadMessages,
    subscribeToMessages,
    subscribeToTyping,
    markMessagesAsRead,
  ]);

  /* ----------------- CHAT helpers ----------------- */

  // subscribe using supabase.channel (v2)

  const openChat = useCallback(async () => {
    if (!product) return;
    if (!currentUserId) {
      toast.error("Sign in to chat with the seller.");
      return;
    }
    if (product.seller_id === currentUserId) {
      toast("This is your listing.");
      return;
    }

    setChatOpen(true);

    try {
      const sellerId = product.seller_id!;
      const buyerId = currentUserId!;
      const { data: existing, error: findErr } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(product_id.eq.${product.id},seller_id.eq.${sellerId},buyer_id.eq.${buyerId}),and(product_id.eq.${product.id},seller_id.eq.${buyerId},buyer_id.eq.${sellerId})`
        )
        .limit(1);
      if (findErr) throw findErr;

      let idToUse: string | null = null;
      if (existing && existing.length > 0) idToUse = existing[0].id;
      else {
        const { data: newChat, error: chatErr } = await supabase
          .from("chats")
          .insert([
            { product_id: product.id, seller_id: sellerId, buyer_id: buyerId },
          ])
          .select()
          .single();
        if (chatErr) throw chatErr;
        idToUse = newChat.id;
      }

      setChatId(idToUse);
      await loadMessages(idToUse);
      subscribeToMessages(idToUse);
      subscribeToTyping(idToUse);
      markMessagesAsRead(idToUse);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to start chat");
    }
  }, [
    product,
    currentUserId,
    loadMessages,
    subscribeToMessages,
    subscribeToTyping,
    markMessagesAsRead,
  ]);

  const sendMessage = useCallback(
    async (content?: string, attachmentUrl?: string | null) => {
      if (!chatId) return;
      if (!currentUserId) {
        toast.error("Sign in to send messages.");
        return;
      }
      if (!content && !attachmentUrl) return;

      setSending(true);
      try {
        const payload: any = {
          chat_id: chatId,
          sender_id: currentUserId,
          content: content ?? null,
          attachment_url: attachmentUrl ?? null,
        };
        const { data, error } = await supabase
          .from("messages")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        setMessages((m) => [...m, data]);
        setMessageText("");
        setTimeout(() => {
          if (messagesRef.current)
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }, 60);
      } catch (err: any) {
        console.error("sendMessage", err);
        toast.error(err?.message || "Failed to send message");
      } finally {
        setSending(false);
        // clear typing presence when sending
        try {
          await supabase
            .from("chat_typing")
            .delete()
            .match({ chat_id: chatId, user_id: currentUserId });
        } catch {}
        typingActiveRef.current = false;
        if (typingTimerRef.current) {
          window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    },
    [chatId, currentUserId]
  );

  const handleAttachFile = useCallback(
    async (file: File | null) => {
      if (!file || !chatId || !currentUserId) return;
      setAttachmentUploading(true);
      try {
        const ext = file.name.split(".").pop();
        const key = `${chatId}/${currentUserId}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from(ATTACHMENT_BUCKET)
          .upload(key, file, { upsert: true });
        if (uploadErr) {
          if (
            (uploadErr as any).message
              ?.toLowerCase()
              ?.includes("bucket not found") ||
            (uploadErr as any).status === 404
          ) {
            throw new Error(
              `Storage bucket "${ATTACHMENT_BUCKET}" not found. Create it in Supabase Storage or change ATTACHMENT_BUCKET in code.`
            );
          }
          throw uploadErr;
        }
        const { data: pub } = supabase.storage
          .from(ATTACHMENT_BUCKET)
          .getPublicUrl(key);
        const publicUrl =
          (pub as any)?.publicUrl ?? (pub as any)?.public_url ?? null;
        if (!publicUrl)
          throw new Error("Failed to obtain public URL for attachment.");
        await sendMessage("", publicUrl);
      } catch (err: any) {
        console.error("handleAttachFile", err);
        toast.error(err?.message || "Attachment failed");
      } finally {
        setAttachmentUploading(false);
      }
    },
    [chatId, currentUserId, sendMessage]
  );

  // Debounced typing: only send upsert once per burst, and delete after inactivity
  const notifyTypingStart = useCallback(() => {
    if (!chatId || !currentUserId) return;
    // if already active, reset timer only
    if (typingActiveRef.current) {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
      typingTimerRef.current = window.setTimeout(async () => {
        try {
          await supabase
            .from("chat_typing")
            .delete()
            .match({ chat_id: chatId, user_id: currentUserId });
        } catch {}
        typingActiveRef.current = false;
        typingTimerRef.current = null;
      }, 1500);
      return;
    }

    // set typing active and upsert once
    typingActiveRef.current = true;
    (async () => {
      try {
        await supabase
          .from("chat_typing")
          .upsert({
            chat_id: chatId,
            user_id: currentUserId,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error("typing upsert failed", err);
      }
    })();

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    typingTimerRef.current = window.setTimeout(async () => {
      try {
        await supabase
          .from("chat_typing")
          .delete()
          .match({ chat_id: chatId, user_id: currentUserId });
      } catch {}
      typingActiveRef.current = false;
      typingTimerRef.current = null;
    }, 1500);
  }, [chatId, currentUserId]);

  // close chat (cleanup channels)
const closeChat = useCallback(() => {
  // 1. Cleanup Supabase Channels FIRST
    
  const cleanupChannels = () => {
    try {
      if (messagesChannelRef.current) {
        // Unsubscribe and remove the messages channel
        messagesChannelRef.current.unsubscribe();
        supabase.removeChannel(messagesChannelRef.current);
        messagesChannelRef.current = null;
      }
      if (typingChannelRef.current) {
        // Unsubscribe and remove the typing channel
        typingChannelRef.current.unsubscribe();
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
    } catch (e) {
      console.warn("cleanup channels error", e);
    }
  };

  cleanupChannels();

  // 2. Reset All State Variables AFTER Cleanup
  setChatOpen(false); // This is the final step that closes the UI
  setMessages([]);
  setChatId(null);
  setTypingUsers({}); // Make sure to clear any lingering typing users
  
  // 3. Clear local typing state
  typingActiveRef.current = false;
  if (typingTimerRef.current) {
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
  }
}, []);

  // when chat open and chatId changes, mark read and ensure typing subscription live
  useEffect(() => {
    if (!chatOpen || !chatId) return;
    markMessagesAsRead(chatId);
    subscribeToTyping(chatId);
    // no cleanup here; closeChat handles
  }, [chatOpen, chatId, markMessagesAsRead, subscribeToTyping]);

  // input change handler wraps notifyTypingStart
  const onMessageChange = (val: string) => {
    setMessageText(val);
    // only notify if chat open & chatId exists
    if (chatOpen && chatId && currentUserId) notifyTypingStart();
  };

  // initial states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-indigo-600 w-8 h-8" />
          <p className="text-sm text-slate-500 font-medium">
            Loading details...
          </p>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="p-10 text-center text-red-500 bg-red-50 rounded-lg m-10">
        Error: {error}
      </div>
    );
  if (!product)
    return (
      <div className="p-10 text-center text-slate-500">Product not found.</div>
    );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to="/browse"
          className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Browse
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[4/3] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  src={images.length > 0 ? images[index] : "/placeholder.png"}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />
              </AnimatePresence>

              {images.length > 1 && (
                <>
              
                  <button
                    onClick={prev}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95 text-slate-900 dark:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95 text-slate-900 dark:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    {index + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      index === i
                        ? "border-indigo-600 shadow-md scale-105"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${i}`}
                      className="w-full h-full object-cover bg-white dark:bg-slate-900"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="hidden lg:block space-y-6 pt-6">
              <h3 className="text-xl font-bold border-b border-slate-200 dark:border-slate-800 pb-3">
                Description
              </h3>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed text-base">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                    {/* {product.} */}
                  </span>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {product.title}
                  </h1>
                </div>
                <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                  <Share2 size={20} />
                </button>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-lg text-slate-400 line-through font-medium">
                  {formatCurrency((product.price || 0) * 1.2)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    product.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {product.status === "active" ? "Available" : "Sold Out"}
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                  <MapPin size={12} /> {product.location}
                </div>
              </div>
            </div>
            <Separator className="bg-slate-200 dark:bg-slate-800" />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl transition-all hover:scale-[1.02]"
                onClick={handleAdd}
                disabled={product.status !== "active"}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />{" "}
                {product.status === "active" ? "Add to Cart" : "Unavailable"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
              >
                <Heart className="h-5 w-5 text-slate-500 hover:text-red-500 transition-colors" />
              </Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              <ShieldCheck
                className="text-emerald-500 shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Buyer Protection
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your purchase is secured. Funds are held in escrow until you
                  verify the item.
                </p>
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {sellerProfile?.avatar_url ? (
                    <img
                      src={sellerProfile.avatar_url}
                      alt={sellerProfile.full_name || "seller"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {(
                        sellerProfile?.full_name?.charAt(0) || "S"
                      ).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {sellerProfile?.full_name ?? "Seller"}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {sellerProfile?.location ?? "Location hidden"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Contact</div>
                  <div className="text-sm font-medium">
                    {sellerProfile?.phone ?? (
                      <span className="text-xs text-slate-400">Hidden</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={openChat}
                  disabled={
                    !currentUserId || product?.seller_id === currentUserId
                  }
                >
                  <MessageSquare className="mr-2" /> Start Chat
                </Button>
                <Link
                  to={`/seller/${product?.seller_id}`}
                  className="hidden sm:inline-flex"
                >
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </Link>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                <div>Email: Hidden — ask in chat</div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-sm">Item Details</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="grid grid-cols-3 p-4">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Info size={14} /> Condition
                  </span>
                  <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white text-right">
                    Good (Used)
                  </span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar size={14} /> Purchased
                  </span>
                  <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white text-right">
                    {product.purchase_date || "Unknown"}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="text-sm text-slate-500">Reason</span>
                  <span className="col-span-2 text-sm font-medium text-slate-900 dark:text-white text-right">
                    {product.reason_for_selling || "Upgrade"}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-4">
                  <span className="text-sm text-slate-500">Listing ID</span>
                  <span className="col-span-2 text-xs font-mono text-slate-400 text-right truncate pl-4">
                    {product.id}
                  </span>
                </div>
              </div>
            </div>
            <div className="block lg:hidden space-y-4 pt-4">
              <h3 className="font-bold text-lg">Description</h3>
              <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </main>

      <ChatDrawer
        chatOpen={chatOpen}
        sellerName={sellerProfile?.full_name}
        productTitle={product?.title}
        messages={messages}
        messagesRef={messagesRef}
        messageText={messageText}
        setMessageText={onMessageChange}
        onSendMessage={sendMessage}
        onAttachFile={handleAttachFile}
        onClose={closeChat}
        typingUsers={typingUsers}
        currentUserId={currentUserId}
        sending={sending}
        attachmentUploading={attachmentUploading}
      />
    </div>
  );
}
