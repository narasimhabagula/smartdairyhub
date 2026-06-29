import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
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
import AdminContent from "./pages/AdminContent";
import NotificationBanners from "./components/NotificationBanners";
import SellerDashboard from "./pages/SellerDashboard";
import SelectRole from "./pages/SelectRole";
import MilkRates from "./pages/MilkRates";
import IndustryPanel from "./pages/IndustryPanel";
import MilkRateManagement from "./pages/MilkRateManagement";
import MediatorPanel from "./pages/MediatorPanel";
import VetDashboard from "./pages/VetDashboard";
import BookVet from "./pages/BookVet";
import MyAppointments from "./pages/MyAppointments";
import Notifications from "./pages/Notifications";
import HelpCenter from "./pages/HelpCenter";
import Support from "./pages/Support";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Refund from "./pages/Refund";
import Careers from "./pages/Careers";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import AIChat from "./pages/AIChat";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import LanguageSelect from "./pages/LanguageSelect";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <LanguagePicker />
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <NotificationBanners />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/ai-chat" element={<AIChat />} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/select-role" element={<SelectRole />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/milk-rates" element={<MilkRates />} />
                  <Route path="/industry" element={<ProtectedRoute><IndustryPanel /></ProtectedRoute>} />
                  <Route path="/milk-rate-management" element={<ProtectedRoute><MilkRateManagement /></ProtectedRoute>} />
                  <Route path="/mediator" element={<ProtectedRoute><MediatorPanel /></ProtectedRoute>} />
                  <Route path="/vet-dashboard" element={<ProtectedRoute><VetDashboard /></ProtectedRoute>} />
                  <Route path="/book-vet" element={<ProtectedRoute><BookVet /></ProtectedRoute>} />
                  <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />



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
                  <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/content" element={<ProtectedRoute requiredRole="admin"><AdminContent /></ProtectedRoute>} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
              <ChatBot />
            </div>
          </CartProvider>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
