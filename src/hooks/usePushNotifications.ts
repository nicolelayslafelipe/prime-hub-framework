import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  created_at: string;
}

// Check if browser supports notifications
const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');

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
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Check permission state
  useEffect(() => {
    if (!isNotificationSupported()) {
      setPermissionState('unsupported');
      setIsLoading(false);
      return;
    }
    
    setPermissionState(Notification.permission);
    checkSubscription();
  }, [checkSubscription]);

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

      // Register service worker if not registered
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        // Create minimal service worker for push notifications
        const swContent = `
          self.addEventListener('push', function(event) {
            const data = event.data ? event.data.json() : {};
            const title = data.title || 'Nova notificação';
            const options = {
              body: data.body || '',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: data.tag || 'default',
              data: data.data || {}
            };
            event.waitUntil(self.registration.showNotification(title, options));
          });
          
          self.addEventListener('notificationclick', function(event) {
            event.notification.close();
            if (event.notification.data && event.notification.data.url) {
              event.waitUntil(clients.openWindow(event.notification.data.url));
            }
          });
        `;
        
        const blob = new Blob([swContent], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(blob);
        
        try {
          registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
          await navigator.serviceWorker.ready;
        } catch (swError) {
          console.error('Service worker registration failed:', swError);
          // Continue without service worker - we can still store preference
        }
      }

      // For now, store a placeholder subscription since we don't have VAPID keys
      // This allows tracking user preference
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: `browser-${navigator.userAgent.slice(0, 50)}`,
          p256dh: 'placeholder',
          auth_key: 'placeholder',
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Notificações ativadas!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

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
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [user]);

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
    refetch: checkSubscription,
  };
}
