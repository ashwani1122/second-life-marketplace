import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Loader } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  interface Product {
    id: string;
    title: string;
    description: string;
    reason_for_selling: string;
    price: number;
    location: string;
    purchase_date: string;
    status: string;
  }
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // Fetch Product + Images
  // ===============================
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        // Fetch product images
        const { data: imageRows, error: imagesError } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id);

        if (imagesError) throw imagesError;

        setImages(imageRows.map((row) => row.image_url));
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ===============================
  // Helpers
  // ===============================
  const formatCurrency = (value?: number) =>
    value == null
      ? "-"
      : value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        });

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

  // ===============================
  // UI States
  // ===============================
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );

  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found.</div>;

  // ===============================
  // UI Layout
  // ===============================
  return (
    <div className="flex bg-gray-100 justify-center items-center gap-20 min-h-screen p-10">
      
      {/* LEFT SIDE */}
      <div className="w-[30%] flex flex-col gap-4">
        <h1 className="text-xl font-bold">{product.title}</h1>

        {/* Carousel */}
        <Carousel className="border rounded bg-white shadow-sm">
          <CarouselContent>
            {images.map((img, i) => (
              <CarouselItem
                key={i}
                className="flex justify-center items-center"
              >
                <img
                  src={img}
                  alt={product.title}
                  className="max-h-80 rounded object-cover"
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        {/* Buttons */}
        <div className="flex gap-4 mt-2">
          <button className="bg-green-600 text-white font-bold px-6 py-2 rounded shadow border border-green-700 w-full">
            ₹ {product.price}
          </button>

          <button
            onClick={addToCart}
            className="bg-green-700 text-white font-bold px-6 py-2 rounded-full shadow border border-green-900 w-full"
          >
            ADD TO CART
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-[30%]">
        <Card className="shadow-md rounded-xl">
          <CardHeader className="space-y-4 p-6">
            
            {/* PRODUCT TITLE */}
            <CardDescription className="text-center text-lg font-semibold">
              {product.title.toUpperCase()}
            </CardDescription>

            {/* Description */}
            <Label>Description</Label>
            <div className="border p-3 rounded flex flex-col justify-between">
              
              <textarea cols={50} rows={10} readOnly className="text-gray-600 p-2 rounded-md">
                {product.description}
              </textarea >
            </div>

            {/* Reason */}
            <div className="border p-3 rounded flex justify-between">
              <span>Reason for selling:</span>
              <CardDescription className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                {product.reason_for_selling}
              </CardDescription>
            </div>

            {/* Price */}
            <div className="border p-3 rounded flex justify-between">
              <span>Price:</span>
              <CardDescription>{formatCurrency(product.price)}</CardDescription>
            </div>

            {/* Address */}
            <div className="border p-3 rounded flex justify-between">
              <span>Address:</span>
              <CardDescription>
                {product.location.toUpperCase()}
              </CardDescription>
            </div>

            {/* Purchase Date */}
            <div className="border p-3 rounded flex justify-between">
              <span>Purchase Date:</span>
              <CardDescription>
                {product.purchase_date.toUpperCase()}
              </CardDescription>
            </div>

            {/* ACTIVE STATUS */}
            <div
              className={`p-4 rounded-xl transition-all text-center font-bold text-white ${
                product.status === "active"
                  ? "bg-green-500 shadow-[0_0_12px_rgba(0,255,0,0.5)]"
                  : "bg-gray-400"
              }`}
            >
              {product.status === "active" ? "ACTIVE" : "INACTIVE"}
            </div>

          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
