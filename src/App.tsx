import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import logo from "@/assets/logo.png";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Carpooling from "./pages/Carpooling";
import Errands from "./pages/Errands";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <img
            src={logo}
            alt="Campus ONE logo"
            className="h-7 w-7 object-contain contrast-125"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
          <img
            src={logo}
            alt="Campus ONE logo"
            className="h-7 w-7 object-contain contrast-125"
          />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirects to home if logged in, otherwise shows auth */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Auth />} />
      <Route path="/auth" element={user ? <Navigate to="/home" replace /> : <Auth />} />
      
      {/* Protected routes */}
      <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/carpooling" element={<ProtectedRoute><Carpooling /></ProtectedRoute>} />
      <Route path="/errands" element={<ProtectedRoute><Errands /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
       <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/users/:profileId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      
      {/* Redirects for old routes */}
      <Route path="/rides" element={<Navigate to="/carpooling?tab=find" replace />} />
      <Route path="/create-ride" element={<Navigate to="/carpooling?tab=offer" replace />} />
      <Route path="/my-trips" element={<Navigate to="/carpooling?tab=trips" replace />} />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
