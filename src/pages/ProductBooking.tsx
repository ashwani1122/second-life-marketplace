// src/pages/ProductBookings.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { format } from "date-fns";

/**
 * ProductBookings page
 * - Shows all bookings for a product
 * - Seller can Accept one (makes others rejected + product sold) or Reject individual bookings
 * - Inserts notifications for affected buyers
 */

export default function ProductBookings(): JSX.Element {
  const { id: productId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null); // booking being processed
  const bookingsChanRef = useRef<any | null>(null);

  // get current user id
  useEffect(() => {
    (async () => {
      try {
        const res = await supabase.auth.getUser();
        setCurrentUserId(res?.data?.user?.id ?? null);
      } catch (err) {
        console.warn("Failed getting current user", err);
      }
    })();
  }, []);

  // fetch product + bookings
  const fetchData = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      // product
      const { data: prod, error: prodErr } = await supabase
        .from("products")
        .select("id,title,price,status,seller_id")
        .eq("id", productId)
        .single();

      if (prodErr) {
        console.error("Failed to load product", prodErr);
        toast.error("Failed to load product");
        setProduct(null);
      } else {
        setProduct(prod ?? null);
      }

      // bookings with buyer profile (requires FK buyer_id -> profiles.id)
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          product_id,
          buyer_id,
          seller_id,
          offered_price,
          message,
          preferred_date,
          expires_at,
          status,
          created_at,
          profiles:buyer_id ( id, full_name, avatar_url )
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load bookings", error);
        toast.error("Failed to load bookings: " + error.message);
        setBookings([]);
      } else {
        setBookings(data ?? []);
      }
    } catch (err) {
      console.error("fetchData bookings", err);
      toast.error("Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // subscribe to bookings updates for this product to keep UI live
  useEffect(() => {
    fetchData();

    if (!productId) return;
    const chan = supabase
      .channel(`bookings-product-${productId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `product_id=eq.${productId}` },
        (_payload: any) => {
          // refetch when bookings change
          fetchData();
        }
      )
      .subscribe();

    bookingsChanRef.current = chan;

    return () => {
      try {
        if (bookingsChanRef.current) {
          // unsubscribe and remove channel
          bookingsChanRef.current.unsubscribe();
          try {
            supabase.removeChannel(bookingsChanRef.current);
          } catch (e) {
            // removeChannel may throw if channel already removed, ignore
          }
          bookingsChanRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // helper to insert multiple notifications at once
  async function insertNotifications(notifs: Array<{ user_id: string; title: string; body: string; data?: any }>) {
    if (!notifs || notifs.length === 0) return { error: null, data: null };

    const payload = notifs.map((n) => ({
      user_id: n.user_id,
      title: n.title,
      body: n.body,
      data: n.data ? JSON.stringify(n.data) : null,
    }));

    try {
      const { data, error } = await supabase.from("notifications").insert(payload);
      if (error) {
        console.warn("notification insert failed", error);
      }
      return { data, error };
    } catch (err) {
      console.warn("notification insert exception", err);
      return { data: null, error: err };
    }
  }

  // Accept a booking:
  // - set booking.status = 'accepted' for chosen booking
  // - set other pending bookings for the same product to 'rejected'
  // - set product.status = 'sold'
  // - create notifications for accepted buyer and rejected buyers
  const acceptBooking = async (bookingId: string) => {
    if (!product) return;
    if (product.seller_id !== currentUserId) {
      toast.error("Only the seller can accept bookings for this product.");
      return;
    }

    const confirmed = window.confirm("Accept this booking and mark product as sold? This will reject other pending bookings.");
    if (!confirmed) return;

    setProcessingId(bookingId);
    try {
      // 1) update chosen booking -> accepted
      const { data: acceptedRow, error: acceptErr } = await supabase
        .from("bookings")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .select()
        .single();

      if (acceptErr) throw acceptErr;
      if (!acceptedRow) throw new Error("Failed to accept booking");

      // 2) update other pending bookings -> rejected
      const { error: rejectErr } = await supabase
        .from("bookings")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("product_id", product.id)
        .eq("status", "pending")
        .neq("id", bookingId);

      if (rejectErr) {
        console.warn("reject others error", rejectErr);
      }

      // 3) update product status -> sold (optimistic: update local state first)
      setProduct((p) => (p ? { ...p, status: "sold" } : p));
      const { error: prodErr } = await supabase
        .from("products")
        .update({ status: "sold", updated_at: new Date().toISOString() })
        .eq("id", product.id);

      if (prodErr) {
        console.warn("product update error", prodErr);
        // continue anyway
      }

      // 4) create notifications in one batch:
      // fetch current bookings to find buyer ids and statuses
      const { data: allBookings, error: allBErr } = await supabase
        .from("bookings")
        .select("id, buyer_id, status")
        .eq("product_id", product.id);

      if (allBErr) {
        console.warn("Could not fetch all bookings for notifications", allBErr);
      }

      const notificationsToInsert: Array<{ user_id: string; title: string; body: string; data?: any }> = [];

      if (allBookings && allBookings.length > 0) {
        for (const b of allBookings) {
          if (!b.buyer_id) continue;
          if (b.id === bookingId) {
            notificationsToInsert.push({
              user_id: b.buyer_id,
              title: "Booking accepted",
              body: `Your booking for "${product.title}" was accepted by the seller.`,
              data: { booking_id: b.id, product_id: product.id, status: "accepted" },
            });
          } else {
            notificationsToInsert.push({
              user_id: b.buyer_id,
              title: "Booking update",
              body: `Your booking for "${product.title}" was not accepted.`,
              data: { booking_id: b.id, product_id: product.id, status: "rejected" },
            });
          }
        }
      }

      // insert notifications in batch and check result
      const { error: notifErr } = await insertNotifications(notificationsToInsert);
      if (notifErr) {
        console.warn("Some notifications may have failed to insert", notifErr);
        toast.success("Booking accepted. However, notifications could not be delivered to some buyers.");
      } else {
        toast.success("Booking accepted — buyers notified.");
      }

      // refresh local list
      await fetchData();
    } catch (err: any) {
      console.error("acceptBooking error", err);
      toast.error(err?.message || "Failed to accept booking");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a single booking: change status -> rejected, notify that buyer
  const rejectBooking = async (bookingId: string) => {
    if (!product) return;
    if (product.seller_id !== currentUserId) {
      toast.error("Only the seller can reject bookings for this product.");
      return;
    }

    const confirmed = window.confirm("Reject this booking?");
    if (!confirmed) return;

    setProcessingId(bookingId);
    try {
      const { data: row, error } = await supabase
        .from("bookings")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .select()
        .single();
      if (error) throw error;

      if (row?.buyer_id) {
        const { error: notifErr } = await insertNotifications([
          {
            user_id: row.buyer_id,
            title: "Booking rejected",
            body: `Your booking for "${product.title}" was rejected by the seller.`,
            data: { booking_id: bookingId, product_id: product.id, status: "rejected" },
          },
        ]);
        if (notifErr) {
          console.warn("notification insert failed for reject", notifErr);
          toast.success("Booking rejected. But notification could not be sent.");
        } else {
          toast.success("Booking rejected and buyer notified.");
        }
      } else {
        toast.success("Booking rejected.");
      }

      await fetchData();
    } catch (err: any) {
      console.error("rejectBooking error", err);
      toast.error(err?.message || "Failed to reject booking");
    } finally {
      setProcessingId(null);
    }
  };

  const canManage = useMemo(() => {
    return product && currentUserId && product.seller_id === currentUserId;
  }, [product, currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <p>Product not found.</p>
        <Link to="/browse" className="text-indigo-600">Back to browse</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookings for: {product.title}</h1>
          <p className="text-sm text-slate-500">Product ID: {product.id}</p>
        </div>
        <div>
          <Link to={`/product/${product.id}`} className="text-sm text-indigo-600">View product</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
        {bookings.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No bookings yet.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const buyer = b.profiles ?? { id: b.buyer_id, full_name: "Buyer" };
              return (
                <div key={b.id} className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700">
                      {buyer?.full_name ? buyer.full_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold truncate">{buyer?.full_name ?? "Buyer"}</div>
                        <div className="text-xs text-slate-400">• {b.buyer_id}</div>
                        <div className={`ml-2 px-2 py-0.5 text-xs rounded-full ${b.status === "pending" ? "bg-amber-100 text-amber-600" : b.status === "accepted" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"}`}>
                          {b.status}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 truncate">{b.message ?? "No message"}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Offer: {b.offered_price != null ? `₹${Number(b.offered_price).toLocaleString()}` : "—"} • {b.preferred_date ? format(new Date(b.preferred_date), "PPP") : "No date"} • {format(new Date(b.created_at), "Pp")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === "pending" && canManage && (
                      <>
                        <Button size="sm" onClick={() => acceptBooking(b.id)} disabled={processingId !== null}>
                          {processingId === b.id ? "Processing…" : "Accept"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => rejectBooking(b.id)} disabled={processingId !== null}>
                          Reject
                        </Button>
                      </>
                    )}

                    {/* show small label if accepted/rejected */}
                    {b.status !== "pending" && (
                      <div className="text-xs text-slate-500">{b.status}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
