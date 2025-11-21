import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye } from "lucide-react";
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
}: ProductCardProps) => {
  const conditionColors: Record<string, string> = {
    new: "bg-success",
    "like-new": "bg-secondary",
    good: "bg-accent",
    fair: "bg-muted",
    poor: "bg-destructive",
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden shadow-card hover:shadow-elegant transition-smooth cursor-pointer">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-smooth group-hover:scale-105"
          />
          {categoryName && (
            <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur">
              {categoryName}
            </Badge>
          )}
          <Badge className={`absolute top-3 right-3 ${conditionColors[condition] || "bg-muted"}`}>
            {condition}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-smooth">
            {title}
          </h3>
          
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
        
        <CardFooter className="p-4 pt-0">
          <p className="font-bold text-2xl text-primary">
            ${price.toLocaleString()}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
};
