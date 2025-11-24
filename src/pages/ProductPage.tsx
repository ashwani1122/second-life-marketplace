import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";


export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
    const slideData = [
    {
        title: "Mystic Mountains",
        button: "Explore Component",
        src: "https://images.unsplash.com/photo-1494806812796-244fe51b774d?q=80&w=3534&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "Urban Dreams",
        button: "Explore Component",
        src: "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "Neon Nights",
        button: "Explore Component",
        src: "https://images.unsplash.com/photo-1590041794748-2d8eb73a571c?q=80&w=3456&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
        title: "Desert Whispers",
        button: "Explore Component",
        src: "https://images.unsplash.com/photo-1679420437432-80cfbf88986c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    ];
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // 2️⃣ Fetch product images
        const { data: imageRows, error: imagesError } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id);

        if (imagesError) throw imagesError;

        // Extract image_url array
        const urls = imageRows.map((row) => row.image_url);
        setImages(urls);
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const formatCurrency = (value?: number) =>
    value == null ? "-" : value.toLocaleString(undefined, { style: "currency", currency: "USD" });

  const addToCart = () => {
    if (!product) return;

    try {
      const raw = localStorage.getItem("cart");
      const cart = raw ? JSON.parse(raw) : [];

      cart.push({
        id: product.id,
        title: product.title,
        price: product.price ?? 0,
        quantity: 1,
      });

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart!");
    } catch {
      alert("Failed to add to cart");
    }
  };

  if (!id) return <div>Missing product id.</div>;
  if (loading) return <div className="flex items-center justify-center h-screen">
    <Loader className="animate-spin" />
  </div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found.</div>;

  return <div className=" flex item-center justify-center">
            <Carousel orientation="horizontal" className="w-[30%] border border-gray-200 flex items-center justify-center h-100">
      <CarouselContent>
        {images.map((image, index) => (
          <CarouselItem key={index} className="flex item-center justify-center h-100">
            <img src={image} alt={product.title} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
        <CarouselNext />
    </Carousel>
  </div>
  
};

