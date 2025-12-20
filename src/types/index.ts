// DeliveryOS Core Types

export type UserRole = 'admin' | 'client' | 'kitchen' | 'motoboy';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  isActive: boolean;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  additions?: string[];
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  motoboyId?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryTime?: Date;
}

export interface EstablishmentSettings {
  id: string;
  name: string;
  logo?: string;
  isOpen: boolean;
  isDeliveryEnabled: boolean;
  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryTime: number; // in minutes
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  address: string;
  phone: string;
  whatsapp?: string;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

export interface NotificationSettings {
  newOrderSound: boolean;
  orderStatusSound: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}

export interface ModuleSettings {
  payments: boolean;
  loyalty: boolean;
  promotions: boolean;
  reviews: boolean;
  scheduling: boolean;
  multipleAddresses: boolean;
}

export interface SystemConfig {
  establishment: EstablishmentSettings;
  theme: ThemeSettings;
  notifications: NotificationSettings;
  modules: ModuleSettings;
}

// Statistics types
export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  averageDeliveryTime: number;
  ordersChange: number;
  revenueChange: number;
}
