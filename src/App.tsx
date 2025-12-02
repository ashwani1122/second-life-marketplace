import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Sell from "./pages/Sell";
import NotFound from "./pages/NotFound";
// import { ProductPage } from "./pages/ProductPage";
import Profile from "./pages/Profile";
import { ChatGlobalListener } from "./components/chatGlobalListener";
import InboxPage from "./pages/InboxPage";
import ProductPageWithChat from "./pages/ProductPage";
import ProductBookings from "./pages/ProductBooking";
import SellerDashboard from "./pages/SellerDashboard";
import NotificationsPage from "./pages/NotificationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChatGlobalListener />
        <Navbar />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/product/:id" element={<ProductPageWithChat />} /> 
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<SellerDashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/product/:id/bookings" element={<ProductBookings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
