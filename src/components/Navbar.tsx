// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Plus,
  Home,
  User,
  Moon,
  Sun,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { ProfileModal } from "./ProfileModal";

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [pendingNavToSell, setPendingNavToSell] = useState(false);

  const unreadCount = useUnreadCount();

  // fetch user + cached profile for navbar (keeps UI snappy)
  const fetchUserAndProfile = useCallback(async () => {
    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const authUser = authData.user;
      setUser(authUser);

      if (!authUser) {
        setPhone("");
        setAddress("");
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
      } else if (
        profileErr &&
        !String((profileErr as any).message || "")
          .toLowerCase()
          .includes("no rows found")
      ) {
        throw profileErr;
      }

      phoneVal = phoneVal || (authUser.user_metadata as any)?.phone || "";
      addressVal = addressVal || (authUser.user_metadata as any)?.address || "";

      setPhone(phoneVal);
      setAddress(addressVal);
    } catch (err: any) {
      console.error("Error fetching user or profile:", err);
    } 
  }, []);

  // NEW: fresh-check profile from DB at click time
  const ensureProfileComplete = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      if (!userId) return { complete: false, phone: "", address: "" };

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("phone, location")
        .eq("id", userId)
        .single();

      let phoneVal = profileRow?.phone ?? "";
      let addressVal = profileRow?.location ?? "";

      if (!phoneVal || !addressVal) {
        const { data: authAgain } = await supabase.auth.getUser();
        const meta = (authAgain?.user?.user_metadata as any) ?? {};
        phoneVal = phoneVal || meta.phone || "";
        addressVal = addressVal || meta.address || "";
      }

      const complete = Boolean(phoneVal?.trim() && addressVal?.trim());
      return { complete, phone: phoneVal, address: addressVal, userId };
    } catch (err) {
      console.error("ensureProfileComplete error", err);
      return { complete: false, phone: "", address: "" };
    }
  }, []);

  // handle saving profile (used by modal)
  const handleSaveProfile = async () => {
    if (!phone.trim() || !address.trim() || !user) {
      setModalError("Phone number and address are required.");
      return;
    }

    setSaveLoading(true);
    setModalError(null);

    try {
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          phone: phone.trim(),
          location: address.trim(),
        },
        { onConflict: "id" }
      );

      if (upsertError) throw upsertError;

      setIsModalOpen(false);
      await fetchUserAndProfile();

      // if user clicked Sell earlier, navigate now
      if (pendingNavToSell) {
        setPendingNavToSell(false);
        navigate("/sell");
      }
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setModalError(err?.message || "Failed to save profile information.");
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndProfile();
  }, [fetchUserAndProfile]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setPendingNavToSell(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // NEW: handler for Sell (desktop + mobile)
  const handleSellClick = useCallback(
    async (opts?: { fromMobile?: boolean }) => {
      if (opts?.fromMobile) setIsMenuOpen(false);

      // Check auth state
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      if (!userId) {
        navigate("/auth");
        return;
      }

      // Fresh-check profile from DB
      const {
        complete,
        phone: freshPhone,
        address: freshAddress,
      } = await ensureProfileComplete();
      console.log("handleSellClick profile check", {
        complete,
        freshPhone,
        freshAddress,
      });

      if (!complete) {
        // populate local form values with freshest values and open modal
        setPhone(freshPhone || "");
        setAddress(freshAddress || "");
        setPendingNavToSell(true);
        setIsModalOpen(true);
        return;
      }

      // profile complete -> navigate
      navigate("/sell");
    },
    [ensureProfileComplete, navigate]
  );

  return (
    <>
      <div className="h-16">
        <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between overflow-hidden px-4">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 font-bold text-xl"
              >
                <span className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                  Nexo
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  to="/"
                  className={`flex items-center gap-2 transition-smooth ${
                    isActive("/")
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  <Home className="h-4 w-4" /> Home
                </Link>

                <Link
                  to="/browse"
                  className={`flex items-center gap-2 transition-smooth ${
                    isActive("/browse")
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  Browse
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 transition-smooth ${
                    isActive("/dashboard")
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" /> Dashboard
                </Link>
                {/* SELL: replaced Link with handler button */}
                <button
                  onClick={() => handleSellClick({ fromMobile: false })}
                  className={`flex items-center gap-2 transition-smooth ${
                    isActive("/sell")
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  <Plus className="h-4 w-4" /> Sell
                </button>

                {/* <CartLink /> */}
              </div>

              {/* Actions & Mobile Menu Toggle */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="transition-smooth"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>

                <div className="hidden md:flex items-center gap-4">
                  {user ? (
                    <>
                      <Link to="/profile">
                        <Button variant="outline" size="sm" className="gap-2">
                          <User className="h-4 w-4" /> Profile
                        </Button>
                      </Link>
                      <Link to="/inbox" className="relative">
                        <Button
                          variant={isActive("/inbox") ? "default" : "outline"}
                          size="sm"
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" /> Inbox
                        </Button>
                        {unreadCount > 0 && (
                          <span
                            className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 min-w-[20px] h-5 px-1 flex items-center justify-center text-xs font-bold rounded-full bg-red-600 text-white ring-2 ring-background"
                            title={`${unreadCount} unread message(s)`}
                          >
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
      </div>

      {/* Mobile Accordion Menu */}
      <div
        className={`fixed top-16 left-0 w-full bg-background/95 backdrop-blur border-b border-border shadow-lg z-40 transition-all duration-300 ease-in-out ${
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        } md:hidden`}
      >
        <div className="flex flex-col p-4 space-y-2">
          <Link
            onClick={() => setIsMenuOpen(false)}
            to="/"
            className={`flex items-center gap-3 p-2 rounded-lg text-lg ${
              isActive("/")
                ? "bg-accent text-primary font-medium"
                : "text-foreground hover:bg-accent"
            }`}
          >
            <Home className="h-5 w-5" /> Home
          </Link>

          <Link
            onClick={() => setIsMenuOpen(false)}
            to="/browse"
            className={`flex items-center gap-3 p-2 rounded-lg text-lg ${
              isActive("/browse")
                ? "bg-accent text-primary font-medium"
                : "text-foreground hover:bg-accent"
            }`}
          >
            <ShoppingBag className="h-5 w-5" /> Browse
          </Link>

          {/* Mobile Sell uses same handler */}
          <button
            onClick={() => handleSellClick({ fromMobile: true })}
            className={`flex items-center gap-3 p-2 rounded-lg text-lg ${
              isActive("/sell")
                ? "bg-accent text-primary font-medium"
                : "text-foreground hover:bg-accent"
            }`}
          >
            <Plus className="h-5 w-5" /> Sell
          </button>

          <div
            className={`flex items-center gap-3 p-2 rounded-lg text-lg ${
              isActive("/cart") ? "bg-accent font-medium" : "hover:bg-accent"
            }`}
          >
            {/* <CartLink onClick={() => setIsMenuOpen(false)} /> */}
          </div>

          <div className="pt-2 border-t border-border mt-2 space-y-2">
            {user ? (
              <>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/profile"
                  className={`flex items-center gap-3 p-2 rounded-lg text-lg ${
                    isActive("/profile")
                      ? "bg-accent text-primary font-medium"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <User className="h-5 w-5" /> Profile
                </Link>
                <Link
                  onClick={() => setIsMenuOpen(false)}
                  to="/inbox"
                  className={`flex items-center justify-between gap-3 p-2 rounded-lg text-lg ${
                    isActive("/inbox")
                      ? "bg-accent text-primary font-medium"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
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
                <Button className="w-full gradient-primary">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
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
