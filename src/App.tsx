import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./contexts/ConfigContext";
import { OrderProvider } from "./contexts/OrderContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";

// Panel Pages
import KitchenPanel from "./pages/kitchen/KitchenPanel";
import MotoboyPanel from "./pages/motoboy/MotoboyPanel";
import ClientPanel from "./pages/client/ClientPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <OrderProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<Index />} />

              {/* Admin Panel */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

              {/* Kitchen Panel */}
              <Route path="/kitchen" element={<KitchenPanel />} />

              {/* Motoboy Panel */}
              <Route path="/motoboy" element={<MotoboyPanel />} />

              {/* Client Panel */}
              <Route path="/client" element={<ClientPanel />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrderProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

export default App;
