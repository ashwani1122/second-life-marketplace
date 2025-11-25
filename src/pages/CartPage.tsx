import React, { useEffect, useState } from "react";
import { readCart, updateCartItemQuantity, removeFromCart } from "@/utils/cart";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const [items, setItems] = useState(() => readCart());

  useEffect(() => {
    setItems(readCart());
  }, []);

  const setQty = (id: string, qty: number) => {
    updateCartItemQuantity(id, qty);
    setItems(readCart());
  };
  const remove = (id: string) => {
    removeFromCart(id);
    setItems(readCart());
  };

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your cart</h1>
      {items.length === 0 ? (
        <div className="text-slate-500">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between bg-white p-4 rounded shadow">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-slate-500">₹{it.price.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-20 border rounded px-2 py-1"
                  min={1}
                  value={it.quantity}
                  onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value)))}
                />
                <Button variant="ghost" onClick={() => remove(it.id)}>Remove</Button>
              </div>
            </div>
          ))}
          <div className="text-right">
            <div className="text-xl font-bold">Total: ₹{total.toLocaleString()}</div>
            <Button className="mt-2">Proceed to Checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
}
