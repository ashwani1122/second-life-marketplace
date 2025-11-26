import React, { useEffect, useState } from "react";
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
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// --- THEME HOOK (Reused for consistency) ---
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

// --- MOCK DATA ---
const stats = [
  { label: "Total Revenue", value: "₹45,231", change: "+20.1%", trend: "up", icon: Wallet },
  { label: "Active Listings", value: "12", change: "+4", trend: "up", icon: Package },
  { label: "Items Sold", value: "84", change: "+12%", trend: "up", icon: ShoppingBag },
  { label: "Messages", value: "5", change: "-2", trend: "down", icon: MessageSquare },
];

const recentSales = [
  { id: 1, name: "Sony WH-1000XM4", price: "₹12,000", buyer: "Alex M.", status: "Sold", date: "2 mins ago", img: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=100&q=80" },
  { id: 2, name: "Nike Air Jordan 1", price: "₹8,500", buyer: "-", status: "Live", date: "4 hours ago", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&q=80" },
  { id: 3, name: "Vintage Film Camera", price: "₹15,000", buyer: "-", status: "Review", date: "1 day ago", img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100&q=80" },
  { id: 4, name: "Mechanical Keyboard", price: "₹4,200", buyer: "Sarah J.", status: "Sold", date: "2 days ago", img: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=100&q=80" },
];

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
      // else navigate("/auth"); // Uncomment to enforce protection
    });
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, active: true },
    { name: "My Listings", icon: Package, active: false },
    { name: "Messages", icon: MessageSquare, badge: 3, active: false },
    { name: "Wallet", icon: Wallet, active: false },
    { name: "Settings", icon: Settings, active: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans flex transition-colors duration-500">
      
      {/* --- MOBILE SIDEBAR OVERLAY --- */}
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

      {/* --- SIDEBAR --- */}
      <motion.aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-[#0B0F19] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
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

        {/* Navigation */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                item.active 
                  ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon size={18} className={item.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"} />
              {item.name}
              {item.badge && (
                <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.active && (
                <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
            </button>
          ))}
        </div>

        {/* User Profile Snippet Bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
           <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
               {user?.email?.[0].toUpperCase() || "U"}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold truncate">Alex Johnson</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Pro Seller</p>
             </div>
           </div>
           <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors py-2">
             <LogOut size={14} /> Sign Out
           </button>
        </div>
      </motion.aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        {/* Header */}
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
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border-none text-sm w-48 focus:w-64 focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
              />
            </div>
            
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            
            <Button className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 h-9 gap-2 text-xs font-semibold shadow-lg shadow-indigo-500/20">
               <Plus size={14} /> New Listing
            </Button>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, Alex! 👋</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your store today.</p>
            </div>
            <div className="flex gap-2 text-sm font-medium text-slate-500">
               <span>Last 30 Days</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                    <stat.icon size={20} />
                  </div>
                  <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h3>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts & Listings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart Area (Custom Visual) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-lg">Revenue Overview</h2>
                  <p className="text-xs text-slate-500">Monthly earning performance</p>
                </div>
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400"><MoreHorizontal size={18} /></button>
              </div>

              {/* Simple CSS Bar Chart Simulation */}
              <div className="h-64 flex items-end justify-between gap-2 px-2">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                   <div key={i} className="w-full flex flex-col items-center gap-2 group">
                      <div className="relative w-full rounded-t-lg bg-indigo-50 dark:bg-indigo-900/20 h-full overflow-hidden flex items-end group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, ease: "circOut", delay: i * 0.05 }}
                          className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 hidden sm:block">
                        {['J','F','M','A','M','J','J','A','S','O','N','D'][i]}
                      </span>
                   </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Sales List */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <h2 className="font-bold text-lg">Recent Listings</h2>
                 <Link to="/listings" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentSales.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                    <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-200" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.date}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-indigo-600">{item.price}</p>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1
                         ${item.status === 'Sold' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 
                           item.status === 'Live' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 
                           'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                         {item.status}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                <Button variant="outline" className="w-full text-xs h-8 border-slate-200 dark:border-slate-700">
                  Generate Report
                </Button>
              </div>
            </motion.div>
          </div>
          
          {/* Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 sm:p-10 text-white relative overflow-hidden"
          >
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3 border border-white/10">
                      <TrendingUp size={12} /> Pro Seller Tips
                   </div>
                   <h2 className="text-2xl font-bold mb-2">Boost your sales by 30%</h2>
                   <p className="text-indigo-100 max-w-lg">Adding more than 3 high-quality photos increases buyer trust significantly. Try updating your older listings.</p>
                </div>
                <Button className="bg-white text-indigo-600 hover:bg-indigo-50 border-none">
                  Update Listings
                </Button>
             </div>
             {/* Decorative Background Circles */}
             <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
             <div className="absolute bottom-0 left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-2xl" />
          </motion.div>

        </div>
      </main>
    </div>
  );
}