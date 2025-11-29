import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for redirection
import { supabase } from "@/integrations/supabase/client"; // Added to check session
import { readCart, updateCartItemQuantity, removeFromCart } from "@/utils/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Added for notifications
import { Loader2 } from "lucide-react"; // Added for loading state

export default function CartPage() {
  const [items, setItems] = useState<any[]>(() => readCart());
  const [isAuthChecked, setIsAuthChecked] = useState(false); // Tracks if authentication check is complete
  
  const navigate = useNavigate(); 
  const { toast } = useToast(); 

  // --- Authentication Check ---
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // User is not logged in: show toast and redirect
        toast({
          title: "Login Required",
          description: "You must be logged in to view your cart.",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        // User is authenticated: load cart data
        setItems(readCart()); 
      }
      // Mark check as complete whether logged in or not (for rendering logic)
      setIsAuthChecked(true);
    };

    checkAuth();
  }, [navigate, toast]); 

  const setQty = (id: string, qty: number) => {
    updateCartItemQuantity(id, qty);
    setItems(readCart());
  };
  
  const remove = (id: string) => {
    removeFromCart(id);
    setItems(readCart());
  };

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  // Show a loading indicator until the authentication check is complete
  if (!isAuthChecked) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Checking authentication...</span>
      </div>
    );
  }

  // If auth check failed, navigation handled the redirect, so this component will not fully render.
  // If we reach here, the user is authenticated (or we are in a testing scenario).

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your cart</h1>
      {items.length === 0 ? (
        <div className="text-slate-500 dark:text-slate-400 ">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between bg-white p-4 rounded shadow dark:bg-slate-800">
              <div>
                <div className="font-medium ">{it.title}</div>
                <div className="text-sm text-slate-500">₹{it.price.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-1 dark:bg-slate-800"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value)))}
                />
                <Button variant="ghost" onClick={() => remove(it.id)}>Remove</Button>
              </div>
            </div>
          ))}
          <div className="text-right">
            <div className="text-xl font-bold">Total: ₹{total.toLocaleString()}</div>
            <Button className="mt-2">Proceed to Checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
}