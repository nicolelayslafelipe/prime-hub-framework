import React, { createContext, useContext, useState, ReactNode } from 'react';
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
};

const defaultConfig: SystemConfig = {
  establishment: defaultEstablishment,
  theme: defaultTheme,
  notifications: defaultNotifications,
  modules: defaultModules,
};

interface ConfigContextType {
  config: SystemConfig;
  updateEstablishment: (settings: Partial<EstablishmentSettings>) => void;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
  updateNotifications: (settings: Partial<NotificationSettings>) => void;
  updateModules: (settings: Partial<ModuleSettings>) => void;
  toggleEstablishment: () => void;
  toggleDelivery: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);

  const updateEstablishment = (settings: Partial<EstablishmentSettings>) => {
    setConfig((prev) => ({
      ...prev,
      establishment: { ...prev.establishment, ...settings },
    }));
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

  const toggleEstablishment = () => {
    setConfig((prev) => ({
      ...prev,
      establishment: { ...prev.establishment, isOpen: !prev.establishment.isOpen },
    }));
  };

  const toggleDelivery = () => {
    setConfig((prev) => ({
      ...prev,
      establishment: { ...prev.establishment, isDeliveryEnabled: !prev.establishment.isDeliveryEnabled },
    }));
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateEstablishment,
        updateTheme,
        updateNotifications,
        updateModules,
        toggleEstablishment,
        toggleDelivery,
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
