import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LanguagePicker from "./components/LanguagePicker";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import MilkCalculator from "./pages/MilkCalculator";
import CattleMarket from "./pages/CattleMarket";
import CattleNew from "./pages/CattleNew";
import CattleDetail from "./pages/CattleDetail";
import MyListings from "./pages/MyListings";
import VetContacts from "./pages/VetContacts";
import Schemes from "./pages/Schemes";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Marketplace from "./pages/Marketplace";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import AddProduct from "./pages/AddProduct";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <LanguagePicker />
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/cattle-market" element={<CattleMarket />} />
                  <Route path="/cattle-market/new" element={<ProtectedRoute><CattleNew /></ProtectedRoute>} />
                  <Route path="/cattle-market/:id" element={<CattleDetail />} />
                  <Route path="/cattle-market/:id/edit" element={<ProtectedRoute><CattleNew /></ProtectedRoute>} />
                  <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
                  <Route path="/vet-contacts" element={<VetContacts />} />
                  <Route path="/schemes" element={<Schemes />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/milk-calculator" element={<MilkCalculator />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                  <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
