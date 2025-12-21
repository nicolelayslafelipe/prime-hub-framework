import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Check if browser supports notifications
const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export function useMotoboyNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsSubscribed(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsSubscribed(!!data);
    } catch (error) {
      console.error('[PushNotif] Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PushNotif] Service workers not supported');
      return null;
    }

    try {
      // Check for existing registration
      let registration = await navigator.serviceWorker.getRegistration('/sw.js');
      
      if (!registration) {
        console.log('[PushNotif] Registering service worker...');
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PushNotif] Service worker registered:', registration);
      }

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      swRegistrationRef.current = registration;
      return registration;
    } catch (error) {
      console.error('[PushNotif] Service worker registration failed:', error);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermissionState('unsupported');
      setIsLoading(false);
      return;
    }
    
    setPermissionState(Notification.permission);
    registerServiceWorker();
    checkSubscription();

    // Listen for notification clicks from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        window.location.href = event.data.url;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [checkSubscription, registerServiceWorker]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('Faça login para ativar notificações');
      return false;
    }

    if (!isNotificationSupported()) {
      toast.error('Seu navegador não suporta notificações push');
      return false;
    }

    setIsProcessing(true);

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        toast.error('Permissão negada', {
          description: 'Habilite notificações nas configurações do navegador',
        });
        return false;
      }

      // Ensure service worker is registered
      let registration = swRegistrationRef.current;
      if (!registration) {
        registration = await registerServiceWorker();
      }

      if (!registration) {
        console.warn('[PushNotif] No service worker registration');
      }

      // Store subscription record
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: `browser-${user.id}-${Date.now()}`,
          p256dh: 'local-notification',
          auth_key: 'local-notification',
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setIsSubscribed(true);
      
      // Show test notification
      if (registration) {
        registration.showNotification('Notificações Ativadas! 🔔', {
          body: 'Você receberá alertas quando houver pedidos disponíveis.',
          icon: '/favicon.ico',
          tag: 'subscription-success'
        });
      }
      
      toast.success('Notificações ativadas!');
      return true;
    } catch (error) {
      console.error('[PushNotif] Error subscribing:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setIsSubscribed(false);
      toast.success('Notificações desativadas');
      return true;
    } catch (error) {
      console.error('[PushNotif] Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

  // Show a local notification (for use within the app)
  const showNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<boolean> => {
    if (permissionState !== 'granted') {
      console.warn('[PushNotif] Notifications not permitted');
      return false;
    }

    try {
      const registration = swRegistrationRef.current || await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options,
      });
      
      console.log('[PushNotif] Notification shown:', title);
      return true;
    } catch (error) {
      console.error('[PushNotif] Error showing notification:', error);
      return false;
    }
  }, [permissionState]);

  // Toggle subscription
  const toggleSubscription = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSubscribed,
    isLoading,
    isProcessing,
    permissionState,
    isSupported: isNotificationSupported(),
    subscribe,
    unsubscribe,
    toggleSubscription,
    showNotification,
    refetch: checkSubscription,
  };
}
