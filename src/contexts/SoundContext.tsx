import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSoundPlayer, SoundType } from '@/lib/sounds';
import { SoundEventType, SoundPanelType } from '@/types';
import { toast } from 'sonner';

export interface SoundSettings {
  id: string;
  panel_type: SoundPanelType;
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
  motoboySettings: SoundSettings | null;
  isLoading: boolean;
  updateSettings: (panelType: SoundPanelType, settings: Partial<SoundSettings>) => Promise<void>;
  playSound: (panelType: SoundPanelType, orderId: string) => boolean;
  playSoundForEvent: (event: SoundEventType, orderId: string, panel: SoundPanelType) => boolean;
  previewSound: (soundType: SoundType, volume: number) => void;
  stopAllSounds: () => void;
  isPlayingAdmin: boolean;
  isPlayingKitchen: boolean;
  isPlayingMotoboy: boolean;
  alertedOrderIds: Set<string>;
  markOrderAsAlerted: (orderId: string, panel?: SoundPanelType) => void;
  startKitchenRepeat: (orderId: string) => void;
  stopKitchenRepeat: () => void;
  isKitchenRepeating: boolean;
  initializeAudio: () => Promise<void>;
  isAudioInitialized: boolean;
  soundPlaybackFailed: boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

// Map events to the panels that should receive them
const EVENT_PANEL_MAP: Record<SoundEventType, SoundPanelType[]> = {
  new_order: ['admin'],
  order_paid: ['admin'],
  order_to_kitchen: ['kitchen'],
  order_ready: ['admin', 'motoboy'],
  order_delivering: ['admin'],
  order_delivered: ['admin'],
  order_cancelled: ['admin', 'kitchen'],
  motoboy_assigned: ['motoboy'],
  motoboy_available: ['motoboy'],
  system_alert: ['admin', 'kitchen', 'motoboy'],
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [adminSettings, setAdminSettings] = useState<SoundSettings | null>(null);
  const [kitchenSettings, setKitchenSettings] = useState<SoundSettings | null>(null);
  const [motoboySettings, setMotoboySettings] = useState<SoundSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAdmin, setIsPlayingAdmin] = useState(false);
  const [isPlayingKitchen, setIsPlayingKitchen] = useState(false);
  const [isPlayingMotoboy, setIsPlayingMotoboy] = useState(false);
  const [alertedOrderIds, setAlertedOrderIds] = useState<Set<string>>(new Set());
  const [isKitchenRepeating, setIsKitchenRepeating] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [soundPlaybackFailed, setSoundPlaybackFailed] = useState(false);

  const lastPlayedAtRef = useRef<Record<string, number>>({ admin: 0, kitchen: 0, motoboy: 0 });
  const kitchenRepeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const kitchenRepeatStartTimeRef = useRef<number>(0);
  const soundPlayer = getSoundPlayer();

  // Initialize audio on first user interaction
  const initializeAudio = useCallback(async () => {
    if (isAudioInitialized) return;
    const success = await soundPlayer.initialize();
    if (success) {
      setIsAudioInitialized(true);
      setSoundPlaybackFailed(false);
      console.log('[Sound] Audio initialized successfully');
    } else {
      console.warn('[Sound] Failed to initialize audio');
    }
  }, [isAudioInitialized, soundPlayer]);

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
        const motoboy = data.find((s) => s.panel_type === 'motoboy');

        const mapSettings = (s: typeof admin): SoundSettings | null => {
          if (!s) return null;
          return {
            ...s,
            sound_type: s.sound_type as SoundType,
            panel_type: s.panel_type as SoundPanelType,
            volume: Number(s.volume) || 0.7,
            min_interval_seconds: Number(s.min_interval_seconds) || 3,
            repeat_interval_seconds: Number(s.repeat_interval_seconds) || 30,
            max_repeat_duration_seconds: Number(s.max_repeat_duration_seconds) || 300,
          };
        };

        setAdminSettings(mapSettings(admin));
        setKitchenSettings(mapSettings(kitchen));
        setMotoboySettings(mapSettings(motoboy));
      }
    } catch (error) {
      console.error('[Sound] Error fetching sound settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update settings in database
  const updateSettings = useCallback(async (panelType: SoundPanelType, settings: Partial<SoundSettings>) => {
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
      const updateFn = (prev: SoundSettings | null) => prev ? { ...prev, ...settings } : null;
      if (panelType === 'admin') {
        setAdminSettings(updateFn);
      } else if (panelType === 'kitchen') {
        setKitchenSettings(updateFn);
      } else if (panelType === 'motoboy') {
        setMotoboySettings(updateFn);
      }
    } catch (error) {
      console.error('[Sound] Error updating sound settings:', error);
      throw error;
    }
  }, []);

  // Get settings for a panel
  const getSettings = useCallback((panelType: SoundPanelType): SoundSettings | null => {
    switch (panelType) {
      case 'admin': return adminSettings;
      case 'kitchen': return kitchenSettings;
      case 'motoboy': return motoboySettings;
      default: return null;
    }
  }, [adminSettings, kitchenSettings, motoboySettings]);

  // Check if sound should play (anti-spam, already alerted, etc.)
  const shouldPlaySound = useCallback((panelType: SoundPanelType, orderId: string): boolean => {
    const settings = getSettings(panelType);

    // Check if enabled
    if (!settings?.enabled) {
      console.log(`[Sound] ${panelType} sounds disabled`);
      return false;
    }

    // Create a unique key for this order+panel combination
    const alertKey = `${panelType}:${orderId}`;
    
    // Check if already alerted for this panel
    if (alertedOrderIds.has(alertKey)) {
      console.log(`[Sound] Order ${orderId} already alerted for ${panelType}`);
      return false;
    }

    // Check anti-spam interval
    const now = Date.now();
    const lastPlayed = lastPlayedAtRef.current[panelType] || 0;
    const minInterval = (settings.min_interval_seconds || 3) * 1000;

    if (now - lastPlayed < minInterval) {
      console.log(`[Sound] Anti-spam: ${panelType} sound blocked (${now - lastPlayed}ms < ${minInterval}ms)`);
      return false;
    }

    return true;
  }, [getSettings, alertedOrderIds]);

  // Set visual playing state
  const setPlayingState = useCallback((panelType: SoundPanelType, playing: boolean) => {
    if (panelType === 'admin') {
      setIsPlayingAdmin(playing);
    } else if (panelType === 'kitchen') {
      setIsPlayingKitchen(playing);
    } else if (panelType === 'motoboy') {
      setIsPlayingMotoboy(playing);
    }
  }, []);

  // Play sound with fallback
  const playSoundWithFallback = useCallback((settings: SoundSettings, panelType: SoundPanelType): boolean => {
    try {
      soundPlayer.playSound(settings.sound_type, settings.volume);
      lastPlayedAtRef.current[panelType] = Date.now();
      setSoundPlaybackFailed(false);

      // Visual feedback
      setPlayingState(panelType, true);
      setTimeout(() => setPlayingState(panelType, false), 1000);

      console.log(`[Sound] ✓ Sound played for ${panelType}: ${settings.sound_type} @ ${settings.volume}`);
      return true;
    } catch (error) {
      console.error(`[Sound] ✗ Failed to play sound for ${panelType}:`, error);
      setSoundPlaybackFailed(true);
      
      // Show visual fallback
      toast.info('🔔 Novo evento!', {
        description: 'Som não disponível - verifique as configurações de áudio',
        duration: 4000,
      });
      
      return false;
    }
  }, [soundPlayer, setPlayingState]);

  // Play sound for a panel (legacy method)
  const playSound = useCallback((panelType: SoundPanelType, orderId: string): boolean => {
    if (!shouldPlaySound(panelType, orderId)) {
      return false;
    }

    const settings = getSettings(panelType);
    if (!settings) return false;

    return playSoundWithFallback(settings, panelType);
  }, [shouldPlaySound, getSettings, playSoundWithFallback]);

  // Play sound for a specific event type
  const playSoundForEvent = useCallback((event: SoundEventType, orderId: string, panel: SoundPanelType): boolean => {
    const allowedPanels = EVENT_PANEL_MAP[event] || [];
    
    if (!allowedPanels.includes(panel)) {
      console.log(`[Sound] Event ${event} not configured for panel ${panel}`);
      return false;
    }

    console.log(`[Sound] Event: ${event} for order ${orderId} on panel ${panel}`);
    return playSound(panel, orderId);
  }, [playSound]);

  // Preview sound without restrictions
  const previewSound = useCallback((soundType: SoundType, volume: number) => {
    try {
      soundPlayer.playSound(soundType, volume);
      console.log(`[Sound] Preview: ${soundType} @ ${volume}`);
    } catch (error) {
      console.error('[Sound] Preview failed:', error);
      toast.error('Não foi possível reproduzir o som de teste');
    }
  }, [soundPlayer]);

  // Mark order as alerted (with optional panel-specific key)
  const markOrderAsAlerted = useCallback((orderId: string, panel?: SoundPanelType) => {
    setAlertedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (panel) {
        newSet.add(`${panel}:${orderId}`);
      } else {
        // Mark for all panels
        newSet.add(`admin:${orderId}`);
        newSet.add(`kitchen:${orderId}`);
        newSet.add(`motoboy:${orderId}`);
      }
      return newSet;
    });
  }, []);

  // Start kitchen repeat
  const startKitchenRepeat = useCallback((orderId: string) => {
    if (!kitchenSettings?.repeat_enabled || isKitchenRepeating) return;

    console.log(`[Sound] Starting kitchen repeat for order ${orderId}`);
    setIsKitchenRepeating(true);
    kitchenRepeatStartTimeRef.current = Date.now();

    const repeatInterval = (kitchenSettings.repeat_interval_seconds || 30) * 1000;
    const maxDuration = (kitchenSettings.max_repeat_duration_seconds || 300) * 1000;

    kitchenRepeatIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - kitchenRepeatStartTimeRef.current;

      if (elapsed >= maxDuration) {
        console.log('[Sound] Kitchen repeat max duration reached');
        stopKitchenRepeat();
        return;
      }

      if (!document.hidden && kitchenSettings) {
        soundPlayer.playSound(kitchenSettings.sound_type, kitchenSettings.volume);
        setIsPlayingKitchen(true);
        setTimeout(() => setIsPlayingKitchen(false), 1000);
        console.log(`[Sound] Kitchen repeat sound played (${Math.round(elapsed / 1000)}s elapsed)`);
      }
    }, repeatInterval);
  }, [kitchenSettings, isKitchenRepeating, soundPlayer]);

  // Stop kitchen repeat
  const stopKitchenRepeat = useCallback(() => {
    if (kitchenRepeatIntervalRef.current) {
      clearInterval(kitchenRepeatIntervalRef.current);
      kitchenRepeatIntervalRef.current = null;
      console.log('[Sound] Kitchen repeat stopped');
    }
    setIsKitchenRepeating(false);
  }, []);

  // Stop all sounds
  const stopAllSounds = useCallback(() => {
    soundPlayer.stopCurrentSounds();
    stopKitchenRepeat();
    setIsPlayingAdmin(false);
    setIsPlayingKitchen(false);
    setIsPlayingMotoboy(false);
    console.log('[Sound] All sounds stopped');
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
        motoboySettings,
        isLoading,
        updateSettings,
        playSound,
        playSoundForEvent,
        previewSound,
        stopAllSounds,
        isPlayingAdmin,
        isPlayingKitchen,
        isPlayingMotoboy,
        alertedOrderIds,
        markOrderAsAlerted,
        startKitchenRepeat,
        stopKitchenRepeat,
        isKitchenRepeating,
        initializeAudio,
        isAudioInitialized,
        soundPlaybackFailed,
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
