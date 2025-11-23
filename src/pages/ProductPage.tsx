import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";

// ...existing code...

export const ProductPage = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<null | {
        id: string;
        title?: string;
        description?: string;
        price?: number;
        image_url?: string;
        created_at?: string;
        [key: string]: any;
    }>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("products")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) {
                    setError(error.message);
                    setProduct(null);
                } else {
                    setProduct(data);
                }
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
            cart.push({ id: product.id, title: product.title, price: product.price ?? 0, quantity: 1 });
            localStorage.setItem("cart", JSON.stringify(cart));
            // simple feedback via alert; replace with toast in your app
            alert("Added to cart");
        } catch {
            alert("Failed to add to cart");
        }
    };

    if (!id) {
        return <div>Missing product id.</div>;
    }

    if (loading) {
        return <div>Loading product...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!product) {
        return <div>Product not found.</div>;
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
            {product.image_url && (
                <img
                    src={product.image_url}
                    alt={product.title ?? "product image"}
                    style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8 }}
                />
            )}
            <h1>{product.title ?? "Untitled product"}</h1>
            <p style={{ fontWeight: 700 }}>{formatCurrency(product.price)}</p>
            <p>{product.description}</p>
            <div style={{ marginTop: 12 }}>
                <button onClick={addToCart}>Add to cart</button>
            </div>
            {product.created_at && <small>Posted: {new Date(product.created_at).toLocaleString()}</small>}
        </div>
    );
};  