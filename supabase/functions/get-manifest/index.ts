import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/manifest+json',
};

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch establishment settings
    const { data: settings, error } = await supabase
      .from('establishment_settings')
      .select('name, logo, primary_color, description')
      .eq('id', SETTINGS_ID)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
    }

    const appName = settings?.name || 'DeliveryOS';
    const appDescription = settings?.description || 'Sistema de Delivery';
    const themeColor = settings?.primary_color || '#7c3aed';
    const logoUrl = settings?.logo || null;

    // Generate icons array - use logo if available, fallback to default icons
    const icons = [];
    
    if (logoUrl) {
      icons.push(
        {
          src: logoUrl,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: logoUrl,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      );
    } else {
      icons.push(
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      );
    }

    const manifest = {
      name: appName,
      short_name: appName.substring(0, 12),
      description: appDescription,
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      orientation: 'portrait-primary',
      scope: '/',
      icons: icons,
      categories: ['food', 'shopping', 'lifestyle'],
      screenshots: [],
      shortcuts: [
        {
          name: 'Ver Pedidos',
          short_name: 'Pedidos',
          description: 'Acompanhe seus pedidos',
          url: '/orders',
          icons: [{ src: logoUrl || '/icons/icon-192x192.png', sizes: '192x192' }]
        }
      ],
      related_applications: [],
      prefer_related_applications: false
    };

    console.log('Manifest generated:', { appName, themeColor, hasLogo: !!logoUrl });

    return new Response(JSON.stringify(manifest, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    
    // Return default manifest on error
    const defaultManifest = {
      name: 'DeliveryOS',
      short_name: 'DeliveryOS',
      description: 'Sistema de Delivery',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#7c3aed',
      orientation: 'portrait-primary',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
      ]
    };

    return new Response(JSON.stringify(defaultManifest, null, 2), {
      headers: corsHeaders,
    });
  }
});
