// src/components/ProductCard.tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  imageUrl: string;
  viewCount?: number;
  categoryName?: string;
  /** NEW: booking state props */
  badgeState?: "reserved" | "booked" | null;
  pendingCount?: number;
}

export const ProductCard = ({
  id,
  title,
  price,
  location,
  condition,
  imageUrl,
  viewCount = 0,
  categoryName,
  badgeState = null,
  pendingCount = 0,
}: ProductCardProps) => {
  const conditionColors: Record<string, string> = {
    new: "bg-success",
    "like-new": "bg-secondary",
    good: "bg-accent",
    fair: "bg-muted",
    poor: "bg-destructive",
  };

  const bookingBadgeClasses =
    badgeState === "booked"
      ? "bg-emerald-600 text-emerald-50"
      : badgeState === "reserved"
      ? "bg-amber-500 text-amber-50"
      : "";

  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-elegant transition-smooth cursor-pointer relative">
      {/* IMAGE AREA */}
      <div className="relative aspect-square overflow-hidden">
        {/* Main image links to product */}
        <Link to={`/product/${id}`}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
        </Link>

        {/* Category badge (top-left) */}
        {categoryName && (
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur">
            {categoryName}
          </Badge>
        )}

        {/* Booking badge (top-right) */}
        {badgeState && (
          <Link
            to={`/product/${id}/bookings`}
            className="absolute top-3 right-3 z-20"
            aria-label={badgeState === "booked" ? "Booked" : "Reserved"}
          >
            <Badge
              className={`flex items-center gap-1 px-2 py-1 ${bookingBadgeClasses}`}
            >
              <ShoppingBag className="h-3 w-3" />
              {badgeState === "booked" ? "Booked" : "Reserved"}
              {badgeState === "reserved" && pendingCount > 1 && (
                <span className="text-[10px] opacity-80">• {pendingCount}</span>
              )}
            </Badge>
          </Link>
        )}

        {/* Condition badge: render only when NOT booked */}
        {!badgeState  && (
          <Badge
            className={`absolute ${badgeState ? "top-11" : "top-3"} right-3 ${conditionColors[condition] || "bg-muted"}`}
          >
            {condition}
          </Badge>
        )}
      </div>

      {/* CONTENT */}
      <CardContent className="p-4">
        <Link to={`/product/${id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        {viewCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{viewCount} views</span>
          </div>
        )}
      </CardContent>

      {/* FOOTER: PRICE + VIEW/BOOKINGS */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <p className="font-bold text-2xl text-primary">
          ${price.toLocaleString()}
        </p>

        <div className="flex items-center gap-2">
          <Link
            to={`/product/${id}`}
            className="text-xs px-3 py-1 rounded-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-smooth"
          >
            View
          </Link>
          <Link
            to={`/product/${id}/bookings`}
            className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground hover:brightness-110 transition-smooth"
          >
            Bookings
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};
