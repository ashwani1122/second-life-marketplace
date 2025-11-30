// src/lib/bookings.ts
import { supabase } from "@/integrations/supabase/client";

/** Create a booking (buyer creates) */
export async function createBooking({
  product_id,
  seller_id,
  offered_price,
  message,
  preferred_date,
  expires_at,
}: {
  product_id: string;
  seller_id: string;
  offered_price?: number;
  message?: string;
  preferred_date?: string; // ISO
  expires_at?: string; // ISO
}) {
  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        product_id,
        seller_id,
        offered_price,
        message,
        preferred_date,
        expires_at,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Seller accepts/updates a booking status */
export async function updateBookingStatus(bookingId: string, status: string) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** List current user's bookings (buyer OR seller) */
export async function listMyBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, products(*)") // include product row; adjust columns
    .or(`buyer_id.eq.${(await getCurrentUserId())},seller_id.eq.${(await getCurrentUserId())}`);
  if (error) throw error;
  return data;
}

/** helper */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

/** Subscribe to realtime notifications for the current user */
export function subscribeNotifications(onNotification: (row: any) => void) {
  const channel = supabase
    .channel(`notifications-user-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        // payload.new contains the inserted notification
        onNotification(payload.new);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
    supabase.removeChannel(channel);
  };
}
