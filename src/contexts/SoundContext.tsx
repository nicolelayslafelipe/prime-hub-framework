import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSoundPlayer, SoundType } from '@/lib/sounds';

export interface SoundSettings {
  id: string;
  panel_type: 'admin' | 'kitchen';
  enabled: boolean;
  sound_type: SoundType;
  volume: number;
  min_interval_seconds: number;
  repeat_enabled: boolean;
  repeat_interval_seconds: number;
  max_repeat_duration_seconds: number;
}

interface SoundContextType {
  adminSettings: SoundSettings | null;
  kitchenSettings: SoundSettings | null;
  isLoading: boolean;
  updateSettings: (panelType: 'admin' | 'kitchen', settings: Partial<SoundSettings>) => Promise<void>;
  playSound: (panelType: 'admin' | 'kitchen', orderId: string) => boolean;
  previewSound: (soundType: SoundType, volume: number) => void;
  stopAllSounds: () => void;
  isPlayingAdmin: boolean;
  isPlayingKitchen: boolean;
  alertedOrderIds: Set<string>;
  markOrderAsAlerted: (orderId: string) => void;
  startKitchenRepeat: (orderId: string) => void;
  stopKitchenRepeat: () => void;
  isKitchenRepeating: boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [adminSettings, setAdminSettings] = useState<SoundSettings | null>(null);
  const [kitchenSettings, setKitchenSettings] = useState<SoundSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAdmin, setIsPlayingAdmin] = useState(false);
  const [isPlayingKitchen, setIsPlayingKitchen] = useState(false);
  const [alertedOrderIds, setAlertedOrderIds] = useState<Set<string>>(new Set());
  const [isKitchenRepeating, setIsKitchenRepeating] = useState(false);

  const lastPlayedAtRef = useRef<Record<string, number>>({ admin: 0, kitchen: 0 });
  const kitchenRepeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const kitchenRepeatStartTimeRef = useRef<number>(0);
  const soundPlayer = getSoundPlayer();

  // Fetch sound settings from database
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sound_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const admin = data.find((s) => s.panel_type === 'admin');
        const kitchen = data.find((s) => s.panel_type === 'kitchen');

        if (admin) {
          setAdminSettings({
            ...admin,
            sound_type: admin.sound_type as SoundType,
            panel_type: 'admin',
          });
        }
        if (kitchen) {
          setKitchenSettings({
            ...kitchen,
            sound_type: kitchen.sound_type as SoundType,
            panel_type: 'kitchen',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching sound settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update settings in database
  const updateSettings = useCallback(async (panelType: 'admin' | 'kitchen', settings: Partial<SoundSettings>) => {
    try {
      const { error } = await supabase
        .from('sound_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('panel_type', panelType);

      if (error) throw error;

      // Update local state
      if (panelType === 'admin') {
        setAdminSettings((prev) => prev ? { ...prev, ...settings } : null);
      } else {
        setKitchenSettings((prev) => prev ? { ...prev, ...settings } : null);
      }
    } catch (error) {
      console.error('Error updating sound settings:', error);
      throw error;
    }
  }, []);

  // Check if sound should play (anti-spam, already alerted, etc.)
  const shouldPlaySound = useCallback((panelType: 'admin' | 'kitchen', orderId: string): boolean => {
    const settings = panelType === 'admin' ? adminSettings : kitchenSettings;

    // Check if enabled
    if (!settings?.enabled) {
      return false;
    }

    // Check if already alerted
    if (alertedOrderIds.has(orderId)) {
      return false;
    }

    // Check anti-spam interval
    const now = Date.now();
    const lastPlayed = lastPlayedAtRef.current[panelType] || 0;
    const minInterval = (settings.min_interval_seconds || 3) * 1000;

    if (now - lastPlayed < minInterval) {
      return false;
    }

    return true;
  }, [adminSettings, kitchenSettings, alertedOrderIds]);

  // Play sound for a panel
  const playSound = useCallback((panelType: 'admin' | 'kitchen', orderId: string): boolean => {
    if (!shouldPlaySound(panelType, orderId)) {
      return false;
    }

    const settings = panelType === 'admin' ? adminSettings : kitchenSettings;
    if (!settings) return false;

    try {
      soundPlayer.playSound(settings.sound_type, settings.volume);
      lastPlayedAtRef.current[panelType] = Date.now();

      // Visual feedback
      if (panelType === 'admin') {
        setIsPlayingAdmin(true);
        setTimeout(() => setIsPlayingAdmin(false), 1000);
      } else {
        setIsPlayingKitchen(true);
        setTimeout(() => setIsPlayingKitchen(false), 1000);
      }

      return true;
    } catch (error) {
      console.error('Error playing sound:', error);
      return false;
    }
  }, [shouldPlaySound, adminSettings, kitchenSettings, soundPlayer]);

  // Preview sound without restrictions
  const previewSound = useCallback((soundType: SoundType, volume: number) => {
    soundPlayer.playSound(soundType, volume);
  }, [soundPlayer]);

  // Mark order as alerted
  const markOrderAsAlerted = useCallback((orderId: string) => {
    setAlertedOrderIds((prev) => new Set(prev).add(orderId));
  }, []);

  // Start kitchen repeat
  const startKitchenRepeat = useCallback((orderId: string) => {
    if (!kitchenSettings?.repeat_enabled || isKitchenRepeating) return;

    setIsKitchenRepeating(true);
    kitchenRepeatStartTimeRef.current = Date.now();

    const repeatInterval = (kitchenSettings.repeat_interval_seconds || 30) * 1000;
    const maxDuration = (kitchenSettings.max_repeat_duration_seconds || 300) * 1000;

    kitchenRepeatIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - kitchenRepeatStartTimeRef.current;

      if (elapsed >= maxDuration) {
        stopKitchenRepeat();
        return;
      }

      if (!document.hidden) {
        soundPlayer.playSound(kitchenSettings.sound_type, kitchenSettings.volume);
        setIsPlayingKitchen(true);
        setTimeout(() => setIsPlayingKitchen(false), 1000);
      }
    }, repeatInterval);
  }, [kitchenSettings, isKitchenRepeating, soundPlayer]);

  // Stop kitchen repeat
  const stopKitchenRepeat = useCallback(() => {
    if (kitchenRepeatIntervalRef.current) {
      clearInterval(kitchenRepeatIntervalRef.current);
      kitchenRepeatIntervalRef.current = null;
    }
    setIsKitchenRepeating(false);
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    soundPlayer.stopCurrentSounds();
    stopKitchenRepeat();
    setIsPlayingAdmin(false);
    setIsPlayingKitchen(false);
  }, [soundPlayer, stopKitchenRepeat]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopKitchenRepeat();
    };
  }, [stopKitchenRepeat]);

  return (
    <SoundContext.Provider
      value={{
        adminSettings,
        kitchenSettings,
        isLoading,
        updateSettings,
        playSound,
        previewSound,
        stopAllSounds,
        isPlayingAdmin,
        isPlayingKitchen,
        alertedOrderIds,
        markOrderAsAlerted,
        startKitchenRepeat,
        stopKitchenRepeat,
        isKitchenRepeating,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
