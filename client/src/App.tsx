import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import AboutPage from "@/pages/about-page";
import ContactPage from "@/pages/contact-page";
import MessagesPage from "@/pages/admin/messages-page";
import AdminPanel from "@/pages/admin-panel";
import BrandDetailPage from "@/pages/brand-detail-page";

import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "@/components/ui/navbar";
import { useAuth } from "@/hooks/use-auth";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  return (
    <>
      <Navbar />
      <Switch>
        <ProtectedRoute path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <ProtectedRoute path="/brands/:id" component={BrandDetailPage} />
        <ProtectedRoute path="/admin/messages" component={MessagesPage} />
        <ProtectedRoute path="/admin" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
