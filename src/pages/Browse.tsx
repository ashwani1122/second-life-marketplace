// src/pages/Browse.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// --- MOVING BORDER COMPONENT ---
const MovingBorderInput = ({ value, onChange, placeholder }: any) => {
  return (
    <div className="relative p-[1px] overflow-hidden rounded-full group w-full max-w-2xl mx-auto shadow-2xl shadow-indigo-500/20">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="w-full h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ scale: 2.5 }}
        />
      </div>
      <div className="relative bg-white dark:bg-[#0B0F19] rounded-full z-10 flex items-center px-4 py-3">
        <Search className="text-slate-400 mr-3" size={20} />
        <input 
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
};

// --- TYPES ---
interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  view_count: number;
  product_images: { image_url: string }[];
  categories: { name: string } | null;
  status?: string;
  bookings?: { id: string; status: string }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// --- SKELETON LOADER COMPONENT ---
const ProductSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-3xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
    <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
    <div className="space-y-2 px-1">
      <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
      <div className="h-4 w-1/4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
      <div className="flex justify-between pt-2">
        <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const Browse = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("name");

    if (error) {
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } else {
      setCategories(data || []);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // include bookings so we can determine "reserved" / "booked"
      let query = supabase
        .from("products")
        .select(`*, product_images(image_url), categories(name), bookings(id, status)`)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
        setProducts([]);
      } else {
        setProducts((data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          location: p.location,
          condition: p.condition,
          view_count: p.view_count ?? 0,
          product_images: p.product_images ?? [],
          categories: p.categories ?? null,
          status: p.status,
          bookings: p.bookings ?? [],
        })));
      }
    } catch (err) {
      console.error("fetchProducts error", err);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans">
      {/* Top controls */}
      <div className="container mx-auto px-4 pt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-2/3">
            <MovingBorderInput
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              placeholder="Search title, description..."
            />
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]">
        <div className="container mx-auto px-4 py-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <button 
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === "all" 
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              All Items
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                    : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <ProductSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700"
          >
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No matches found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              We couldn't find any products matching your search. Try adjusting your filters or search for something else.
            </p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-6 text-indigo-600 hover:underline font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {products.map((product, index) => {
                const bookings = product.bookings || [];
                const hasAccepted = bookings.some((b) => b.status === "accepted");
                const hasPending = bookings.some((b) => b.status === "pending");
                const pendingCount = bookings.filter((b) => b.status === "pending").length;
                const isSold = product.status === "sold";

                let badgeState: "reserved" | "booked" | null = null;
                if (hasAccepted || isSold) {
                  badgeState = "booked";
                } else if (hasPending) {
                  badgeState = "reserved";
                }

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      location={product.location}
                      condition={product.condition}
                      imageUrl={product.product_images[0]?.image_url || "/placeholder.svg"}
                      viewCount={product.view_count}
                      categoryName={product.categories?.name || undefined}
                      badgeState={badgeState}
                      pendingCount={pendingCount}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Browse;
