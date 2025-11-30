// in SellerBookingsPanel.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateBookingStatus } from "@/lib/bookings"; // your helper
// If you created seller_accept_booking SQL function, prefer calling rpc:
// await supabase.rpc("seller_accept_booking", { p_booking_id: bookingId, p_seller_id: sellerId });

export default function SellerBookingsPanel({ bookings, reload }: { bookings: any[]; reload: () => void }) {
  const accept = async (b: any) => {
    try {
      // Prefer RPC to guarantee atomic behavior:
      // await supabase.rpc("seller_accept_booking", { p_booking_id: b.id, p_seller_id: b.seller_id });
      await updateBookingStatus(b.id, "accepted");
      toast.success("Accepted");
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  const reject = async (b: any) => {
    try {
      await updateBookingStatus(b.id, "rejected");
      toast.success("Rejected");
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  };

  return (
    <div>
      {bookings.map((b) => (
        <div key={b.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-between">
          <div>
            <div className="font-semibold">{b.products?.title ?? "Product"}</div>
            <div className="text-xs text-slate-500">By: {b.buyer_id}</div>
            <div className="text-sm">{b.offered_price ? `Offered: ₹${b.offered_price}` : "No price offered"}</div>
          </div>
          <div className="flex gap-2">
            {b.status === "pending" && <>
              <Button size="sm" onClick={() => accept(b)}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => reject(b)}>Reject</Button>
            </>}
            {b.status !== "pending" && <div className="text-xs font-medium">{b.status}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
