import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader, ArrowLeft, Box, User, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

type BookingRow = {
  id: string;
  product_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  offered_price: number | null;
  message: string | null;
  preferred_date: string | null;
  expires_at: string | null;
  status: string;
  created_at: string;
  products?: {
    id: string;
    title: string | null;
    price: number | null;
    status: string | null;
  } | null;
  buyer?: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
  seller?: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
};

export default function BookingDetailPage(): JSX.Element {
  const { id: bookingId } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // get current user
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setCurrentUserId(data?.user?.id ?? null);
      } catch (err) {
        console.error("getUser error", err);
        setCurrentUserId(null);
      }
    })();
  }, []);

  // fetch booking
  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select(
            `
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
            products:products (
              id,
              title,
              price,
              status
            ),
            buyer:profiles!buyer_id (
              id,
              full_name,
              avatar_url
            ),
            seller:profiles!seller_id (
              id,
              full_name,
              avatar_url
            )
          `
          )
          .eq("id", bookingId)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error("fetch booking error", error);
          toast.error("Failed to load booking.");
          setBooking(null);
        } else if (!data) {
          setBooking(null);
        } else {
          setBooking(data as BookingRow);
        }
      } catch (err) {
        console.error("fetch booking catch", err);
        toast.error("Failed to load booking.");
        setBooking(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const isOwner =
    booking &&
    currentUserId &&
    (booking.buyer_id === currentUserId ||
      booking.seller_id === currentUserId);

  const product = booking?.products ?? null;

  const goToProduct = () => {
    if (!product?.id) return;
    // pass booking id in state so product page can open the right chat/booking
    navigate(`/product/${product.id}`, {
      state: { openBookingId: booking?.id ?? null },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-6">
          <h1 className="text-xl font-semibold mb-2">Booking not found</h1>
          <p className="text-sm text-slate-500">
            This booking may have been removed or the link is invalid.
          </p>
          <div className="mt-4 flex gap-2">
            <Link to="/browse">
              <Button size="sm">Browse products</Button>
            </Link>
            <Link to="/inbox">
              <Button size="sm" variant="outline">
                Go to inbox
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back / Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {product?.id && (
          <Button size="sm" variant="outline" onClick={goToProduct}>
            View product
          </Button>
        )}
      </div>

      {/* Booking Card */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">Booking details</h1>
            <p className="text-xs text-slate-500 mt-1">
              Booking ID: {booking.id}
            </p>
          </div>
          <span
            className={`px-3 py-1 text-xs rounded-full font-medium capitalize ${
              booking.status === "pending"
                ? "bg-amber-100 text-amber-700"
                : booking.status === "accepted"
                ? "bg-emerald-100 text-emerald-700"
                : booking.status === "rejected"
                ? "bg-rose-100 text-rose-700"
                : booking.status === "cancelled"
                ? "bg-slate-200 text-slate-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {booking.status}
          </span>
        </div>

        {/* Product section */}
        <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-4 mb-4 flex items-start gap-3">
          <Box className="w-5 h-5 text-indigo-500 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Product
                </p>
                <div className="font-semibold text-slate-900 dark:text-slate-50">
                  {product?.title || "Unknown product"}
                </div>
              </div>
              {product?.status && (
                <span className="text-xs text-slate-500">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {product.status}
                  </span>
                </span>
              )}
            </div>
            {product?.price != null && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Listed price: ₹{Number(product.price).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Buyer / seller info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-500" />
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Buyer
              </p>
            </div>
            <p className="text-sm font-semibold">
              {booking.buyer?.full_name || booking.buyer_id || "Unknown buyer"}
            </p>
          </div>
          <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-slate-500" />
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Seller
              </p>
            </div>
            <p className="text-sm font-semibold">
              {booking.seller?.full_name ||
                booking.seller_id ||
                "Unknown seller"}
            </p>
          </div>
        </div>

        {/* Booking details */}
        <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Offered price: </span>
              {booking.offered_price != null
                ? `₹${Number(booking.offered_price).toLocaleString()}`
                : "Not specified"}
            </div>
            <div className="flex flex-col items-end text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {format(new Date(booking.created_at), "Pp")}
                </span>
              </div>
              {booking.preferred_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Preferred:{" "}
                    {format(new Date(booking.preferred_date), "PPP")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {booking.message && (
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                Buyer message
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {booking.message}
              </p>
            </div>
          )}

          {booking.expires_at && (
            <p className="text-xs text-slate-500">
              Expires at:{" "}
              {format(new Date(booking.expires_at), "Pp")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {product?.id && (
            <Button size="sm" onClick={goToProduct}>
              View product & chat
            </Button>
          )}
          <Link to="/inbox">
            <Button size="sm" variant="outline">
              Go to inbox
            </Button>
          </Link>
          {!isOwner && (
            <p className="text-xs text-slate-400 mt-1">
              You might not be the buyer or seller for this booking, so some
              actions may be limited.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
