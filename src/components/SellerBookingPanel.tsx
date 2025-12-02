import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateBookingStatus } from "@/lib/bookings"; // your helper
import { SellerBookingsPanelProps } from "@/types/sellerBookingPanelProps";



export default function SellerBookingsPanel({
  bookings,
  reload,
}: SellerBookingsPanelProps) {
  const accept = async (b: any) => {
    try {
      // --- Preferred: use RPC for atomic accept+reject-other logic ---
      const { error } = await supabase.rpc("seller_accept_booking", {
        p_booking_id: b.id,
        p_seller_id: b.seller_id,
      });

      if (error) {
        console.error("seller_accept_booking error", error);

        // if you created the UNIQUE index (one accepted booking per product)
        // catching duplicate key violation gives a nice UX message:
        if (
          error.code === "23505" ||
          (typeof error.message === "string" &&
            error.message.includes("bookings_one_accepted_per_product"))
        ) {
          toast.error(
            "This product is already booked (another booking was accepted)."
          );
        } else {
          toast.error(error.message || "Failed to accept booking");
        }
        return;
      }

      toast.success("Booking accepted");
      reload();
    } catch (err: any) {
      console.error("accept booking catch", err);
      toast.error(err?.message ?? "Failed to accept booking");
    }
  };

  const reject = async (b: any) => {
    try {
      // Simple reject is fine with your existing helper
      await updateBookingStatus(b.id, "rejected");
      toast.success("Booking rejected");
      reload();
    } catch (err: any) {
      console.error("reject booking catch", err);
      toast.error(err?.message ?? "Failed to reject booking");
    }
  };

  return (
    <div>
      {bookings.map((b) => (
        <div
          key={b.id}
          className="p-3 bg-white dark:bg-slate-800 rounded-lg mb-3 flex items-center justify-between"
        >
          <div>
            <div className="font-semibold">
              {b.products?.title ?? "Product"}
            </div>
            <div className="text-xs text-slate-500">
              By: {b.buyer_id}
            </div>
            <div className="text-sm">
              {b.offered_price
                ? `Offered: $${b.offered_price}`
                : "No price offered"}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {b.status === "pending" && (
              <>
                <Button size="sm" onClick={() => accept(b)}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reject(b)}
                >
                  Reject
                </Button>
              </>
            )}

            {b.status !== "pending" && (
              <div className="text-xs font-medium capitalize">
                {b.status}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
