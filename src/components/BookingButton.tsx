// inside ProductPage component (or a new component BookingButton.tsx)
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBooking, getCurrentUserId } from "@/lib/bookings"; // adjust path
import { toast } from "sonner";

export function BookingButton({ productId, sellerId }: { productId: string; sellerId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");

  const onRequest = async () => {
    setLoading(true);
    try {
      const userId = (await getCurrentUserId());
      if (!userId) {
        toast.error("Please sign in to request booking.");
        setLoading(false);
        return;
      }
      const data = await createBooking({
        product_id: productId,
        seller_id: sellerId,
        offered_price: price,
        message,
      });
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
      <Button size="lg" className="w-full" onClick={() => setOpen(true)}>Request Booking</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md z-20">
            <h3 className="text-lg font-bold mb-3">Request Booking</h3>
            <input type="number" placeholder="Offered price (optional)" value={price ?? ""} onChange={(e) => setPrice(Number(e.target.value) || undefined)} className="w-full rounded-md px-3 py-2 mb-2" />
            <textarea placeholder="Message to seller (optional)" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md px-3 py-2 mb-3" />
            <div className="flex gap-2">
              <Button onClick={onRequest} disabled={loading}>{loading ? "Sending..." : "Send Request"}</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
