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
  lastAccess?: Date;
}

export type OrderStatus = 
  | 'pending' 
  | 'waiting_payment'
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
  customerLatitude?: number;
  customerLongitude?: number;
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
  // Change fields for cash payment
  needsChange?: boolean;
  changeFor?: number;
  changeAmount?: number;
}

export interface EstablishmentSettings {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  bannerText?: string;
  showBanner?: boolean;
  isOpen: boolean;
  isDeliveryEnabled: boolean;
  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryTime: number;
  deliveryArea?: string;
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
  // Distance-based fee settings
  distanceFeeEnabled?: boolean;
  baseDeliveryFee?: number;
  pricePerKm?: number;
  minDistanceIncluded?: number;
  establishmentLatitude?: number;
  establishmentLongitude?: number;
  maxDeliveryRadius?: number;
  // ETA settings
  averagePrepTime?: number;
  peakTimeAdjustment?: number;
  // Rating
  averageRating?: number;
  totalReviews?: number;
  // Login background
  useBannerAsLoginBg?: boolean;
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
  onlinePayment: boolean;
  mercadoPago: boolean;
  recaptcha: boolean;
  firstOrderVerification: boolean;
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

// Client Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  status: 'active' | 'blocked';
  createdAt: Date;
  addresses: Address[];
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}

// Banner Types
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'card' | 'cash' | 'voucher';
  isActive: boolean;
  icon: string;
  maxChange?: number; // for cash payments
}

// Review Types
export interface Review {
  id: string;
  clientId: string;
  clientName: string;
  orderId: string;
  rating: number;
  comment?: string;
  response?: string;
  isPublic: boolean;
  createdAt: Date;
}

// Loyalty Types
export interface LoyaltyProgram {
  isActive: boolean;
  pointsPerReal: number;
  minimumRedemption: number;
  rewards: LoyaltyReward[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  isActive: boolean;
}

// Message Templates
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'order_confirmed' | 'order_preparing' | 'order_ready' | 'order_out_for_delivery' | 'order_delivered' | 'pix_received';
  content: string;
  variables: string[];
}

// API Integration
export interface ApiIntegration {
  id: string;
  name: string;
  isActive: boolean;
  environment: 'test' | 'production';
  publicKey?: string;
  privateKey?: string;
  status: 'connected' | 'disconnected' | 'error';
  lastCheck?: Date;
}
