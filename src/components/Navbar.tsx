import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Home, User, Moon, Sun, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useUnreadCount } from "@/hooks/useUnreadCount"; // 🎯 IMPORT THE NEW HOOK 🎯

export const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // 🎯 USE THE NEW HOOK TO GET UNREAD COUNT 🎯
  const unreadCount = useUnreadCount(); 

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="bg-gradient-to-br from-primary to-accent bg-clip-text">
              Nexo
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/" 
              className={`flex items-center gap-2 transition-smooth ${
                isActive("/") ? "text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link 
              to="/browse" 
              className={`flex items-center gap-2 transition-smooth ${
                isActive("/browse") ? "text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Browse
            </Link>

            <Link 
              to="/sell" 
              className={`flex items-center gap-2 transition-smooth ${
                isActive("/sell") ? "text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <Plus className="h-4 w-4" />
              Sell
            </Link>
            <Link 
              to="/cart"
              className={`flex items-center gap-2 transition-smooth ${
                isActive("/cart") ? "text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="transition-smooth"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              
            </Button>
            {user ? (
              <div className="flex items-center gap-2"> {/* Added flex container for spacing */}
                <Link to="/profile">
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </Link>
                
                {/* 🎯 INBOX LINK WITH BADGE 🎯 */}
                <Link to="/inbox" className="relative">
                  <Button 
                    variant={isActive("/inbox") ? "default" : "outline"} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Inbox
                  </Button>
                  {unreadCount > 0 && (
                    <span 
                        // The badge: red dot, positioned absolutely, rings for visibility
                        className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 bg-red-500 animate-pulse" 
                        title={`${unreadCount} unread message(s)`}
                    />
                  )}
                </Link>

              </div>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="gradient-primary">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};