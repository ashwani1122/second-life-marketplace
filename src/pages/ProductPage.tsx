
// ProductPageWithChat.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link, useLocation } from "react-router-dom";
import { Phone } from 'lucide-react';
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
    User, // Added User icon for seller avatar placeholder
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/utils/cart";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Profile } from "@/types/Profiletypes";
import { ChatDrawer } from "@/components/ChatDrawerInner";
import { Product } from "@/types/Product";
import { BookingButton } from "@/components/BookingButton";

// --- Type Definitions (No change needed) ---



// type Profile = {
//     id: string;
//     full_name?: string | null;
//     phone?: string | null;
//     avatar_url?: string | null;
//     location?: string | null;
// };

const ATTACHMENT_BUCKET = "chat-attachments";

const formatCurrency = (value?: number) =>
    value == null
        ? "-"
        : value.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });

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

    // ... (Hooks and helper functions like loadProduct, loadMessages, subscribeToMessages, sendMessage, etc., remain the same) ...

    // Only replacing the implementation of openChat, closeChat, and the render block

    // load product + images + seller + current user (rest of the logic remains the same)
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
    
    // loadMessages implementation (remains the same)
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
    
    // subscribeToMessages implementation (remains the same)
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

    // subscribeToTyping implementation (remains the same)
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

    // markMessagesAsRead implementation (remains the same)
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

    // useEffect for external chat ID (remains the same)
    useEffect(() => {
        const state = location.state as { openChatId?: string } | undefined;
        const externalChatId = state?.openChatId;

        if (!loading && currentUserId && !chatOpen && externalChatId) {
            const openExistingChat = async () => {
                setChatOpen(true);
                setChatId(externalChatId);
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
    
    // openChat implementation (remains the same)
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

    // sendMessage implementation (remains the same)
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

    // handleAttachFile implementation (remains the same)
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

    // notifyTypingStart implementation (remains the same)
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

    // closeChat implementation (remains the same)
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

    // when chat open and chatId changes, mark read and ensure typing subscription live (remains the same)
    useEffect(() => {
        if (!chatOpen || !chatId) return;
        markMessagesAsRead(chatId);
        subscribeToTyping(chatId);
        // no cleanup here; closeChat handles
    }, [chatOpen, chatId, markMessagesAsRead, subscribeToTyping]);

    // input change handler wraps notifyTypingStart (updated to use the new setter)
    const onMessageChange = (val: string) => {
        setMessageText(val);
        // only notify if chat open & chatId exists
        if (chatOpen && chatId && currentUserId) notifyTypingStart();
    };

    // --- Render Logic (Beautified) ---

    // initial states
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
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
            <div className="p-10 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl m-10 border border-red-200 dark:border-red-700">
                <p className="text-lg font-semibold">Error Loading Product</p>
                <p className="text-sm mt-2">{error}</p>
            </div>
        );
    if (!product)
        return (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                Product not found.
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Link
                    to="/browse"
                    className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                    <ChevronLeft size={16} /> Back to Browse
                </Link>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    {/* LEFT COLUMN: Image & Details */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Image Carousel */}
                        <div className="relative aspect-[4/3] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl group">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.3 }}
                                    src={
                                        images.length > 0
                                            ? images[index]
                                            : "/placeholder.png"
                                    }
                                    alt={product.title}
                                    className="w-full h-full object-contain p-4"
                                />
                            </AnimatePresence>

                            {images.length > 1 && (
                                <>
                                    {/* Navigation Buttons */}
                                    <button
                                        onClick={prev}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 text-slate-900 dark:text-white ring-4 ring-white/30 dark:ring-slate-900/30"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={next}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 text-slate-900 dark:text-white ring-4 ring-white/30 dark:ring-slate-900/30"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    {/* Counter */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                                        {index + 1} / {images.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Image Thumbnails */}
                        {images.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((img, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setIndex(i)}
                                        className={`relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                            index === i
                                                ? "border-indigo-600 shadow-lg scale-100"
                                                : "border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-indigo-400"
                                        }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`View ${i}`}
                                            className="w-full h-full object-cover bg-white dark:bg-slate-900"
                                        />
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Product Description */}
                        <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                Product Description
                            </h3>
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                                    {product.description}
                                </p>
                            </div>
                        </div>

                        {/* Reason for Selling & Info */}
                        <div className="space-y-4 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                                <div>
                                    <h4 className
                                        ="text-lg font-bold text-slate-800 dark:text-white">
                                        Reason for Selling
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                        {product.reason_for_selling ||
                                            "No specific reason provided."}
                                    </p>
                                </div>
                            </div>
                            <Separator className="bg-slate-200 dark:bg-slate-800" />
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 flex-shrink-0 text-emerald-500 mt-0.5" />
                                <div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                        Purchase Date
                                    </h4>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                                        {product.purchase_date
                                            ? new Date(
                                                  product.purchase_date
                                              ).toLocaleDateString("en-US", {
                                                  year: "numeric",
                                                  month: "long",
                                                  day: "numeric",
                                              })
                                            : "Date unknown"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Price, Actions, Seller */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="space-y-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                            {/* Header & Share */}
                            <div className="flex items-start justify-between">
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
                                    {product.title}
                                </h1>
                                <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <Share2 size={20} />
                                </button>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-3">
                                <span className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className="text-xl text-slate-400 line-through font-medium">
                                    {formatCurrency((product.price || 0) * 1.2)}
                                </span>
                            </div>

                            {/* Status & Location Tags */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                <div
                                    className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${
                                        product.status === "active"
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full bg-current ${
                                            product.status === "active" ? "animate-pulse" : ""
                                        }`}
                                    />
                                    {product.status === "active" ? "Available Now" : "Sold Out"}
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold flex items-center gap-2">
                                    <MapPin size={16} /> {product.location}
                                </div>
                            </div>

                            <Separator className="bg-slate-200 dark:bg-slate-800 my-6" />

                            {/* Action Buttons */}
                            {product.status === "active" ? (
                            <div className="flex flex-col sm:flex-row gap-3">
                                {product.seller_id ===currentUserId &&  product.status === "active" ? null:
                                <div className=" w-full flex gap-3 w-full justify-between ">
                                    <BookingButton productId={product.id!} sellerId={product.seller_id}  />
                                    <Button
                                size="lg"
                                variant="outline"
                                className="h-12 w-full sm:w-auto px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                <Heart className="h-5 w-5 text-slate-500 hover:text-red-500 transition-colors" />
                                </Button>
                                </div>
                                    }

                                
                            </div>
                            ) : (
                            // when not active (sold/booked), hide booking/add-to-cart UI entirely —
                            // keep a small notice so user understands the item isn't available
                            <div className="py-3">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold">
                                <span>Sold Out</span>
                                </div>
                            </div>
                            )}

                            {/* Chat Button */}
                            <motion.button
                                whileHover={{ scale: 1.01, boxShadow: "0 4px 15px rgba(99, 102, 241, 0.4)" }}
                                whileTap={{ scale: 0.99 }}
                                onClick={openChat}
                                disabled={product.seller_id === currentUserId}
                                className={`w-full h-12 flex items-center justify-center gap-3 mt-3 text-base font-semibold border-2 rounded-xl transition-all duration-200
                                ${
                                    product.seller_id === currentUserId
                                        ? "bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed"
                                        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                                }
                                `}
                            >
                                <MessageSquare className="h-5 w-5" />
                                {product.seller_id === currentUserId
                                    ? "This is Your Listing"
                                    : "Chat with Seller"}
                            </motion.button>

                            {product.seller_id === currentUserId && <Link to ={`/product/${product.id}/bookings`} className="w-full h-12 flex items-center justify-center gap-3 mt-3 text-base font-semibold border-2 rounded-xl transition-all duration-200">
                                See all bookings for this product
                            </Link>}
                        </div>
                       
                        {/* Seller Profile Card */}
                        <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
                            <h3 className="text-xl font-bold mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                                Seller Information
                            </h3>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                    {sellerProfile?.avatar_url ? (
                                        <img
                                            src={sellerProfile.avatar_url}
                                            alt={sellerProfile.full_name ?? "Seller"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-lg font-bold">
                                        {product.seller_id === currentUserId ? "You" : sellerProfile?.full_name ?? "Unknown Seller"}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <MapPin size={14} />
                                        {sellerProfile?.location ?? "Location not specified"}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Phone size={14} />
                                        {sellerProfile?.phone ?? "phone no. not specified"}
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                                        <ShieldCheck size={14} /> Verified User
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Chat Drawer Component */}
            <ChatDrawer
                chatOpen={chatOpen}
                sellerName={sellerProfile?.full_name}
                
                sellerAvatarUrl={sellerProfile?.avatar_url}
                productTitle={product.title}
                messages={messages}
                messagesRef={messagesRef}
                messageText={messageText}
                setMessageText={onMessageChange} // Use the new handler
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
