import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./contexts/ConfigContext";
import { OrderProvider } from "./contexts/OrderContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProductProvider } from "./contexts/ProductContext";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Pages
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";

import ClientPanel from "./pages/client/ClientPanel";
import ClientProfile from "./pages/client/ClientProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminSettings from "./pages/admin/Settings";
import AdminKanban from "./pages/admin/Kanban";
import AdminCategories from "./pages/admin/Categories";
import AdminProducts from "./pages/admin/Products";
import AdminPickup from "./pages/admin/Pickup";
import AdminClients from "./pages/admin/Clients";
import AdminOnlinePayment from "./pages/admin/OnlinePayment";
import AdminMercadoPago from "./pages/admin/MercadoPago";
import AdminPaymentMethods from "./pages/admin/PaymentMethods";
import AdminPixMessages from "./pages/admin/PixMessages";
import AdminMarketing from "./pages/admin/Marketing";
import AdminLoyalty from "./pages/admin/Loyalty";
import AdminReviews from "./pages/admin/Reviews";
import AdminSystem from "./pages/admin/System";
import AdminBusinessHours from "./pages/admin/BusinessHours";
import AdminDeliveryConfig from "./pages/admin/DeliveryConfig";
import AdminEditableMessages from "./pages/admin/EditableMessages";
import AdminFirstOrderVerification from "./pages/admin/FirstOrderVerification";
import AdminRecaptcha from "./pages/admin/Recaptcha";
import AdminApiConfig from "./pages/admin/ApiConfig";
import AdminProfile from "./pages/admin/AdminProfile";
// Panel Pages
import KitchenPanel from "./pages/kitchen/KitchenPanel";
import MotoboyPanel from "./pages/motoboy/MotoboyPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ConfigProvider>
          <ProductProvider>
            <OrderProvider>
              <CartProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<ClientPanel />} />
                      <Route path="/auth" element={<AuthPage />} />

                      {/* Protected Profile Route - Any authenticated user */}
                      <Route element={<ProtectedRoute allowedRoles={['client', 'admin', 'kitchen', 'motoboy']} />}>
                        <Route path="/profile" element={<ClientProfile />} />
                      </Route>

                      {/* Protected Admin Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin" element={<SidebarProvider><AdminDashboard /></SidebarProvider>} />
                        <Route path="/admin/kanban" element={<SidebarProvider><AdminKanban /></SidebarProvider>} />
                        <Route path="/admin/orders" element={<SidebarProvider><AdminOrders /></SidebarProvider>} />
                        <Route path="/admin/clients" element={<SidebarProvider><AdminClients /></SidebarProvider>} />
                        <Route path="/admin/categories" element={<SidebarProvider><AdminCategories /></SidebarProvider>} />
                        <Route path="/admin/products" element={<SidebarProvider><AdminProducts /></SidebarProvider>} />
                        <Route path="/admin/pickup" element={<SidebarProvider><AdminPickup /></SidebarProvider>} />
                        <Route path="/admin/online-payment" element={<SidebarProvider><AdminOnlinePayment /></SidebarProvider>} />
                        <Route path="/admin/mercadopago" element={<SidebarProvider><AdminMercadoPago /></SidebarProvider>} />
                        <Route path="/admin/payment-methods" element={<SidebarProvider><AdminPaymentMethods /></SidebarProvider>} />
                        <Route path="/admin/pix-messages" element={<SidebarProvider><AdminPixMessages /></SidebarProvider>} />
                        <Route path="/admin/marketing" element={<SidebarProvider><AdminMarketing /></SidebarProvider>} />
                        <Route path="/admin/loyalty" element={<SidebarProvider><AdminLoyalty /></SidebarProvider>} />
                        <Route path="/admin/reviews" element={<SidebarProvider><AdminReviews /></SidebarProvider>} />
                        <Route path="/admin/system" element={<SidebarProvider><AdminSystem /></SidebarProvider>} />
                        <Route path="/admin/hours" element={<SidebarProvider><AdminBusinessHours /></SidebarProvider>} />
                        <Route path="/admin/delivery-config" element={<SidebarProvider><AdminDeliveryConfig /></SidebarProvider>} />
                        <Route path="/admin/messages" element={<SidebarProvider><AdminEditableMessages /></SidebarProvider>} />
                        <Route path="/admin/verification" element={<SidebarProvider><AdminFirstOrderVerification /></SidebarProvider>} />
                        <Route path="/admin/recaptcha" element={<SidebarProvider><AdminRecaptcha /></SidebarProvider>} />
                        <Route path="/admin/api-config" element={<SidebarProvider><AdminApiConfig /></SidebarProvider>} />
                        <Route path="/admin/users" element={<SidebarProvider><AdminUsers /></SidebarProvider>} />
                        <Route path="/admin/settings" element={<SidebarProvider><AdminSettings /></SidebarProvider>} />
                        <Route path="/admin/profile" element={<SidebarProvider><AdminProfile /></SidebarProvider>} />
                      </Route>

                      {/* Protected Kitchen Route */}
                      <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
                        <Route path="/kitchen" element={<KitchenPanel />} />
                      </Route>

                      {/* Protected Motoboy Route */}
                      <Route element={<ProtectedRoute allowedRoles={['motoboy', 'admin']} />}>
                        <Route path="/motoboy" element={<MotoboyPanel />} />
                      </Route>

                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </CartProvider>
            </OrderProvider>
          </ProductProvider>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
