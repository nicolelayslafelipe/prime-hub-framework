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
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Pages
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";

// Client Pages
import ClientPanel from "./pages/client/ClientPanel";

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

                      {/* Protected Admin Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/kanban" element={<AdminKanban />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/clients" element={<AdminClients />} />
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/pickup" element={<AdminPickup />} />
                        <Route path="/admin/online-payment" element={<AdminOnlinePayment />} />
                        <Route path="/admin/mercadopago" element={<AdminMercadoPago />} />
                        <Route path="/admin/payment-methods" element={<AdminPaymentMethods />} />
                        <Route path="/admin/pix-messages" element={<AdminPixMessages />} />
                        <Route path="/admin/marketing" element={<AdminMarketing />} />
                        <Route path="/admin/loyalty" element={<AdminLoyalty />} />
                        <Route path="/admin/reviews" element={<AdminReviews />} />
                        <Route path="/admin/system" element={<AdminSystem />} />
                        <Route path="/admin/hours" element={<AdminBusinessHours />} />
                        <Route path="/admin/delivery-config" element={<AdminDeliveryConfig />} />
                        <Route path="/admin/messages" element={<AdminEditableMessages />} />
                        <Route path="/admin/verification" element={<AdminFirstOrderVerification />} />
                        <Route path="/admin/recaptcha" element={<AdminRecaptcha />} />
                        <Route path="/admin/api-config" element={<AdminApiConfig />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
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
