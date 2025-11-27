// Dashboard.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  Sun,
  Moon,
  Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Separator } from "@/components/ui/separator";

/* Theme hook (unchanged) */
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme-preference");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme-preference", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  return { theme, toggleTheme };
}

/* Component */
export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [soldCount, setSoldCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // channels refs for cleanup
  const productsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // get current user
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!mounted) return;
      if (u) {
        setUser(u);
        setCurrentUserId(u.id);
      } else {
        setUser(null);
        setCurrentUserId(null);
        // optional: redirect if not authed
        // navigate("/auth");
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Fetch dashboard data when we have a current user
  useEffect(() => {
    if (!currentUserId) {
      // reset UI when not logged in
      setListings([]);
      setRecentListings([]);
      setActiveCount(0);
      setSoldCount(0);
      setRevenue(0);
      setUnreadMessagesCount(0);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const fetchAll = async () => {
      try {
        // 1) Fetch all listings for this seller
        const { data: listingsData, error: listingsErr } = await supabase
          .from("products")
          .select("id,title,price,status,created_at,image_url")
          .eq("seller_id", currentUserId)
          .order("created_at", { ascending: false });
        if (listingsErr) throw listingsErr;
        if (!mounted) return;
        setListings(listingsData ?? []);

        // 2) derive counts & revenue
        const active = (listingsData || []).filter((l: any) => l.status === "active").length;
        const sold = (listingsData || []).filter((l: any) => l.status === "sold").length;
        const rev = (listingsData || []).filter((l: any) => l.status === "sold").reduce((acc: number, cur: any) => acc + (Number(cur.price) || 0), 0);
        setActiveCount(active);
        setSoldCount(sold);
        setRevenue(rev);

        // 3) recent listings (top 6)
        setRecentListings((listingsData ?? []).slice(0, 6));

        // 4) unread messages count:
        //    Find chats where seller is currentUserId, then count messages in those chats that are unread and not sent by currentUserId.
        const { data: sellerChats } = await supabase.from("chats").select("id").or(`seller_id.eq.${currentUserId},buyer_id.eq.${currentUserId}`);
        const chatIds = (sellerChats || []).map((c: any) => c.id);
        if (chatIds.length > 0) {
          const { data: unreadRows } = await supabase
            .from("messages")
            .select("id")
            .in("chat_id", chatIds)
            .eq("read", false)
            .neq("sender_id", currentUserId);
          setUnreadMessagesCount((unreadRows || []).length);
        } else {
          setUnreadMessagesCount(0);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [currentUserId]);

  // Realtime subscriptions: products (seller's listings) and messages (incoming to seller)
  useEffect(() => {
    // cleanup any previous
    const cleanup = async () => {
      try {
        if (productsChannelRef.current) {
          productsChannelRef.current.unsubscribe();
          supabase.removeChannel(productsChannelRef.current);
          productsChannelRef.current = null;
        }
        if (messagesChannelRef.current) {
          messagesChannelRef.current.unsubscribe();
          supabase.removeChannel(messagesChannelRef.current);
          messagesChannelRef.current = null;
        }
      } catch (e) {
        console.warn("cleanup channels error", e);
      }
    };

    // if no current user, nothing to subscribe
    if (!currentUserId) {
      cleanup();
      return;
    }

    // 1) Subscribe to products changes for this seller (INSERT/UPDATE/DELETE)
    try {
      const productsChannel = supabase
        .channel(`prod-seller-${currentUserId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products", filter: `seller_id=eq.${currentUserId}` },
          (payload: any) => {
            // payload.eventType: INSERT / UPDATE / DELETE
            // To keep it simple: re-fetch listings & aggregate values (cheap for most sellers)
            (async () => {
              try {
                const { data: listingsData } = await supabase
                  .from("products")
                  .select("id,title,price,status,created_at,image_url")
                  .eq("seller_id", currentUserId)
                  .order("created_at", { ascending: false });
                setListings(listingsData ?? []);
                setRecentListings((listingsData ?? []).slice(0, 6));
                setActiveCount((listingsData || []).filter((l: any) => l.status === "active").length);
                setSoldCount((listingsData || []).filter((l: any) => l.status === "sold").length);
                setRevenue((listingsData || []).filter((l: any) => l.status === "sold").reduce((acc: number, cur: any) => acc + (Number(cur.price) || 0), 0));
              } catch (err) {
                console.error("re-fetch listings after product change failed", err);
              }
            })();
          }
        )
        .subscribe();
      productsChannelRef.current = productsChannel;
    } catch (e) {
      console.warn("subscribe products failed", e);
    }

    // 2) Subscribe to messages table globally, but only react when the new message belongs to a chat whose seller is currentUserId.
    //    This keeps us notified instantly when someone messages the owner.
    try {
      const messagesChannel = supabase
        .channel(`messages-global-${currentUserId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload: any) => {
            try {
              const msg = payload.new;
              if (!msg) return;

              // quick guard — ignore if sender is current user
              if (msg.sender_id === currentUserId) return;

              // fetch chat to see seller_id
              const { data: chatRow, error: chatErr } = await supabase.from("chats").select("id,seller_id,product_id").eq("id", msg.chat_id).single();
              if (chatErr || !chatRow) return;

              if (chatRow.seller_id === currentUserId) {
                // increment unread badge
                setUnreadMessagesCount((c) => c + 1);

                // Optionally pull latest chats/messages for UI updates — here we only notify
                toast.success("New message from a buyer", { description: `Product ID ${chatRow.product_id || ""}` });
              }
            } catch (err) {
              console.error("messages subscription handler error", err);
            }
          }
        )
        .subscribe();

      messagesChannelRef.current = messagesChannel;
    } catch (e) {
      console.warn("subscribe messages failed", e);
    }

    // cleanup on unmount or user change
    return () => {
      cleanup();
    };
  }, [currentUserId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, active: true },
    { name: "My Listings", icon: Package, active: false },
    { name: "Messages", icon: MessageSquare, badge: unreadMessagesCount, active: false },
    { name: "Wallet", icon: Wallet, active: false },
    { name: "Settings", icon: Settings, active: false },
  ];

  // format revenue for display
  const revenueStr = useMemo(() => {
    return revenue.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  }, [revenue]);

  // Stats array built from live values
  const stats = [
    { label: "Total Revenue", value: revenueStr, change: "+20.1%", trend: "up", icon: Wallet },
    { label: "Active Listings", value: String(activeCount), change: `${activeCount >= 0 ? "+" : ""}${activeCount}`, trend: "up", icon: Package },
    { label: "Items Sold", value: String(soldCount), change: `${soldCount >= 0 ? "+" : ""}${soldCount}`, trend: "up", icon: ShoppingBag },
    { label: "Messages", value: String(unreadMessagesCount), change: "-2", trend: "down", icon: MessageSquare },
  ];

  // loading fallbacks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-indigo-600 w-8 h-8" />
          <p className="text-sm text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-500">
      {/* mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800/50">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShoppingBag size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Nexo</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${item.active ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
            >
              <item.icon size={18} className={item.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} />
              {item.name}
              {item.badge && (
                <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.active && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.email ?? "Seller"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pro Seller</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors py-2">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 h-16 px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-indigo-600">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center text-sm text-slate-500">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors">Dashboard</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-slate-900 dark:text-white">Overview</span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border-none text-sm w-48 focus:w-64 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none" />
            </div>

            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Notifications">
              <Bell size={18} />
              {unreadMessagesCount > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
            </button>

            <Button className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 h-9 gap-2 text-xs font-semibold shadow-lg shadow-indigo-500/20">
              <Plus size={14} /> New Listing
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : "!"} 👋</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your store today.</p>
            </div>
            <div className="flex gap-2 text-sm font-medium text-slate-500">
              <span>Last 30 Days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                    <stat.icon size={20} />
                  </div>
                  <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-lg">Revenue Overview</h2>
                  <p className="text-xs text-slate-500">Monthly earning performance</p>
                </div>
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400"><MoreHorizontal size={18} /></button>
              </div>

              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                  <div key={i} className="w-full flex flex-col items-center gap-2 group">
                    <div className="relative w-full rounded-t-lg bg-indigo-50 dark:bg-indigo-900/20 h-full overflow-hidden flex items-end group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 1, ease: "circOut", delay: i * 0.05 }} className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 hidden sm:block">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="font-bold text-lg">Recent Listings</h2>
                <Link to="/listings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
              </div>

              <div className="flex-1 overflow-y-auto">
                {recentListings.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">No listings yet — create your first one!</div>
                ) : (
                  recentListings.map((item: any) => (
                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                      <img src={Array.isArray(item.image_url) ? item.image_url[0] ?? "/placeholder.png" : item.image_url ?? "/placeholder.png"} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-slate-200" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{item.title}</h4>
                        <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600">₹{Number(item.price || 0).toLocaleString()}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${item.status === 'sold' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : item.status === 'active' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {item.status ?? "—"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                <Button variant="outline" className="w-full text-xs h-8 border-slate-200 dark:border-slate-700">Generate Report</Button>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 sm:p-10 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/10">
                  <TrendingUp size={12} /> Pro Seller Tips
                </div>
                <h2 className="text-2xl font-bold mb-2">Boost your sales by 30%</h2>
                <p className="text-indigo-100 max-w-lg">Adding more than 3 high-quality photos increases buyer trust significantly. Try updating your older listings.</p>
              </div>
              <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-none">Update Listings</Button>
            </div>
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
