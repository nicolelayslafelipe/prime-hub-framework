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
import { SoundProvider } from "./contexts/SoundContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

// Pages
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/auth/AuthPage";
import ResetPassword from "./pages/auth/ResetPassword";

import ClientPanel from "./pages/client/ClientPanel";
import ClientProfile from "./pages/client/ClientProfile";
import ClientOrders from "./pages/client/ClientOrders";
import ClientAddresses from "./pages/client/ClientAddresses";
import ClientSettings from "./pages/client/ClientSettings";

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
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSoundSettings from "./pages/admin/SoundSettings";
import AdminThemes from "./pages/admin/Themes";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCouponReports from "./pages/admin/CouponReports";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminPDV from "./pages/admin/PDV";
import AdminPDVHistory from "./pages/admin/PDVHistory";
// Panel Pages
import KitchenPanel from "./pages/kitchen/KitchenPanel";
import MotoboyPanel from "./pages/motoboy/MotoboyPanel";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConfigProvider>
            <ProductProvider>
              <SoundProvider>
                <OrderProvider>
                  <CartProvider>
                    <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<ClientPanel />} />
                        <Route path="/auth/reset-password" element={<ResetPassword />} />
                        <Route path="/auth" element={<AuthPage />} />

                        {/* Protected Client Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['client', 'admin', 'kitchen', 'motoboy']} />}>
                          <Route path="/profile" element={<ClientProfile />} />
                          <Route path="/orders" element={<ClientOrders />} />
                          <Route path="/addresses" element={<ClientAddresses />} />
                          <Route path="/settings" element={<ClientSettings />} />
                        </Route>

                        {/* Protected Admin Routes */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                          <Route path="/admin" element={<SidebarProvider><AdminDashboard /></SidebarProvider>} />
                          <Route path="/admin/pdv" element={<SidebarProvider><AdminPDV /></SidebarProvider>} />
                          <Route path="/admin/pdv/history" element={<SidebarProvider><AdminPDVHistory /></SidebarProvider>} />
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
                          <Route path="/admin/users" element={<SidebarProvider><AdminUsers /></SidebarProvider>} />
                          <Route path="/admin/settings" element={<SidebarProvider><AdminSettings /></SidebarProvider>} />
                          <Route path="/admin/profile" element={<SidebarProvider><AdminProfile /></SidebarProvider>} />
                          <Route path="/admin/sound-settings" element={<SidebarProvider><AdminSoundSettings /></SidebarProvider>} />
                          <Route path="/admin/themes" element={<SidebarProvider><AdminThemes /></SidebarProvider>} />
                          <Route path="/admin/coupons" element={<SidebarProvider><AdminCoupons /></SidebarProvider>} />
                          <Route path="/admin/coupon-reports" element={<SidebarProvider><AdminCouponReports /></SidebarProvider>} />
                          <Route path="/admin/audit-logs" element={<SidebarProvider><AdminAuditLogs /></SidebarProvider>} />
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
              </SoundProvider>
            </ProductProvider>
          </ConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
