// src/pages/ProductBookings.tsx (actually your BookingButton file location)
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBooking, getCurrentUserId } from "@/lib/bookings"; // keep using your helper
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // 👈 NEW import

type BookingButtonProps = {
  productId: string;
  sellerId: string;
};

export function BookingButton({ productId, sellerId }: BookingButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");

  const onRequest = async () => {
    setLoading(true);
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        toast.error("Please sign in to request booking.");
        setLoading(false);
        return;
      }

      // OPTIONAL: prevent seller from booking their own product
      if (userId === sellerId) {
        toast.error("You cannot book your own product.");
        setLoading(false);
        return;
      }

      // 1️⃣ CHECK: does this user already have a booking for this product?
      const { data: existingBooking, error: existingErr } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("product_id", productId)
        .eq("buyer_id", userId)
        .in("status", ["pending", "accepted"]) // active bookings
        .maybeSingle();

      if (existingErr) {
        console.warn("Error checking existing booking", existingErr);
      }

      if (existingBooking) {
        // user already has a pending/accepted booking
        toast.warning(
          "You already requested a booking for this product. Please wait for the seller’s response."
        );
        setLoading(false);
        return;
      }

      // 2️⃣ CHECK: is there already an accepted booking for this product?
      const { data: acceptedBooking, error: acceptedErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("product_id", productId)
        .eq("status", "accepted")
        .maybeSingle();

      if (acceptedErr) {
        console.warn("Error checking accepted booking", acceptedErr);
      }

      if (acceptedBooking) {
        // someone else already has an accepted booking
        toast.error("This product is already booked by another buyer.");
        setLoading(false);
        return;
      }

      // 3️⃣ SAFE TO CREATE BOOKING
      const data = await createBooking({
        product_id: productId,
        seller_id: sellerId,
        offered_price: price,
        message,
      });

      if (!data) {
        toast.error("Booking failed. Please try again.");
        setLoading(false);
        return;
      }

      toast.success("Booking requested");
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
        Request Booking
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md z-20">
            <h3 className="text-lg font-bold mb-3">Request Booking</h3>

            <input
              type="number"
              placeholder="Offered price (optional)"
              value={price ?? ""}
              onChange={(e) =>
                setPrice(Number(e.target.value) || undefined)
              }
              className="w-full rounded-md px-3 py-2 mb-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />

            <textarea
              placeholder="Message to seller (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md px-3 py-2 mb-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />

            <div className="flex gap-2">
              <Button onClick={onRequest} disabled={loading}>
                {loading ? "Sending..." : "Send Request"}
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
