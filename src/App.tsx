import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, type ReactNode } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import MobileBottomNav from "./components/MobileBottomNav";
import DesktopHeader from "./components/DesktopHeader";
import Footer from "./components/Footer";
import LanguagePicker from "./components/LanguagePicker";
import AutoTranslate from "./components/AutoTranslate";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthModalProvider } from "./components/auth/AuthModalProvider";
import NotificationBanners from "./components/NotificationBanners";
import SplashScreen from "./components/SplashScreen";

import RouteFallback from "./components/RouteFallback";
import JerryBot from "./components/JerryBot/JerryBot";
import { JerryProvider } from "./context/JerryContext";

// Eager: first paint routes.
import Index from "./pages/Index";
import LanguageSelect from "./pages/LanguageSelect";

// Lazy: everything else is code-split so the initial bundle stays small.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MilkCalculator = lazy(() => import("./pages/MilkCalculator"));
const CattleMarket = lazy(() => import("./pages/CattleMarket"));
const CattleNew = lazy(() => import("./pages/CattleNew"));
const CattleDetail = lazy(() => import("./pages/CattleDetail"));
const MyListings = lazy(() => import("./pages/MyListings"));
const VetContacts = lazy(() => import("./pages/VetContacts"));
const Schemes = lazy(() => import("./pages/Schemes"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Cart = lazy(() => import("./pages/Cart"));
const Orders = lazy(() => import("./pages/Orders"));
const AddProduct = lazy(() => import("./pages/AddProduct"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminContent = lazy(() => import("./pages/AdminContent"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SelectRole = lazy(() => import("./pages/SelectRole"));
const MilkRates = lazy(() => import("./pages/MilkRates"));
const IndustryPanel = lazy(() => import("./pages/IndustryPanel"));
const MilkRateManagement = lazy(() => import("./pages/MilkRateManagement"));
const MediatorPanel = lazy(() => import("./pages/MediatorPanel"));
const VetDashboard = lazy(() => import("./pages/VetDashboard"));
const BookVet = lazy(() => import("./pages/BookVet"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Support = lazy(() => import("./pages/Support"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Refund = lazy(() => import("./pages/Refund"));
const Careers = lazy(() => import("./pages/Careers"));
const Feedback = lazy(() => import("./pages/Feedback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const JerryDemo = lazy(() => import("./pages/JerryDemo"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const DiseaseDetection = lazy(() => import("./pages/DiseaseDetection"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: 1 } },
});

/** Warms the chunks farmers reach first, during browser idle time. */
function RoutePrefetcher() {
  useEffect(() => {
    const warm = () => {
      import("./pages/Dashboard");
      import("./pages/Login");
      import("./pages/MilkRates");
      import("./pages/Marketplace");
      import("./pages/DiseaseDetection");
      import("./pages/VetContacts");
      import("./pages/Schemes");
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm) : window.setTimeout(warm, 2500);
    return () => {
      if (!w.requestIdleCallback) clearTimeout(id as number);
    };
  }, []);
  return null;
}

/** Welcome/language and login are full-screen standalone steps — no app chrome, no Jerry. */
function Chrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/welcome/language") || pathname.startsWith("/login")) return null;
  return <>{children}</>;
}


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AuthModalProvider>
              <CartProvider>
                <JerryProvider>
                  <SplashScreen />
                  <LanguagePicker />
                  <AutoTranslate />

                  <RoutePrefetcher />
                  <div className="flex min-h-screen flex-col">
                    <Chrome>
                      <DesktopHeader />
                      <NotificationBanners />
                    </Chrome>
                    <main className="flex-1">
                      <Suspense fallback={<RouteFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/search" element={<SearchResults />} />
                          <Route path="/welcome/language" element={<LanguageSelect />} />
                          <Route path="/ai-chat" element={<JerryDemo />} />
                          <Route path="/disease-detection" element={<DiseaseDetection />} />
                          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                          <Route path="/profile" element={<Profile />} />
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
                      </Suspense>
                    </main>
                    <Chrome>
                      <Footer />
                      <JerryBot />
                      <MobileBottomNav />
                    </Chrome>
                  </div>
                </JerryProvider>
              </CartProvider>
            </AuthModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
