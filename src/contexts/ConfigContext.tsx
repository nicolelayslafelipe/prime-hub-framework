import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemConfig, EstablishmentSettings, ThemeSettings, NotificationSettings, ModuleSettings } from '@/types';
import { toast } from 'sonner';
const defaultEstablishment: EstablishmentSettings = {
  id: '1',
  name: 'DeliveryOS',
  isOpen: true,
  isDeliveryEnabled: true,
  minOrderValue: 20,
  deliveryFee: 5,
  estimatedDeliveryTime: 45,
  operatingHours: {
    monday: { open: '11:00', close: '23:00', isOpen: true },
    tuesday: { open: '11:00', close: '23:00', isOpen: true },
    wednesday: { open: '11:00', close: '23:00', isOpen: true },
    thursday: { open: '11:00', close: '23:00', isOpen: true },
    friday: { open: '11:00', close: '00:00', isOpen: true },
    saturday: { open: '11:00', close: '00:00', isOpen: true },
    sunday: { open: '12:00', close: '22:00', isOpen: true },
  },
  address: 'Rua Exemplo, 123 - Centro',
  phone: '(11) 99999-9999',
  whatsapp: '5511999999999',
  banner: undefined,
  bannerText: undefined,
  showBanner: false,
};

const defaultTheme: ThemeSettings = {
  primaryColor: '#10b981',
  accentColor: '#34d399',
};

const defaultNotifications: NotificationSettings = {
  newOrderSound: true,
  orderStatusSound: true,
  emailNotifications: true,
  whatsappNotifications: false,
};

const defaultModules: ModuleSettings = {
  payments: false,
  loyalty: false,
  promotions: false,
  reviews: false,
  scheduling: false,
  multipleAddresses: false,
  onlinePayment: false,
  mercadoPago: false,
  recaptcha: false,
  firstOrderVerification: false,
};

const defaultConfig: SystemConfig = {
  establishment: defaultEstablishment,
  theme: defaultTheme,
  notifications: defaultNotifications,
  modules: defaultModules,
};

interface ConfigContextType {
  config: SystemConfig;
  isLoading: boolean;
  error: string | null;
  updateEstablishment: (settings: Partial<EstablishmentSettings>) => Promise<void>;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateModules: (settings: Partial<ModuleSettings>) => void;
  toggleEstablishment: () => Promise<void>;
  toggleDelivery: () => Promise<void>;
  refetch: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if current user is admin
  const checkAdminStatus = async (): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return false;

      const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userData.user.id });
      return roleData === 'admin';
    } catch {
      return false;
    }
  };

  const fetchSettings = async () => {
    try {
      setError(null);
      
      // Check if user is admin
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);

      if (adminStatus) {
        // Admin: fetch full data from table
        const { data, error: fetchError } = await supabase
          .from('establishment_settings')
          .select('*')
          .eq('id', SETTINGS_ID)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setConfig(prev => ({
            ...prev,
            establishment: {
              ...prev.establishment,
              id: data.id,
              name: data.name || 'DeliveryOS',
              description: data.description || '',
              logo: data.logo || undefined,
              banner: data.banner || undefined,
              bannerText: data.banner_text || undefined,
              showBanner: data.show_banner || false,
              isOpen: data.is_open ?? true,
              isDeliveryEnabled: data.is_delivery_enabled ?? true,
              minOrderValue: data.min_order_value || 20,
              deliveryFee: data.delivery_fee || 5,
              estimatedDeliveryTime: data.estimated_delivery_time || 45,
              address: data.address || 'Rua Exemplo, 123 - Centro',
              phone: data.phone || '(11) 99999-9999',
              whatsapp: data.whatsapp || '5511999999999',
              // Location fields
              city: data.city || 'São Paulo',
              state: data.state || 'SP',
              zipCode: data.zip_code || undefined,
              neighborhood: data.neighborhood || undefined,
              // Distance-based fee settings
              distanceFeeEnabled: data.distance_fee_enabled || false,
              baseDeliveryFee: data.base_delivery_fee || 5,
              pricePerKm: data.price_per_km || 2,
              minDistanceIncluded: data.min_distance_included || 2,
              establishmentLatitude: data.establishment_latitude || undefined,
              establishmentLongitude: data.establishment_longitude || undefined,
              maxDeliveryRadius: data.max_delivery_radius || 10,
              // ETA settings
              averagePrepTime: data.average_prep_time || 15,
              peakTimeAdjustment: data.peak_time_adjustment || 10,
              // Rating
              averageRating: data.average_rating ?? 5.0,
              totalReviews: data.total_reviews ?? 0,
              // Login background
              useBannerAsLoginBg: data.use_banner_as_login_bg ?? true,
              // Appearance
              primaryColor: data.primary_color || '#10b981',
              accentColor: data.accent_color || '#34d399',
              useGradient: data.use_gradient || false,
            },
          }));
        }
      } else {
        // Non-admin: use public RPC function for limited data
        const { data, error: fetchError } = await supabase.rpc('get_public_establishment_info');

        if (fetchError) throw fetchError;

        const publicData = data?.[0];
        if (publicData) {
          setConfig(prev => ({
            ...prev,
            establishment: {
              ...prev.establishment,
              id: publicData.id || '1',
              name: publicData.name || 'DeliveryOS',
              description: publicData.description || '',
              logo: publicData.logo || undefined,
              banner: publicData.banner || undefined,
              bannerText: publicData.banner_text || undefined,
              showBanner: publicData.show_banner || false,
              isOpen: publicData.is_open ?? true,
              isDeliveryEnabled: publicData.is_delivery_enabled ?? true,
              minOrderValue: publicData.min_order_value || 20,
              deliveryFee: publicData.delivery_fee || 5,
              estimatedDeliveryTime: publicData.estimated_delivery_time || 45,
              city: publicData.city || 'São Paulo',
              state: publicData.state || 'SP',
              neighborhood: publicData.neighborhood || undefined,
              averageRating: publicData.average_rating ?? 5.0,
              totalReviews: publicData.total_reviews ?? 0,
              averagePrepTime: publicData.average_prep_time || 15,
              useBannerAsLoginBg: publicData.use_banner_as_login_bg ?? true,
              primaryColor: publicData.primary_color || '#10b981',
              accentColor: publicData.accent_color || '#34d399',
              useGradient: publicData.use_gradient || false,
            },
          }));
        }
      }
    } catch (err) {
      console.error('[Config] Error fetching settings:', err);
      setError('Erro ao carregar configurações');
      // Usar configuração padrão em caso de erro
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Timeout para evitar loading infinito
    const CONFIG_TIMEOUT = 10000; // 10 segundos
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('[Config] Timeout - usando configuração padrão');
        setIsLoading(false);
      }
    }, CONFIG_TIMEOUT);

    fetchSettings();

    // Subscribe to auth changes to refresh admin status
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const adminStatus = await checkAdminStatus();
        setIsAdmin(adminStatus);
        if (adminStatus) {
          fetchSettings();
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      }
    });

    // Subscribe to realtime changes (only works for admins due to RLS)
    const channel = supabase
      .channel('establishment_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'establishment_settings',
          filter: `id=eq.${SETTINGS_ID}`,
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      authSubscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const updateEstablishment = async (settings: Partial<EstablishmentSettings>) => {
    // Re-check admin status before updating
    const currentAdminStatus = await checkAdminStatus();
    if (!currentAdminStatus) {
      toast.error('Apenas administradores podem alterar configurações');
      console.error('Only admins can update establishment settings');
      return;
    }

    // Store previous state for rollback
    const previousConfig = { ...config.establishment };

    // Update local state immediately for responsiveness
    setConfig((prev) => ({
      ...prev,
      establishment: { ...prev.establishment, ...settings },
    }));

    // Persist to database
    try {
      const updateData: Record<string, unknown> = {};
      
      if (settings.name !== undefined) updateData.name = settings.name;
      if (settings.description !== undefined) updateData.description = settings.description;
      if (settings.logo !== undefined) updateData.logo = settings.logo;
      if (settings.banner !== undefined) updateData.banner = settings.banner;
      if (settings.bannerText !== undefined) updateData.banner_text = settings.bannerText;
      if (settings.showBanner !== undefined) updateData.show_banner = settings.showBanner;
      if (settings.isOpen !== undefined) updateData.is_open = settings.isOpen;
      if (settings.isDeliveryEnabled !== undefined) updateData.is_delivery_enabled = settings.isDeliveryEnabled;
      if (settings.minOrderValue !== undefined) updateData.min_order_value = settings.minOrderValue;
      if (settings.deliveryFee !== undefined) updateData.delivery_fee = settings.deliveryFee;
      if (settings.estimatedDeliveryTime !== undefined) updateData.estimated_delivery_time = settings.estimatedDeliveryTime;
      if (settings.address !== undefined) updateData.address = settings.address;
      if (settings.phone !== undefined) updateData.phone = settings.phone;
      if (settings.whatsapp !== undefined) updateData.whatsapp = settings.whatsapp;
      // Location fields
      if (settings.city !== undefined) updateData.city = settings.city;
      if (settings.state !== undefined) updateData.state = settings.state;
      if (settings.zipCode !== undefined) updateData.zip_code = settings.zipCode;
      if (settings.neighborhood !== undefined) updateData.neighborhood = settings.neighborhood;
      // Distance-based fee settings
      if (settings.distanceFeeEnabled !== undefined) updateData.distance_fee_enabled = settings.distanceFeeEnabled;
      if (settings.baseDeliveryFee !== undefined) updateData.base_delivery_fee = settings.baseDeliveryFee;
      if (settings.pricePerKm !== undefined) updateData.price_per_km = settings.pricePerKm;
      if (settings.minDistanceIncluded !== undefined) updateData.min_distance_included = settings.minDistanceIncluded;
      if (settings.establishmentLatitude !== undefined) updateData.establishment_latitude = settings.establishmentLatitude;
      if (settings.establishmentLongitude !== undefined) updateData.establishment_longitude = settings.establishmentLongitude;
      if (settings.maxDeliveryRadius !== undefined) updateData.max_delivery_radius = settings.maxDeliveryRadius;
      // ETA settings
      if (settings.averagePrepTime !== undefined) updateData.average_prep_time = settings.averagePrepTime;
      if (settings.peakTimeAdjustment !== undefined) updateData.peak_time_adjustment = settings.peakTimeAdjustment;
      // Rating
      if (settings.averageRating !== undefined) updateData.average_rating = settings.averageRating;
      if (settings.totalReviews !== undefined) updateData.total_reviews = settings.totalReviews;
      // Login background
      if (settings.useBannerAsLoginBg !== undefined) updateData.use_banner_as_login_bg = settings.useBannerAsLoginBg;
      // Appearance
      if (settings.primaryColor !== undefined) updateData.primary_color = settings.primaryColor;
      if (settings.accentColor !== undefined) updateData.accent_color = settings.accentColor;
      if (settings.useGradient !== undefined) updateData.use_gradient = settings.useGradient;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('establishment_settings')
          .update(updateData)
          .eq('id', SETTINGS_ID);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          // Revert local state on error
          setConfig((prev) => ({
            ...prev,
            establishment: previousConfig,
          }));
          toast.error('Erro ao salvar configurações');
          throw updateError;
        }

        // Show success feedback for specific toggles
        if (settings.isOpen !== undefined) {
          toast.success(settings.isOpen ? 'Estabelecimento aberto' : 'Estabelecimento fechado');
        }
        if (settings.isDeliveryEnabled !== undefined) {
          toast.success(settings.isDeliveryEnabled ? 'Delivery ativado' : 'Delivery desativado');
        }
      }
    } catch (err) {
      console.error('Failed to update establishment:', err);
      throw err;
    }
  };

  const updateTheme = (settings: Partial<ThemeSettings>) => {
    setConfig((prev) => ({
      ...prev,
      theme: { ...prev.theme, ...settings },
    }));
  };

  const updateNotifications = (settings: Partial<NotificationSettings>) => {
    setConfig((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...settings },
    }));
  };

  const updateModules = (settings: Partial<ModuleSettings>) => {
    setConfig((prev) => ({
      ...prev,
      modules: { ...prev.modules, ...settings },
    }));
  };

  const toggleEstablishment = async () => {
    const newValue = !config.establishment.isOpen;
    await updateEstablishment({ isOpen: newValue });
  };

  const toggleDelivery = async () => {
    const newValue = !config.establishment.isDeliveryEnabled;
    await updateEstablishment({ isDeliveryEnabled: newValue });
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        isLoading,
        error,
        updateEstablishment,
        updateTheme,
        updateNotifications,
        updateModules,
        toggleEstablishment,
        toggleDelivery,
        refetch: fetchSettings,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
