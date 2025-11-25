// utils/cart.ts
export type CartItem = {
  id: string; // product id
  title: string;
  price: number;
  quantity: number;
};

const CART_KEY = "cart_v1";

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const cart = readCart();
  const idx = cart.findIndex((c) => c.id === item.id);
  if (idx >= 0) {
    cart[idx].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  writeCart(cart);
}

export function updateCartItemQuantity(id: string, quantity: number) {
  const cart = readCart().map((it) => (it.id === id ? { ...it, quantity } : it)).filter(it => it.quantity > 0);
  writeCart(cart);
}
export function removeFromCart(id: string) {
  const cart = readCart().filter(it => it.id !== id);
  writeCart(cart);
}
