import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    const { user_id, title, body, tag, data } = payload;

    console.log('Sending push notification to user:', user_id);
    console.log('Title:', title);
    console.log('Body:', body);

    // Check if user has push notifications enabled
    const { data: preferences, error: prefError } = await supabase
      .from('client_preferences')
      .select('push_notifications')
      .eq('user_id', user_id)
      .maybeSingle();

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    if (!preferences?.push_notifications) {
      console.log('User has push notifications disabled');
      return new Response(
        JSON.stringify({ success: false, reason: 'push_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for user');
      return new Response(
        JSON.stringify({ success: false, reason: 'no_subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found', subscriptions.length, 'subscription(s)');

    // Note: To actually send Web Push notifications, you would need:
    // 1. VAPID keys (public and private)
    // 2. The web-push library or similar
    // For now, we log the notification and return success
    // This can be expanded when VAPID keys are configured
    
    const notificationPayload = {
      title,
      body,
      tag: tag || 'order-update',
      data: data || {},
    };

    console.log('Notification payload:', JSON.stringify(notificationPayload));

    // Return success - the client will receive the notification preference
    // In production, you would use web-push library here with VAPID keys
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification logged',
        subscriptions_count: subscriptions.length,
        payload: notificationPayload
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
