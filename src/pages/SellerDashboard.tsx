// src/pages/SellerDashboard.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Loader, RefreshCw, ShoppingBag, BarChart2, Calendar, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

// RECHARTS
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

/* -------------------------
  Types (loose - for brevity)
------------------------- */
type Booking = {
  id: string;
  product_id: string;
  buyer_id?: string | null;
  offered_price?: number | null;
  message?: string | null;
  preferred_date?: string | null;
  expires_at?: string | null;
  status?: string | null; // 'pending' | 'accepted' | 'rejected'
  created_at?: string | null;
  buyer_profile?: { id?: string; full_name?: string | null; avatar_url?: string | null } | null;
};

type ProductRow = {
  id: string;
  title?: string | null;
  price?: number | null;
  status?: string | null;
  view_count?: number | null;
  created_at?: string | null;
  product_images?: { image_url?: string | null }[] | null;
  bookings?: Booking[] | null;
};

export default function SellerDashboard(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // modal state
  const [bookingsOpenFor, setBookingsOpenFor] = useState<ProductRow | null>(null);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // orders state (accepted bookings)
  const [orders, setOrders] = useState<Booking[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // analytics data
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [bookingsOverTime, setBookingsOverTime] = useState<any[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      setCurrentUserId(userId);
      if (!userId) {
        setProducts([]);
        return;
      }

      // fetch seller's products and include bookings and images
      const { data, error } = await supabase
        .from("products")
        .select(`id, title, price, status, view_count, created_at, product_images(image_url), bookings(id, status, buyer_id, offered_price, created_at)`)
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data || []) as ProductRow[]);
    } catch (err: any) {
      console.error("fetch seller products error", err);
      toast.error("Failed to load your products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // insert notification helper (same as earlier)
  async function insertNotification(userId: string, type: string, title: string, body: string, data: any = {}) {
    try {
      await supabase.from("notifications").insert([
        {
          user_id: userId,
          type,
          title,
          body,
          data: data ? JSON.stringify(data) : null,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.warn("notification insert failed", err);
    }
  }

  /* -------------------------
    Bookings modal & handlers
  ------------------------- */
  const openBookingsModal = async (product: ProductRow) => {
    setBookingsOpenFor(product);
    setBookingsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, product_id, buyer_id, offered_price, message, status, created_at, buyer:profiles(id, full_name, avatar_url)")
        .eq("product_id", product.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      // normalize buyer profile
      const normalized = (data || []).map((b: any) => ({
        ...b,
        buyer_profile: b.buyer ?? null,
      })) as Booking[];
      setBookingsList(normalized);
    } catch (err) {
      console.error("openBookingsModal", err);
      toast.error("Failed to load bookings");
      setBookingsList([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const closeBookingsModal = () => {
    setBookingsOpenFor(null);
    setBookingsList([]);
  };

  // Accept booking (client update + notifications + toast). This is idempotent.
  const acceptBooking = async (bookingId: string) => {
    if (!bookingsOpenFor) return;
    setProcessingId(bookingId);
    try {
      // 1) set chosen booking accepted
      const { data: acceptedRow, error: acceptErr } = await supabase
        .from("bookings")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", bookingId)
        .select()
        .single();

      if (acceptErr) throw acceptErr;

      // 2) reject other pending bookings for product
      const { error: rejectErr } = await supabase
        .from("bookings")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("product_id", bookingsOpenFor.id)
        .neq("id", bookingId)
        .eq("status", "pending");

      if (rejectErr) console.warn("reject others error", rejectErr);

      // 3) notify buyers - fetch all bookings
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("id, buyer_id, status")
        .eq("product_id", bookingsOpenFor.id);

      if (allBookings) {
        for (const b of allBookings) {
          if (!b.buyer_id) continue;
          if (b.id === bookingId) {
            await insertNotification(
              b.buyer_id,
              "sale",
              "Booking accepted",
              `Your booking for "${bookingsOpenFor.title}" was accepted by the seller.`,
              { booking_id: b.id, product_id: bookingsOpenFor.id, status: "accepted" }
            );
          } else {
            await insertNotification(
              b.buyer_id,
              "booking_update",
              "Booking update",
              `Your booking for "${bookingsOpenFor.title}" was not accepted.`,
              { booking_id: b.id, product_id: bookingsOpenFor.id, status: "rejected" }
            );
          }
        }
      }

      toast.success("Booking accepted. You can now finalize sale or mark product sold.");
      // refresh bookings list & products
      await openBookingsModal(bookingsOpenFor);
      await fetchData();
    } catch (err: any) {
      console.error("acceptBooking error", err);
      toast.error(err?.message || "Failed to accept booking");
    } finally {
      setProcessingId(null);
    }
  };

  // Reject a single booking
  const rejectBooking = async (bookingId: string) => {
    if (!bookingsOpenFor) return;
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
        await insertNotification(
          row.buyer_id,
          "booking_update",
          "Booking rejected",
          `Your booking for "${bookingsOpenFor.title}" was rejected by the seller.`,
          { booking_id: bookingId, product_id: bookingsOpenFor.id, status: "rejected" }
        );
      }

      toast.success("Booking rejected.");
      await openBookingsModal(bookingsOpenFor);
    } catch (err: any) {
      console.error("rejectBooking error", err);
      toast.error(err?.message || "Failed to reject booking");
    } finally {
      setProcessingId(null);
    }
  };

  // Finalize sale: call the RPC (preferred)
  const finalizeSaleRpc = async (bookingId: string) => {
    setProcessingId(bookingId);
    try {
      const { data, error } = await supabase.rpc("finalize_sale_rpc", { p_booking_id: bookingId });
      if (error) {
        console.error("finalize_sale_rpc error", error);
        toast.error(error.message || "Could not finalize sale");
        return;
      }
      if (data?.status === "ok") {
        toast.success("Product marked as sold");
        await fetchData();
        if (bookingsOpenFor) {
          await openBookingsModal(bookingsOpenFor);
        }
      } else {
        toast.error(data?.message || "Finalize failed");
      }
    } catch (err: any) {
      console.error("finalizeSaleRpc catch", err);
      toast.error("Finalize failed");
    } finally {
      setProcessingId(null);
    }
  };

  /* -------------------------
    Orders (accepted bookings) 
  ------------------------- */
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      if (!userId) {
        setOrders([]);
        return;
      }

      // accepted bookings for seller's products, join buyer profile and product
      const { data, error } = await supabase
        .from("bookings")
        .select("id, product_id, offered_price, buyer_id, status, created_at, products(title), buyer:profiles(id, full_name, phone, avatar_url)")
        .eq("status", "accepted")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Only keep bookings whose product actually belongs to current seller
      const sellerProducts = new Set((products || []).map((p) => p.id));
      const filtered = (data || []).filter((b: any) => sellerProducts.has(b.product_id));
      setOrders(filtered as Booking[]);
    } catch (err) {
      console.error("fetchOrders", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [products]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* -------------------------
    Analytics
  ------------------------- */
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id ?? null;
      if (!userId) {
        setBookingsOverTime([]);
        setRevenueSeries([]);
        return;
      }

      // 1) bookings over the last 30 days for seller's products
      const { data: bookingsData, error: bookingsErr } = await supabase.rpc("bookings_over_time_for_seller", { p_seller_id: userId });
      // bookings_over_time_for_seller is a helpful RPC / view you can create OR we fall back to client aggregation.
      if (!bookingsErr && bookingsData) {
        // expecting array of { day, bookings }
        setBookingsOverTime(bookingsData as any[]);
      } else {
        // fallback: aggregate client-side from bookings
        const rows: any[] = [];
        for (const p of products) {
          for (const b of p.bookings || []) {
            rows.push({ created_at: b.created_at, status: b.status, product_id: p.id });
          }
        }
        // simple client-side aggregation per day (last 14 days)
        const map = new Map<string, number>();
        const today = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          map.set(format(d, "yyyy-MM-dd"), 0);
        }
        for (const r of rows) {
          if (!r.created_at) continue;
          const key = format(new Date(r.created_at), "yyyy-MM-dd");
          if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
        }
        const series = Array.from(map.entries()).map(([day, bookings]) => ({ day, bookings }));
        setBookingsOverTime(series);
      }

      // 2) revenue series (sum of accepted offered_price per day)
      // quick client-side compute
      const revenueMap = new Map<string, number>();
      for (const p of products) {
        for (const b of p.bookings || []) {
          if (b.status !== "accepted") continue;
          const day = format(new Date(b.created_at || ""), "yyyy-MM-dd");
          revenueMap.set(day, (revenueMap.get(day) || 0) + Number(b.offered_price || 0));
        }
      }
      // turn into sorted array
      const revSeries = Array.from(revenueMap.entries())
        .map(([day, revenue]) => ({ day, revenue }))
        .sort((a, b) => a.day.localeCompare(b.day));
      setRevenueSeries(revSeries);
    } catch (err) {
      console.error("fetchAnalytics", err);
      setBookingsOverTime([]);
      setRevenueSeries([]);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [products]);

  useEffect(() => {
    // fetch analytics after product list loads (they depend on bookings)
    if (!loading) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* -------------------------
    Small helpers
  ------------------------- */
  const pendingCountFor = (p: ProductRow) => (p.bookings || []).filter((b) => b.status === "pending").length;
  const acceptedFor = (p: ProductRow) => (p.bookings || []).find((b) => b.status === "accepted");

  /* -------------------------
    UI
  ------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin w-10 h-10 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller dashboard</h1>
          <p className="text-sm text-slate-500">Manage listings, bookings and orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* GRID: Listings | Orders | Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Listings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><ShoppingBag /> Your Listings</h2>

            {products.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No listings yet.</div>
            ) : (
              <div className="space-y-3">
                {products.map((p) => {
                  const pendingCount = pendingCountFor(p);
                  const accepted = acceptedFor(p);
                  const imageUrl = p.product_images?.[0]?.image_url || "/placeholder.svg";
                  return (
                    <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border hover:shadow-md transition">
                      <img src={imageUrl} alt={p.title || "img"} className="w-24 h-16 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold truncate">{p.title}</div>
                            <div className="text-xs text-slate-400 mt-1">${Number(p.price || 0).toLocaleString()} • {p.status}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-xs text-slate-400">Pending</div>
                            <div className="font-semibold">{pendingCount}</div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Link to={`/product/${p.id}`} className="text-sm text-indigo-600 hover:underline">View</Link>
                          <button
                            onClick={() => openBookingsModal(p)}
                            className="text-sm text-slate-500 hover:text-indigo-600"
                          >
                            Bookings
                          </button>

                          {accepted && p.status !== "sold" && (
                            <Button size="sm" variant="destructive" onClick={() => finalizeSaleRpc(accepted.id)} disabled={processingId !== null}>
                              Finalize sale
                            </Button>
                          )}

                          {p.status === "sold" && (
                            <Button size="sm" variant="outline" onClick={async () => {
                              setProcessingId(p.id);
                              const { error } = await supabase.from("products").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", p.id);
                              if (error) toast.error("Failed to reactivate");
                              else { toast.success("Reactivated"); await fetchData(); }
                              setProcessingId(null);
                            }}>Reactivate</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Orders / Completed Sales */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2"><CheckCircle /> Orders (Completed)</h2>
              <Button size="sm" variant="ghost" onClick={() => fetchOrders()} disabled={ordersLoading}>Refresh</Button>
            </div>

            {ordersLoading ? (
              <div className="p-6 text-center"><Loader className="animate-spin w-6 h-6 text-indigo-600" /></div>
            ) : orders.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No completed sales yet.</div>
            ) : (
              <div className="space-y-2 mt-3">
                {orders.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <div className="font-semibold">{o.products?.title ?? "Product"}</div>
                      <div className="text-xs text-slate-500">{o.buyer?.full_name ?? o.buyer_id} • {format(new Date(o.created_at), "PPP")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${Number(o.offered_price || 0).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{o.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Analytics */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><BarChart2 /> Analytics</h3>
              <Button size="sm" variant="ghost" onClick={() => fetchAnalytics()} disabled={analyticsLoading}>Refresh</Button>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">Bookings (last 14 days)</div>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer>
                  <BarChart data={bookingsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">Revenue (accepted bookings)</div>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer>
                  <LineChart data={revenueSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <h4 className="font-semibold">Quick actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              <Button size="sm" onClick={() => {
                // quick navigation to bookings page for first product (if any)
                if (products[0]) window.location.href = `/product/${products[0].id}/bookings`;
              }}>Go to first product bookings</Button>
              <Link to="/sell"><Button size="sm" variant="outline">Create Listing</Button></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Modal */}
      <AnimateBookingsModal
        open={!!bookingsOpenFor}
        onClose={closeBookingsModal}
        product={bookingsOpenFor}
        bookings={bookingsList}
        loading={bookingsLoading}
        onAccept={acceptBooking}
        onReject={rejectBooking}
        onFinalize={(bookingId: string) => finalizeSaleRpc(bookingId)}
        processingId={processingId}
      />
    </div>
  );
}

/* -------------------------
  Bookings Modal component
------------------------- */
function AnimateBookingsModal({
  open,
  onClose,
  product,
  bookings,
  loading,
  onAccept,
  onReject,
  onFinalize,
  processingId,
}: any) {
  // simple portal-less modal for brevity
  return (
    <div aria-hidden={!open}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-6 sm:p-6">
          <div className="fixed inset-0 bg-black/40" onClick={onClose} />

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold">{product?.title ?? "Bookings"}</div>
                <div className="text-xs text-slate-500">{product?.status ?? ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-auto space-y-3">
              {loading ? (
                <div className="flex items-center justify-center p-8"><Loader className="animate-spin w-6 h-6 text-indigo-600" /></div>
              ) : bookings.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No bookings.</div>
              ) : bookings.map((b: any) => (
                <div key={b.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-semibold">
                    {b.buyer?.full_name ? b.buyer.full_name.charAt(0).toUpperCase() : "U"}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{b.buyer?.full_name ?? b.buyer_id}</div>
                      <div className="text-xs text-slate-400">{format(new Date(b.created_at || ""), "Pp")}</div>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{b.message ?? "No message"}</div>
                    <div className="text-xs text-slate-400 mt-2">
                      Offer: ${Number(b.offered_price || 0).toLocaleString()} • {b.status}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {b.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => onAccept(b.id)} disabled={processingId !== null}>Accept</Button>
                          <Button size="sm" variant="outline" onClick={() => onReject(b.id)} disabled={processingId !== null}>Reject</Button>
                        </>
                      )}

                      {b.status === "accepted" && (
                        <>
                          <Button size="sm" variant="destructive" onClick={() => onFinalize(b.id)} disabled={processingId !== null}>Finalize sale</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
