import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, type ReactNode, type ComponentType } from "react";
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
import NativeShell from "./components/NativeShell";
import NetworkStatus from "./components/NetworkStatus";


import RouteFallback from "./components/RouteFallback";
import JerryBot from "./components/JerryBot/JerryBot";
import { JerryProvider } from "./context/JerryContext";

// Eager: first paint routes.
import Index from "./pages/Index";
import LanguageSelect from "./pages/LanguageSelect";


// After a new deploy, old chunk hashes disappear. Reload once to fetch fresh files.
const RELOAD_KEY = "sdh_chunk_reload";
function reloadOnce(): boolean {
  if (sessionStorage.getItem(RELOAD_KEY)) return false;
  sessionStorage.setItem(RELOAD_KEY, "1");
  window.location.reload();
  return true;
}
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  window.addEventListener("load", () => setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 10_000));
}
function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((err) => {
      if (reloadOnce()) return new Promise<{ default: T }>(() => {});
      throw err;
    }),
  );
}

// Lazy: everything else is code-split so the initial bundle stays small.
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const MilkCalculator = lazyWithRetry(() => import("./pages/MilkCalculator"));
const CattleMarket = lazyWithRetry(() => import("./pages/CattleMarket"));
const CattleNew = lazyWithRetry(() => import("./pages/CattleNew"));
const CattleDetail = lazyWithRetry(() => import("./pages/CattleDetail"));
const MyListings = lazyWithRetry(() => import("./pages/MyListings"));
const VetContacts = lazyWithRetry(() => import("./pages/VetContacts"));
const VetDetail = lazyWithRetry(() => import("./pages/VetDetail"));
const Schemes = lazyWithRetry(() => import("./pages/Schemes"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Marketplace = lazyWithRetry(() => import("./pages/Marketplace"));
const Cart = lazyWithRetry(() => import("./pages/Cart"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const AddProduct = lazyWithRetry(() => import("./pages/AddProduct"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminContent = lazyWithRetry(() => import("./pages/AdminContent"));
const AdminVets = lazyWithRetry(() => import("./pages/AdminVets"));
const SellerDashboard = lazyWithRetry(() => import("./pages/SellerDashboard"));
const SelectRole = lazyWithRetry(() => import("./pages/SelectRole"));
const MilkRates = lazyWithRetry(() => import("./pages/MilkRates"));
const IndustryPanel = lazyWithRetry(() => import("./pages/IndustryPanel"));
const MilkRateManagement = lazyWithRetry(() => import("./pages/MilkRateManagement"));
const MediatorPanel = lazyWithRetry(() => import("./pages/MediatorPanel"));
const VetDashboard = lazyWithRetry(() => import("./pages/VetDashboard"));
const BookVet = lazyWithRetry(() => import("./pages/BookVet"));
const MyAppointments = lazyWithRetry(() => import("./pages/MyAppointments"));
const Notifications = lazyWithRetry(() => import("./pages/Notifications"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Refund = lazyWithRetry(() => import("./pages/Refund"));
const Careers = lazyWithRetry(() => import("./pages/Careers"));
const Feedback = lazyWithRetry(() => import("./pages/Feedback"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const SearchResults = lazyWithRetry(() => import("./pages/SearchResults"));
const JerryDemo = lazyWithRetry(() => import("./pages/JerryDemo"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const DiseaseDetection = lazyWithRetry(() => import("./pages/DiseaseDetection"));
const OAuthConsent = lazyWithRetry(() => import("./pages/OAuthConsent"));


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
  if (
    pathname.startsWith("/welcome/language") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/.lovable/oauth/")
  )
    return null;

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
                  <NativeShell />
                  <NetworkStatus />
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
                          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />

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
                          <Route path="/vet/:id" element={<VetDetail />} />
                          <Route path="/schemes" element={<Schemes />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/milk-calculator" element={<MilkCalculator />} />
                          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                          <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
                          <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
                          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                          <Route path="/admin/vets" element={<ProtectedRoute requiredRole="admin"><AdminVets /></ProtectedRoute>} />
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
