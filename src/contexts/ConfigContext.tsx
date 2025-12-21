import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemConfig, EstablishmentSettings, ThemeSettings, NotificationSettings, ModuleSettings } from '@/types';

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

  const fetchSettings = async () => {
    try {
      setError(null);
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
          },
        }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
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
      supabase.removeChannel(channel);
    };
  }, []);

  const updateEstablishment = async (settings: Partial<EstablishmentSettings>) => {
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

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('establishment_settings')
          .update(updateData)
          .eq('id', SETTINGS_ID);

        if (updateError) {
          console.error('Error updating settings:', updateError);
          // Revert local state on error
          await fetchSettings();
          throw updateError;
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
