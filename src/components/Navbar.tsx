import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Home, User, Moon, Sun, Mail, Menu, X } from "lucide-react"; // Import X for close icon
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useUnreadCount } from "@/hooks/useUnreadCount"; 
// ⚠️ ASSUMPTION: You have a Shadcn-style Sheet component available for the mobile menu.
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; 


export const Navbar = () => {
    const location = useLocation();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    // 💡 FIX 1: Add state to control the mobile menu visibility
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

    const unreadCount = useUnreadCount(); 

    // --- Utility Functions ---

    const getLinkClasses = useCallback((path: string) => {
        const isActive = location.pathname === path;
        return `flex items-center gap-2 transition-colors duration-200 ${
            isActive ? "text-primary font-semibold" : "text-foreground/70 hover:text-primary"
        }`;
    }, [location.pathname]);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark");
    };

    // 💡 FIX 2: Close menu whenever the route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]); 

    // --- Effects (Authentication/Theme setup remains the same) ---
    // ... (useEffect for theme and auth setup)

    useEffect(() => {
        // Theme initialization
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        }

        // Authentication status setup
        const fetchUser = async () => {
            const { data: { session } = {} } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        fetchUser();

        // Listener for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- Render ---

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-extrabold text-2xl">
                        <span className="bg-gradient-to-br from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                            Nexo
                        </span>
                    </Link>

                    {/* Navigation Links (Desktop Only) */}
                    {/* These links remain hidden on mobile screens */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                        <Link to="/" className={getLinkClasses("/")}>
                            <Home className="h-4 w-4" /> Home
                        </Link>
                        <Link to="/browse" className={getLinkClasses("/browse")}>
                            <ShoppingBag className="h-4 w-4" /> Browse
                        </Link>
                        <Link to="/sell" className={getLinkClasses("/sell")}>
                            <Plus className="h-4 w-4" /> Sell
                        </Link>
                        <Link to="/cart" className={getLinkClasses("/cart")}>
                             <ShoppingBag className="h-4 w-4" /> Cart
                        </Link>
                    </div>

                    {/* Actions & User Controls (Right side) */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        
                        {/* Theme Toggle Button (Code omitted for brevity, it's correct) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            aria-label="Toggle dark/light theme"
                            className="transition-smooth"
                        >
                            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 fill-yellow-400 stroke-yellow-400" />}
                        </Button>
                        
                        {user ? (
                            // ... (User links/buttons like Profile and Inbox are correct)
                            <div className="flex items-center gap-2 sm:gap-4">
                                {/* INBOX LINK WITH NUMERIC BADGE */}
                                <Link to="/inbox" className="relative">
                                    <Button 
                                        variant={getLinkClasses("/inbox").includes("text-primary") ? "default" : "outline"} 
                                        size="sm" 
                                        className="hidden sm:flex gap-2" 
                                    >
                                        <Mail className="h-4 w-4 sm:mr-1" />
                                        <span className="hidden sm:inline">Inbox</span>
                                    </Button>
                                    <Button 
                                        variant={getLinkClasses("/inbox").includes("text-primary") ? "default" : "outline"} 
                                        size="icon" 
                                        className="sm:hidden" 
                                    >
                                        <Mail className="h-4 w-4" />
                                    </Button>
                                    {unreadCount > 0 && (
                                        <span 
                                            className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold rounded-full bg-red-600 text-white ring-2 ring-background z-10" 
                                            title={`${unreadCount} unread message(s)`}
                                        >
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </Link>
                                {/* Profile Link */}
                                <Link to="/profile">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">Profile</span>
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <Link to="/auth">
                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                    Sign In
                                </Button>
                            </Link>
                        )}

                        {/* 💡 FIX 3: Mobile Menu Trigger Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} // Toggle state
                            aria-expanded={isMobileMenuOpen}
                            aria-controls="mobile-nav-menu"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 💡 FIX 4: Mobile Menu Content (This is the "accordion" part) */}
            {/* Implement using a Tailwind transition or a dedicated Sheet/Drawer component */}
            <div 
                id="mobile-nav-menu"
                className={`absolute left-0 w-full md:hidden bg-background border-t border-border shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
                    isMobileMenuOpen ? 'max-h-screen py-4 opacity-100' : 'max-h-0 py-0 opacity-0'
                }`}
                style={{ zIndex: 40 }} // Ensure it stays above content but below the main nav bar (z-50)
            >
                <div className="flex flex-col gap-4 px-4">
                    {/* Navigation Links (Copied from the hidden desktop menu) */}
                    <Link to="/" className={getLinkClasses("/")} onClick={() => setIsMobileMenuOpen(false)}>
                        <Home className="h-5 w-5" /> Home
                    </Link>
                    <Link to="/browse" className={getLinkClasses("/browse")} onClick={() => setIsMobileMenuOpen(false)}>
                        <ShoppingBag className="h-5 w-5" /> Browse
                    </Link>
                    <Link to="/sell" className={getLinkClasses("/sell")} onClick={() => setIsMobileMenuOpen(false)}>
                        <Plus className="h-5 w-5" /> Sell
                    </Link>
                    <Link to="/cart" className={getLinkClasses("/cart")} onClick={() => setIsMobileMenuOpen(false)}>
                         <ShoppingBag className="h-5 w-5" /> Cart
                    </Link>
                </div>
            </div>
            {/* END Mobile Menu Content */}

        </nav>
    );
};