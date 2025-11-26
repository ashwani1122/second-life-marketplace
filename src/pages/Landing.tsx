import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Shield,
  Zap,
  Search,
  CheckCircle2,
  Menu,
  X,
  MapPin,
  Camera,
  MessageSquare,
  DollarSign,
  Sun,
  Moon,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button"; 
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

// --- CUSTOM HOOK FOR THEME ---
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

// --- FIXED MOVING BORDER COMPONENT ---
// Uses pathLength="1" to ensure the line travels the full perimeter perfectly
const MovingBorder = ({ children, rx = "30px", ry = "30px" }: any) => {
  return (
    <div className="relative p-[1px] overflow-hidden rounded-[2.5rem] group">
       <div className="absolute inset-0 z-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
             <rect
                x="0" y="0" width="100%" height="100%"
                rx={rx} ry={ry}
                fill="none"
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="1"
             />
             <motion.rect
                x="0" y="0" width="100%" height="100%"
                rx={rx} ry={ry}
                fill="none"
                stroke="url(#gradient-border)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0.3, strokeDashoffset: 0 }} // Length of the beam
                animate={{ strokeDashoffset: -1 }} // Negative value moves it clockwise
                transition={{
                   duration: 4,
                   repeat: Infinity,
                   ease: "linear",
                   repeatType: "loop"
                }}
                // This property is magic: it maps the total length to 1
                pathLength={1} 
                strokeDasharray="1" 
             />
             <defs>
                <linearGradient id="gradient-border" x1="0%" y1="0%" x2="100%" y2="0%">
                   <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                   <stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
                   <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
             </defs>
          </svg>
       </div>
       <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] z-10 overflow-hidden h-full">
         {children}
       </div>
    </div>
  );
};

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-indigo-500/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl h-14">
        <div className="container mx-auto px-4 lg:px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShoppingBag size={16} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">Nexo</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/browse" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Browse</Link>
            <Link to="/sell" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Sell</Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button onClick={toggleTheme} className="text-slate-500 hover:text-indigo-500">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to={session ? "/dashboard" : "/auth"}>
              <Button size="sm" className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs px-5 h-8">
                {session ? "Dashboard" : "Get Started"}
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-6 grid lg:grid-cols-2 gap-10 items-center">
          
          {/* Left Text */}
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left z-10">
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-semibold mb-6 border border-indigo-100 dark:border-indigo-800"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Now live in your city
            </motion.div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 text-slate-900 dark:text-white">
              Buy smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">
                Sell instantly.
              </span>
            </h1>
            
            <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Nexo connects you with verified locals to buy and sell pre-loved items securely. No spam, just great deals.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link to="/browse" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-11 px-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                  Start Exploring
                </Button>
              </Link>
              <Link to="/sell" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-8 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                  List Item
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
               <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Verified Profiles</span>
               <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-indigo-500"/> Escrow Safety</span>
            </div>
          </div>

          {/* RIGHT: DYNAMIC CARD VISUAL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative hidden lg:block h-[450px]"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80">
              <MovingBorder>
                <div className="bg-white dark:bg-slate-800 p-4">
                  <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-4 relative overflow-hidden group">
                    <img src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80" alt="Product" className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                       <Zap size={12} className="text-amber-500 fill-amber-500" /> Hot Item
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg">Sony Headphones</h3>
                      <span className="text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/50 px-2 py-0.5 rounded text-sm">₹12,000</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">Active noise cancelling, used for 2 months.</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                      <Button className="flex-1 h-9 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs">Buy Now</Button>
                      <Button variant="outline" className="h-9 w-9 p-0"><MessageSquare size={14}/></Button>
                  </div>
                </div>
              </MovingBorder>
            </div>

            {/* Floating Review Bubble */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-4 left-10 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3 z-20 max-w-[200px]"
            >
               <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">SJ</div>
               <div>
                  <div className="flex text-amber-400 text-[10px] space-x-0.5">
                     {[1,2,3,4,5].map(i => <span key={i}>★</span>)}
                  </div>
                  <p className="text-[10px] font-medium leading-tight">"Sold in 2 hours!"</p>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Balanced Sides) --- */}
      <section className="py-20 bg-white dark:bg-[#0B0F19]">
        <div className="container mx-auto px-4 lg:px-6">
           <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-3">Simple. Fast. Secure.</h2>
              <p className="text-slate-500 dark:text-slate-400">Buying and selling has never been this seamless.</p>
           </div>

           <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-center">
              
              {/* LEFT SIDE: Enhanced with Cards to balance the Right Side */}
              <div className="flex-1 w-full lg:max-w-md space-y-4">
                 {[
                   { icon: Camera, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30", title: "Snap a Photo", desc: "Our AI automatically detects the item and suggests a price." },
                   { icon: MessageSquare, color: "text-pink-600", bg: "bg-pink-100 dark:bg-pink-900/30", title: "Chat Securely", desc: "Discuss details safely. Your phone number stays private." },
                   { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30", title: "Get Paid Instantly", desc: "Hand over the item and receive funds directly to your wallet." }
                 ].map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center gap-5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.bg} ${step.color} shrink-0`}>
                           <step.icon size={22} />
                        </div>
                        <div>
                           <h3 className="font-bold text-lg leading-tight">{step.title}</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{step.desc}</p>
                        </div>
                    </motion.div>
                 ))}
                 
                 <div className="pt-4">
                    <Link to="/sell">
                       <Button size="lg" className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
                          Start Selling Now <ArrowRight size={16} className="ml-2" />
                       </Button>
                    </Link>
                 </div>
              </div>

              {/* RIGHT SIDE: The High Fidelity Phone */}
              <div className="relative z-10 mt-10 lg:mt-0">
                 <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[520px] w-[290px] shadow-2xl flex flex-col overflow-hidden">
                    {/* Phone Status Bar */}
                    <div className="bg-slate-900 h-6 w-full flex items-center justify-between px-4 text-[10px] text-white z-20">
                       <span>9:41</span>
                       <div className="flex gap-1">
                          <div className="w-3 h-2 bg-white rounded-[1px]"/>
                          <div className="w-0.5 h-2 bg-white/50 rounded-[1px]"/>
                       </div>
                    </div>
                    
                    {/* Phone App Content */}
                    <div className="flex-1 bg-white dark:bg-slate-900 relative overflow-hidden flex flex-col">
                       {/* App Header */}
                       <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                          <span className="font-bold text-sm">Create Listing</span>
                          <span className="text-indigo-600 text-xs font-medium">Cancel</span>
                       </div>

                       {/* App Body */}
                       <div className="p-4 space-y-4">
                          {/* Image Upload Area */}
                          <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden">
                             <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover rounded-lg opacity-80" alt="Shoe" />
                          </div>

                          {/* Inputs */}
                          <div className="space-y-2">
                             <div className="h-2 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded"/>
                             <div className="text-sm font-semibold">Nike Air Max 90</div>
                          </div>
                          <div className="space-y-2">
                             <div className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded"/>
                             <div className="text-lg font-bold text-indigo-600">₹8,500</div>
                          </div>
                       </div>

                       {/* App Footer Button */}
                       <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800">
                          <div className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold text-center shadow-lg shadow-indigo-500/30">
                             Publish Listing
                          </div>
                       </div>

                       {/* Animated Notification Popup inside phone */}
                       <motion.div 
                          initial={{ y: 50, opacity: 0 }}
                          whileInView={{ y: 0, opacity: 1 }}
                          transition={{ delay: 1.5, duration: 0.5 }}
                          className="absolute bottom-16 left-4 right-4 bg-emerald-500 text-white p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 shadow-lg"
                       >
                          <CheckCircle2 size={12} /> Listing Live!
                       </motion.div>
                    </div>
                 </div>
                 
                 {/* Decorative blob behind phone */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/20 blur-3xl -z-10 rounded-full" />
              </div>

           </div>
        </div>
      </section>

      {/* --- BENTO GRID FEATURES --- */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 lg:px-6">
           <div className="grid md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[500px]">
              
              {/* Large Box */}
              <div className="md:col-span-2 md:row-span-2 rounded-3xl p-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700" />
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
                         <MapPin size={20} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Hyper-Local Discovery</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                         Our map-first interface shows you items within walking distance. Save on shipping, reduce carbon footprint, and meet neighbors.
                      </p>
                    </div>
                    <div className="mt-8 rounded-xl bg-slate-50 dark:bg-slate-900 h-40 w-full overflow-hidden border border-slate-100 dark:border-slate-700">
                       <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover opacity-80 hover:scale-105 transition-transform duration-700" alt="Map" />
                    </div>
                 </div>
              </div>

              {/* Wide Box Top Right */}
              <div className="md:col-span-2 rounded-3xl p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg relative overflow-hidden group">
                 <div className="relative z-10 flex items-center justify-between h-full">
                    <div>
                       <h3 className="text-lg font-bold mb-1">Instant Chat</h3>
                       <p className="text-indigo-100 text-sm">Negotiate in real-time.</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                       <MessageSquare size={20} />
                    </div>
                 </div>
              </div>

              {/* Small Box 1 */}
              <div className="rounded-3xl p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center hover:border-emerald-500/30 transition-colors">
                 <Shield size={32} className="text-emerald-500 mb-3" />
                 <h3 className="font-bold text-sm">Buyer Protection</h3>
              </div>

              {/* Small Box 2 */}
              <div className="rounded-3xl p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center hover:border-amber-500/30 transition-colors">
                 <Search size={32} className="text-amber-500 mb-3" />
                 <h3 className="font-bold text-sm">Smart Search</h3>
              </div>

           </div>
        </div>
      </section>

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
        <div className="container mx-auto px-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              {/* Column 1: Brand */}
              <div>
                 <Link to="/" className="flex items-center gap-2 mb-4 text-white">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                       <ShoppingBag size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-xl tracking-tight">Nexo</span>
                 </Link>
                 <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                    The safest way to buy and sell locally. Join 20,000+ happy neighbors today.
                 </p>
                 <div className="flex gap-4">
                    <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"><Twitter size={14}/></a>
                    <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"><Instagram size={14}/></a>
                    <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><Facebook size={14}/></a>
                 </div>
              </div>

              {/* Column 2: Marketplace */}
              <div>
                 <h4 className="font-bold text-white mb-4">Marketplace</h4>
                 <ul className="space-y-2 text-sm">
                    <li><Link to="/browse" className="hover:text-white transition-colors">Browse All</Link></li>
                    <li><Link to="/browse?cat=electronics" className="hover:text-white transition-colors">Electronics</Link></li>
                    <li><Link to="/browse?cat=clothing" className="hover:text-white transition-colors">Clothing & Shoes</Link></li>
                    <li><Link to="/browse?cat=home" className="hover:text-white transition-colors">Home & Living</Link></li>
                 </ul>
              </div>

              {/* Column 3: Support */}
              <div>
                 <h4 className="font-bold text-white mb-4">Support</h4>
                 <ul className="space-y-2 text-sm">
                    <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                    <li><Link to="/safety" className="hover:text-white transition-colors">Safety Guide</Link></li>
                    <li><Link to="/rules" className="hover:text-white transition-colors">Community Guidelines</Link></li>
                    <li><Link to="/fees" className="hover:text-white transition-colors">Selling Fees</Link></li>
                 </ul>
              </div>

              {/* Column 4: Newsletter */}
              <div>
                 <h4 className="font-bold text-white mb-4">Stay updated</h4>
                 <p className="text-xs text-slate-400 mb-4">Get the latest trends and deal alerts.</p>
                 <div className="flex gap-2">
                    <input 
                       type="email" 
                       placeholder="Email address" 
                       className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-600 outline-none"
                    />
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Mail size={16}/></Button>
                 </div>
              </div>
           </div>
           
           <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <div>© {new Date().getFullYear()} Nexo Marketplace Inc. All rights reserved.</div>
              <div className="flex gap-6">
                 <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                 <Link to="/terms" className="hover:text-white">Terms of Service</Link>
                 <Link to="/sitemap" className="hover:text-white">Sitemap</Link>
              </div>
           </div>
        </div>
      </footer>

    </div>
  );
}