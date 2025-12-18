import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import Kitchen from "@/pages/Kitchen";
import Motoboy from "@/pages/Motoboy";
import PDV from "@/pages/PDV";
import AdminDashboard from "@/pages/admin/Dashboard";
import Profile from "@/pages/Profile";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/pedidos" component={Orders} />
      <Route path="/perfil" component={Profile} />
      <Route path="/cozinha" component={Kitchen} />
      <Route path="/motoboy" component={Motoboy} />
      <Route path="/pdv" component={PDV} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Router />
            <PWAInstallPrompt />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
