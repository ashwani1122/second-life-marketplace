import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, Shield, Users, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-marketplace.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
 
const Landing = () => {
  const [session, setSession] = useState(false);
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      setSession(data?.session);
    };
    fetchSession();
  }, []);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 gradient-hero opacity-90" />
        
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Buy & Sell Anything,
              <br />
              <span className="text-accent">Anywhere</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              The trusted marketplace for second-hand products. From electronics to vehicles, 
              find your next great deal or sell what you no longer need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/browse">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Shopping
                </Button>
              </Link>
              <Link to="/sell">
                <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20 backdrop-blur">
                  Sell Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Nexo?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-card hover:shadow-elegant transition-smooth">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">
                Every transaction is protected. Buy and sell with confidence knowing your data is secure.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card shadow-card hover:shadow-elegant transition-smooth">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trusted Community</h3>
              <p className="text-muted-foreground">
                Join thousands of verified buyers and sellers. Real people, real deals.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card shadow-card hover:shadow-elegant transition-smooth">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Best Prices</h3>
              <p className="text-muted-foreground">
                Get amazing deals on quality second-hand products. Save money while helping the environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Electronics", icon: "📱", color: "from-blue-500 to-cyan-500" },
              { name: "Vehicles", icon: "🚗", color: "from-red-500 to-orange-500" },
              { name: "Real Estate", icon: "🏠", color: "from-green-500 to-emerald-500" },
              { name: "Fashion", icon: "👔", color: "from-purple-500 to-pink-500" },
              { name: "Home & Garden", icon: "🏡", color: "from-yellow-500 to-amber-500" },
              { name: "Sports", icon: "⚽", color: "from-indigo-500 to-blue-500" },
            ].map((category) => (
              <Link
                key={category.name}
                to={`/browse?category=${(category.name).toLowerCase()}`}
                className="group"
              >
                <div className="p-6 rounded-xl bg-card shadow-card hover:shadow-elegant transition-smooth text-center">
                  <div className={`text-4xl mb-3 group-hover:scale-110 transition-smooth`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-smooth">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join ReMarket today and discover amazing deals or turn your unused items into cash!
          </p>
        <Link to={session ? "/browse" : "/auth"}>
          {session? <Button  size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
              Get started
            </Button>:
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
              Create Free Account
            </Button>}
           
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
