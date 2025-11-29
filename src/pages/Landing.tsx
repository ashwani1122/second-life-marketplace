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
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import HeroSection from "@/components/heropage";
import { FeatureGrid } from "@/components/Featurecard";

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

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  return { theme, toggleTheme };
}

// --- FIXED MOVING BORDER COMPONENT ---
// Uses pathLength="1" to ensure the line travels the full perimeter perfectly
const MovingBorder = ({ children, rx = "30px", ry = "30px" }: any) => {
  return (
    <div className="relative p-[1px] overflow-hidden rounded-[2.5rem] group">
      <div className="absolute inset-0 z-0">
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx={rx}
            ry={ry}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="1"
          />
          <motion.rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx={rx}
            ry={ry}
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
              repeatType: "loop",
            }}
            // This property is magic: it maps the total length to 1
            pathLength={1}
            strokeDasharray="1"
          />
          <defs>
            <linearGradient
              id="gradient-border"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
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
  const [session, setSession] = useState<boolean>(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#080D1F] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-indigo-500/30">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden w-full">
        <div className="container  gap-10 items-center w-full">
          {/* Left Text */}
          <div className="text-center lg:text-left ">
            <HeroSection />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Balanced Sides) --- */}
      <section className="py-20 bg-white dark:bg-[#0B0F19]">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3  sm:text-6xl">Simple. Fast. Secure.</h2>
            <p className="mx-auto text-center text-lg font-medium tracking-tight md:text-xl">
              Buying and selling has never been this seamless.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-40 items-center justify-center">
            {/* LEFT SIDE: Enhanced with Cards to balance the Right Side */}
            <div className="flex-1 w-full lg:max-w-md space-y-4">
              {[
                {
                  icon: Camera,
                  color: "text-indigo-600",
                  bg: "bg-indigo-100 dark:bg-indigo-900/30",
                  title: "Snap a Photo",
                  desc: "Our AI automatically detects the item and suggests a price.",
                },
                {
                  icon: MessageSquare,
                  color: "text-pink-600",
                  bg: "bg-pink-100 dark:bg-pink-900/30",
                  title: "Chat Securely",
                  desc: "Discuss details safely. Your phone number stays private.",
                },
                {
                  icon: DollarSign,
                  color: "text-emerald-600",
                  bg: "bg-emerald-100 dark:bg-emerald-900/30",
                  title: "Get Paid Instantly",
                  desc: "Hand over the item and receive funds directly to your wallet.",
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.bg} ${step.color} shrink-0`}
                  >
                    <step.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}

              <div className="pt-4">
                <Link to="/sell">
                  <Button
                    size="lg"
                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                  >
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
                    <div className="w-3 h-2 bg-white rounded-[1px]" />
                    <div className="w-0.5 h-2 bg-white/50 rounded-[1px]" />
                  </div>
                </div>

                {/* Phone App Content */}
                <div className="flex-1 bg-white dark:bg-slate-900 relative overflow-hidden flex flex-col">
                  {/* App Header */}
                  <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-sm">Create Listing</span>
                    <span className="text-indigo-600 text-xs font-medium">
                      Cancel
                    </span>
                  </div>

                  {/* App Body */}
                  <div className="p-4 space-y-4">
                    {/* Image Upload Area */}
                    <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80"
                        className="w-full h-full object-cover rounded-lg opacity-80"
                        alt="Shoe"
                      />
                    </div>

                    {/* Inputs */}
                    <div className="space-y-2">
                      <div className="h-2 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded" />
                      <div className="text-sm font-semibold">
                        Nike Air Max 90
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-8 bg-slate-100 dark:bg-slate-800 rounded" />
                      <div className="text-lg font-bold text-indigo-600">
                        ₹8,500
                      </div>
                    </div>
                  </div>

                  {/* App Footer Button */}
                  <div className="  border-t border-slate-100 dark:border-slate-800 mb-20 px-4 py-1 ">
                    <div className="w-full  bg-indigo-600 text-white rounded-xl py-1  px-3 flex items-center justify-center">
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
      <FeatureGrid/>
      <section className="py-16 md:py-24 bg-background dark:bg-gray-900">
  {/* Container for content centralization and max-width */}
  <div className="container mx-auto px-4 max-w-7xl">
    <div className="flex flex-col items-center justify-center text-center">
      {/* Title with enhanced styling and spacing */}
      <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tighter sm:text-6xl md:text-7xl mb-12 text-gray-900 dark:text-white">
        How It <span className="text-primary dark:text-indigo-400">Works</span>
      </h1>
      
      {/* Video container with responsiveness and visual flair */}
      <div className="w-full max-w-5xl">
        <video 
          autoPlay 
          loop 
          muted 
          className="w-full h-auto rounded-3xl shadow-2xl shadow-indigo-500/40 border-4 border-indigo-200/50 dark:border-indigo-800/50 transition-all duration-300 hover:shadow-indigo-500/60"
        >
          {/* NOTE: Ensure 'howitworks.mp4' is accessible via the /videos/ path in your public directory */}
          <source src="/howitworks.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
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
                The safest way to buy and sell locally. Join 20,000+ happy
                neighbors today.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
                >
                  <Twitter size={14} />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-colors"
                >
                  <Instagram size={14} />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Facebook size={14} />
                </a>
              </div>
            </div>

            {/* Column 2: Marketplace */}
            <div>
              <h4 className="font-bold text-white mb-4">Marketplace</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/browse"
                    className="hover:text-white transition-colors"
                  >
                    Browse All
                  </Link>
                </li>
                <li>
                  <Link
                    to="/browse?cat=electronics"
                    className="hover:text-white transition-colors"
                  >
                    Electronics
                  </Link>
                </li>
                <li>
                  <Link
                    to="/browse?cat=clothing"
                    className="hover:text-white transition-colors"
                  >
                    Clothing & Shoes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/browse?cat=home"
                    className="hover:text-white transition-colors"
                  >
                    Home & Living
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    to="/safety"
                    className="hover:text-white transition-colors"
                  >
                    Safety Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/rules"
                    className="hover:text-white transition-colors"
                  >
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fees"
                    className="hover:text-white transition-colors"
                  >
                    Selling Fees
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h4 className="font-bold text-white mb-4">Stay updated</h4>
              <p className="text-xs text-slate-400 mb-4">
                Get the latest trends and deal alerts.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm w-full focus:ring-2 focus:ring-indigo-600 outline-none"
                />
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Mail size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Nexo Marketplace Inc. All rights
              reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="hover:text-white">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
