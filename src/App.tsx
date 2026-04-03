import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ForgotEmail from "./pages/ForgotEmail";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import FeatureDetailPage from "./pages/FeatureDetailPage";
import Properties from "./pages/Properties";
import Rooms from "./pages/Rooms";
import Tenants from "./pages/Tenants";
import Bills from "./pages/Bills";
import Payments from "./pages/Payments";
import Meters from "./pages/Meters";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { OAuthCallbackHandler } from "@/components/OAuthCallbackHandler";

const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProperties = lazy(() => import("./pages/admin/AdminProperties"));
const AdminRooms = lazy(() => import("./pages/admin/AdminRooms"));
const AdminTenants = lazy(() => import("./pages/admin/AdminTenants"));

const AdminMeters = lazy(() => import("./pages/admin/AdminMeters"));
const AdminBills = lazy(() => import("./pages/admin/AdminBills"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminTutorials = lazy(() => import("./pages/admin/AdminTutorials"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminAds = lazy(() => import("./pages/admin/AdminAds"));
const AdminLanding = lazy(() => import("./pages/admin/AdminLanding"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Tutorials = lazy(() => import("./pages/Tutorials"));
const CMSPage = lazy(() => import("./pages/CMSPage"));
const ToLet = lazy(() => import("./pages/ToLet"));
const ToLetRequests = lazy(() => import("./pages/ToLetRequests"));
const Messages = lazy(() => import("./pages/Messages"));
const Staff = lazy(() => import("./pages/Staff"));
const TenantFamily = lazy(() => import("./pages/tenant/TenantFamily"));
const TenantProfile = lazy(() => import("./pages/tenant/TenantProfile"));
const TenantGuests = lazy(() => import("./pages/tenant/TenantGuests"));
const TenantPayments = lazy(() => import("./pages/tenant/TenantPayments"));
const TenantComplaints = lazy(() => import("./pages/tenant/TenantComplaints"));
const TenantNotices = lazy(() => import("./pages/tenant/TenantNotices"));
const TenantHelpCenter = lazy(() => import("./pages/tenant/TenantHelpCenter"));
const TenantToLet = lazy(() => import("./pages/tenant/TenantToLet"));
const TenantLandlord = lazy(() => import("./pages/tenant/TenantLandlord"));
const Complaints = lazy(() => import("./pages/Complaints"));
const Notices = lazy(() => import("./pages/Notices"));
const Garages = lazy(() => import("./pages/Garages"));

const Roles = lazy(() => import("./pages/Roles"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Guests = lazy(() => import("./pages/Guests"));
const BuySell = lazy(() => import("./pages/BuySell"));
const SaleListingDetail = lazy(() => import("./pages/SaleListingDetail"));
const MyListings = lazy(() => import("./pages/MyListings"));
// SaleMessages merged into Messages page
const AdminSaleListings = lazy(() => import("./pages/admin/AdminSaleListings"));
const Leases = lazy(() => import("./pages/Leases"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return <Navigate to="/xbd-admin" replace />;
  if (role !== "admin" && role !== "employee") return <Navigate to="/dashboard" replace />;
  return (
    <AdminLayout>
      <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
        {children}
      </Suspense>
    </AdminLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <PWAInstallBanner />
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
            <OAuthCallbackHandler />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/xbd-admin" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><AdminLogin /></Suspense>} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/forgot-email" element={<ForgotEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/" element={<Index />} />
              <Route path="/features/:slug" element={<FeatureDetailPage />} />
              <Route path="/tolet" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><ToLet /></Suspense>} />
              <Route path="/tolet/:id" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><ListingDetail /></Suspense>} />
              <Route path="/buy-sell" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><BuySell /></Suspense>} />
              <Route path="/buy-sell/:id" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><SaleListingDetail /></Suspense>} />
              <Route path="/tutorials" element={<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Tutorials /></Suspense>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/properties" element={<ProtectedRoute><Properties /></ProtectedRoute>} />
              <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
              <Route path="/tenants" element={<ProtectedRoute><Tenants /></ProtectedRoute>} />
              <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/meters" element={<ProtectedRoute><Meters /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/tolet-requests" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><ToLetRequests /></Suspense></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Messages /></Suspense></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Staff /></Suspense></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Roles /></Suspense></ProtectedRoute>} />
              <Route path="/complaints" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Complaints /></Suspense></ProtectedRoute>} />
              <Route path="/notices" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Notices /></Suspense></ProtectedRoute>} />
              <Route path="/garages" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Garages /></Suspense></ProtectedRoute>} />
              <Route path="/guests" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Guests /></Suspense></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Subscription /></Suspense></ProtectedRoute>} />
              <Route path="/accounting" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Accounting /></Suspense></ProtectedRoute>} />
              <Route path="/my-listings" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><MyListings /></Suspense></ProtectedRoute>} />
              <Route path="/leases" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><Leases /></Suspense></ProtectedRoute>} />
              {/* sale-messages merged into /messages?tab=sale */}
              <Route path="/tenant/profile" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantProfile /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/family" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantFamily /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/guests" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantGuests /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/payments" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantPayments /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/complaints" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantComplaints /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/notices" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantNotices /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/help" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantHelpCenter /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/tolet" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantToLet /></Suspense></ProtectedRoute>} />
              <Route path="/tenant/landlord" element={<ProtectedRoute><Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><TenantLandlord /></Suspense></ProtectedRoute>} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/properties" element={<AdminRoute><AdminProperties /></AdminRoute>} />
              <Route path="/admin/rooms" element={<AdminRoute><AdminRooms /></AdminRoute>} />
              <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} />
              <Route path="/admin/meters" element={<AdminRoute><AdminMeters /></AdminRoute>} />
              <Route path="/admin/bills" element={<AdminRoute><AdminBills /></AdminRoute>} />
              <Route path="/admin/cms" element={<AdminRoute><AdminCMS /></AdminRoute>} />
              <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
              <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
              <Route path="/admin/tutorials" element={<AdminRoute><AdminTutorials /></AdminRoute>} />
              <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/ads" element={<AdminRoute><AdminAds /></AdminRoute>} />
              <Route path="/admin/landing" element={<AdminRoute><AdminLanding /></AdminRoute>} />
              <Route path="/admin/sale-listings" element={<AdminRoute><AdminSaleListings /></AdminRoute>} />
              <Route path="/page/:slug" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}><CMSPage /></Suspense>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
