import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Loader, ShoppingCart, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardHeader, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

// Reworked ProductPage image handling — controlled carousel implementation

export default function ProductPage() {
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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        const { data: imageRows, error: imagesError } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", id);

        if (imagesError) throw imagesError;

        setImages((imageRows || []).map((r: any) => r.image_url));
        setIndex(0);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Keyboard navigation for carousel
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (images.length === 0) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    },
    [images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const prev = () => {
    if (images.length === 0) return;
    setIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = () => {
    if (images.length === 0) return;
    setIndex((i) => (i + 1) % images.length);
  };

  const formatCurrency = (value?: number) =>
    value == null
      ? "-"
      : value.toLocaleString("en-IN", { style: "currency", currency: "INR" });

  const addToCart = () => {
    if (!product) return;

    try {
      const raw = localStorage.getItem("cart");
      const cart = raw ? JSON.parse(raw) : [];

      cart.push({ id: product.id, title: product.title, price: product.price ?? 0, quantity: 1 });

      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart!");
    } catch {
      alert("Failed to add to cart");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin text-slate-600" />
      </div>
    );

  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!product) return <div className="p-6">Product not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 to-white p-6 flex items-start justify-center">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: Images (controlled carousel) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-700">
            <div className="relative rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center h-96">
              {images.length > 0 ? (
                <img
                  src={images[index]}
                  alt={`${product.title} ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-slate-400">No images available</div>
              )}

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    aria-label="Previous image"
                    className="absolute left-3  top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next image"
                    className="absolute right-3  top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white p-2 rounded-full shadow"
                  >
                    <ChevronRight />
                  </button>

                  <div className="absolute left-1/2 -translate-x-1/2 bottom-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                    {index + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
              <div className="mt-3 flex gap-5 item-center justify-evenly overflow-x-auto ">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-shadow ${index === i ? "border-indigo-500 shadow-md" : "border-transparent"}`}
                    style={{ width: 96, height: 72 }}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-700">

            <div className="border border-gray-700 rounded-lg p-2">
                <h3 className="text-lg font-semibold ">About this item</h3>
                <hr />
            <p className="mt-2 text-slate-600 whitespace-pre-line text-sm">{product.description}</p>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 border border-slate-700 rounded-lg">
                <div className="text-xs text-slate-700">Reason</div>
                <div className="font-medium mt-1 text-sm">{product.reason_for_selling || "—"}</div>
              </div>
              <div className="p-3 border border-slate-700 rounded-lg">
                <div className="text-xs text-slate-700">Purchased</div>
                <div className="font-medium mt-1 text-sm">{product.purchase_date}</div>
              </div>
              <div className="p-3 border border-slate-700 rounded-lg ">
                <div className="text-xs text-slate-700">Location</div>
                <div className="font-medium mt-1">{product.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Card with actions */}
        <aside className="w-full">
          <Card className="rounded-2xl sticky top-8 p-0 overflow-hidden">
            <CardHeader className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{product.title}</h2>
                 
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold">{formatCurrency(product.price)}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={addToCart}>
                  <ShoppingCart className="mr-2" /> Add to cart
                </Button>

                <HoverBorderGradient containerClassName="rounded-full" as="button" className="px-4 py-2 bg-white/5 text-white flex items-center gap-2">
                  <Heart size={16} /> Save
                </HoverBorderGradient>
              </div>

              <div className="mt-2 text-xs text-slate-400">{product.status === "active" ? "Available" : "Unavailable"}</div>
            </CardHeader>

            <CardFooter className="p-6 bg-white/3 border-t">
              <div className="grid grid-cols-1  gap-10 w-full">
                <div className="flex flex-col border-2 border-slate-200 rounded ">
                  
                  <div className="mt-1 font-medium flex justify-between p-2"><span>Condition :</span><span>{product.status}</span></div>
                </div>
                  <hr />
                <div className="flex flex-col flex flex-col border-2 border-slate-200 rounded ">
                  <div className="mt-1 font-medium flex justify-between p-2"><span>Location :</span>{(product.location).toUpperCase()}</div>
                </div>
              </div>

            </CardFooter>
             <div className="text-sm text-slate-500 flex justify-between pl-6 flex  border-2 border-slate-200 rounded p-2 m-6"> <span>ID:</span>{product.id}<span></span></div>
          </Card>

        </aside>
      </motion.div>
    </div>
  );
}
