// src/lib/bookings.ts
import { supabase } from "@/integrations/supabase/client";

/**
 * Booking helper library
 * - createBooking requires an authenticated user and will set buyer_id explicitly
 * - listMyBookings returns bookings where the current user is buyer or seller
 * - subscribeNotifications invokes callback only for notifications targeting current user
 */

/** helper: returns current user's id or null */
export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getCurrentUserId error:", error);
    return null;
  }
  return data?.user?.id ?? null;
}

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
  // ensure caller is authenticated and set buyer_id explicitly
  const buyer_id = await getCurrentUserId();
  if (!buyer_id) throw new Error("Not authenticated");

  const insertRow = {
    product_id,
    seller_id,
    buyer_id,
    offered_price: offered_price ?? null,
    message: message ?? null,
    preferred_date: preferred_date ?? null,
    expires_at: expires_at ?? null,
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert([insertRow])
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
  const userId = await getCurrentUserId();
  if (!userId) return []; // not logged in

  const { data, error } = await supabase
    .from("bookings")
    // include related product row; adjust columns as needed
    .select("*, products(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/** Subscribe to realtime notifications for the current user.
 *  onNotification will be called only for notifications.row.user_id === currentUserId
 *  Returns an unsubscribe function.
 */
export async function subscribeNotifications(onNotification: (row: any) => void) {
  const userId = await getCurrentUserId();
  if (!userId) {
    console.warn("subscribeNotifications: no authenticated user");
    return () => {};
  }

  const channel = supabase
    .channel(`notifications-user-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        const row = payload.new;
        if (!row) return;
        // only forward notifications targeting the current user
        if (row.user_id === userId) onNotification(row);
      }
    )
    .subscribe();

  return () => {
    try {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    } catch (err) {
      console.warn("unsubscribe notifications failed", err);
    }
  };
}
