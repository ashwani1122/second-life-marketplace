import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
// Added Menu icon for mobile toggle
import { ShoppingBag, Plus, Home, User, Moon, Sun, Mail, Menu, X } from "lucide-react"; 
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { Input } from "./ui/input";

// ----------------------------------------------------------------
// FIX 1: ProfileModal must be defined OUTSIDE of Navbar. (Kept as is)
// ----------------------------------------------------------------
interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void; // Closure doesn't need to pass a boolean back
    phone: string; // Current phone state from Navbar
    setPhone: (value: string) => void; // Setter for phone
    address: string; // Current address state from Navbar
    setAddress: (value: string) => void; // Setter for address
    onSave: () => Promise<void>; // The save handler
    saveLoading: boolean;
    error: string | null;
}

const ProfileModal = ({
    isOpen,
    onClose,
    phone,
    setPhone,
    address,
    setAddress,
    onSave,
    saveLoading,
    error,
}: ProfileModalProps) => {
    if (!isOpen) return null;

    return (
        // Increased z-index and correct fixed positioning
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center overflow-y-auto">
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-2xl max-w-sm w-full mx-4 my-8">
                <div className="flex flex-col gap-4">
                    <h2 className="text-center text-xl font-bold">
                        Complete Your Profile 📦
                    </h2>
                    <p className="text-sm text-muted-foreground text-center">
                        Please provide your phone and address to proceed to the cart.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone Number (e.g., +1234567890)"
                            required
                        />
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Shipping Address"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <Button
                        onClick={onSave}
                        disabled={saveLoading || !phone.trim() || !address.trim()}
                        className="w-full"
                    >
                        {saveLoading ? "Saving..." : "Save and Continue"}
                    </Button>
                    <Button variant="ghost" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
// ----------------------------------------------------------------

// --- Navbar Component ---
export const Navbar = () => {
    const location = useLocation();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    // NEW STATE FOR MOBILE MENU
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [navbarError, setNavbarError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const unreadCount = useUnreadCount();

    // --- Profile Fetching Logic ---
    const fetchUserAndProfile = useCallback(async () => {
        setLoading(true);
        setNavbarError(null);
        try {
            const { data: authData, error: authErr } = await supabase.auth.getUser();
            if (authErr) throw authErr;
            const authUser = authData.user;
            setUser(authUser);

            if (!authUser) {
                setPhone("");
                setAddress("");
                setLoading(false);
                return;
            }

            const { data: profileRow, error: profileErr } = await supabase
                .from("profiles")
                .select("phone, location")
                .eq("id", authUser.id)
                .single();

            let phoneVal = "";
            let addressVal = "";

            if (profileRow) {
                phoneVal = (profileRow as any).phone ?? "";
                addressVal = (profileRow as any).location ?? "";
            } else if (profileErr && !String((profileErr as any).message || "").toLowerCase().includes("no rows found")) {
                throw profileErr;
            }

            phoneVal = phoneVal || (authUser.user_metadata as any)?.phone || "";
            addressVal = addressVal || (authUser.user_metadata as any)?.address || "";

            setPhone(phoneVal);
            setAddress(addressVal);

        } catch (err: any) {
            console.error("Error fetching user or profile:", err);
            setNavbarError(err?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Profile Completion Save Logic (Upsert) ---
    const handleSaveProfile = async () => {
        if (!phone.trim() || !address.trim() || !user) {
            setModalError("Phone number and address are required.");
            return;
        }

        setSaveLoading(true);
        setModalError(null);

        try {
            const { error: upsertError } = await supabase
                .from("profiles")
                .upsert({
                    id: user.id,
                    phone: phone.trim(),
                    location: address.trim(),
                }, { onConflict: 'id' });

            if (upsertError) throw upsertError;

            setIsModalOpen(false);
            fetchUserAndProfile();

        } catch (err: any) {
            console.error("Error saving profile:", err);
            setModalError(err?.message || "Failed to save profile information.");
        } finally {
            setSaveLoading(false);
        }
    };

    // --- Effects and Handlers ---

    useEffect(() => {
        fetchUserAndProfile();
    }, [fetchUserAndProfile]);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchUserAndProfile();
            } else {
                setPhone("");
                setAddress("");
                setIsModalOpen(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchUserAndProfile]);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("dark");
    };
    
    const handleModalClose = () => {
        setIsModalOpen(false);
        setModalError(null);
    }

    const isActive = (path: string) => location.pathname === path;

    // --- Conditional Cart Link Component ---
    const CartLink = ({ onClick }: { onClick?: () => void }) => {
        if (!user) {
             return (
                <Link to="/auth" onClick={onClick}>
                    <Button variant="ghost" size="sm" className="gap-2 w-full justify-start p-0 h-auto">
                        <ShoppingBag className="h-4 w-4" />
                        Cart (Sign In)
                    </Button>
                </Link>
             );
        }
        
        if (!phone || !address) {
            return (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 text-foreground hover:text-primary w-full justify-start p-0 h-auto"
                    onClick={() => {
                        setIsModalOpen(true);
                        if (onClick) onClick(); // Close menu if provided
                    }}
                >
                    <ShoppingBag className="h-4 w-4" />
                    Cart (Add Details)
                </Button>
            );
        }

        return (
            <Link
                to="/cart"
                onClick={onClick}
                className={`flex items-center gap-2 transition-smooth w-full justify-start ${
                    isActive("/cart") ? "text-primary font-medium" : "text-foreground hover:text-primary"
                }`}
            >
                <ShoppingBag className="h-4 w-4" />
                Cart
            </Link>
        );
    }
    
    // --- Main Render ---
    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4">
                    <div className="flex h-16 items-center justify-between overflow-hidden px-4">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
                            <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                                Nexo
                            </span>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/" className={`flex items-center gap-2 transition-smooth ${isActive("/") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                                <Home className="h-4 w-4" /> Home
                            </Link>
                            <Link to="/browse" className={`flex items-center gap-2 transition-smooth ${isActive("/browse") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                                <ShoppingBag className="h-4 w-4" /> Browse
                            </Link>
                            <Link to="/sell" className={`flex items-center gap-2 transition-smooth ${isActive("/sell") ? "text-primary" : "text-foreground hover:text-primary"}`}>
                                <Plus className="h-4 w-4" /> Sell
                            </Link>
                            <CartLink />
                        </div>

                        {/* Actions & Mobile Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="transition-smooth">
                                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </Button>
                            
                            {/* Mobile Menu Toggle Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </Button>

                            {/* Desktop Auth Links */}
                            <div className="hidden md:flex items-center gap-4">
                                {user ? (
                                    <>
                                        <Link to="/profile">
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <User className="h-4 w-4" /> Profile
                                            </Button>
                                        </Link>
                                        <Link to="/inbox" className="relative">
                                            <Button variant={isActive("/inbox") ? "default" : "outline"} size="sm" className="gap-2">
                                                <Mail className="h-4 w-4" /> Inbox
                                            </Button>
                                            {unreadCount > 0 && (
                                                <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold rounded-full bg-red-600 text-white ring-2 ring-background" title={`${unreadCount} unread message(s)`}>
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    </>
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
                </div>
            </nav>

            {/* Mobile Accordion Menu */}
            <div 
                className={`fixed top-16 left-0 w-full bg-background/95 backdrop-blur border-b border-border shadow-lg z-40 transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
                } md:hidden`}
            >
                <div className="flex flex-col p-4 space-y-2">
                    {/* Navigation Links */}
                    <Link onClick={() => setIsMenuOpen(false)} to="/" className={`flex items-center gap-3 p-2 rounded-lg text-lg ${isActive("/") ? "bg-accent text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                        <Home className="h-5 w-5" /> Home
                    </Link>
                    <Link onClick={() => setIsMenuOpen(false)} to="/browse" className={`flex items-center gap-3 p-2 rounded-lg text-lg ${isActive("/browse") ? "bg-accent text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                        <ShoppingBag className="h-5 w-5" /> Browse
                    </Link>
                    <Link onClick={() => setIsMenuOpen(false)} to="/sell" className={`flex items-center gap-3 p-2 rounded-lg text-lg ${isActive("/sell") ? "bg-accent text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                        <Plus className="h-5 w-5" /> Sell
                    </Link>
                    
                    {/* Cart Link (Re-styled for mobile menu) */}
                    <div className={`flex items-center gap-3 p-2 rounded-lg text-lg ${isActive("/cart") ? "bg-accent font-medium" : "hover:bg-accent"}`}>
                        <CartLink onClick={() => setIsMenuOpen(false)} />
                    </div>

                    <div className="pt-2 border-t border-border mt-2 space-y-2">
                        {/* Auth/Profile Links */}
                        {user ? (
                            <>
                                <Link onClick={() => setIsMenuOpen(false)} to="/profile" className={`flex items-center gap-3 p-2 rounded-lg text-lg ${isActive("/profile") ? "bg-accent text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                                    <User className="h-5 w-5" /> Profile
                                </Link>
                                <Link onClick={() => setIsMenuOpen(false)} to="/inbox" className={`flex items-center justify-between gap-3 p-2 rounded-lg text-lg ${isActive("/inbox") ? "bg-accent text-primary font-medium" : "text-foreground hover:bg-accent"}`}>
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5" /> Inbox
                                    </div>
                                    {unreadCount > 0 && (
                                        <span className="min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold rounded-full bg-red-600 text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Link>
                            </>
                        ) : (
                            <Link onClick={() => setIsMenuOpen(false)} to="/auth">
                                <Button className="w-full gradient-primary">
                                    Sign In
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal remains separate */}
            {user && (
                <ProfileModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    phone={phone}
                    setPhone={setPhone}
                    address={address}
                    setAddress={setAddress}
                    onSave={handleSaveProfile}
                    saveLoading={saveLoading}
                    error={modalError}
                />
            )}
        </>
    );
};