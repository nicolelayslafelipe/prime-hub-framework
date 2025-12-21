import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navigation, MapPin, Loader2, ExternalLink } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  label?: string;
}

interface DeliveryMapProps {
  establishmentLocation?: Location;
  deliveryLocation: Location;
  customerName?: string;
  className?: string;
}

export function DeliveryMap({
  establishmentLocation,
  deliveryLocation,
  customerName,
  className,
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    async function fetchToken() {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/get-mapbox-token`);
        const data = await response.json();
        
        if (data.success && data.token) {
          setMapboxToken(data.token);
        } else {
          setError('Token não disponível');
        }
      } catch (err) {
        console.error('[DeliveryMap] Error fetching token:', err);
        setError('Erro ao carregar mapa');
      }
    }

    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;
        await import('mapbox-gl/dist/mapbox-gl.css');

        mapboxgl.accessToken = mapboxToken;

        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [deliveryLocation.lng, deliveryLocation.lat],
          zoom: 14,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add delivery marker
        new mapboxgl.Marker({ color: '#ef4444' })
          .setLngLat([deliveryLocation.lng, deliveryLocation.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>${customerName || 'Entrega'}</strong><br/>${deliveryLocation.label || 'Local de entrega'}`
            )
          )
          .addTo(map);

        // Add establishment marker if provided
        if (establishmentLocation) {
          new mapboxgl.Marker({ color: '#3b82f6' })
            .setLngLat([establishmentLocation.lng, establishmentLocation.lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<strong>Estabelecimento</strong><br/>${establishmentLocation.label || 'Local de origem'}`
              )
            )
            .addTo(map);

          // Fit bounds to show both markers
          const bounds = new mapboxgl.LngLatBounds()
            .extend([deliveryLocation.lng, deliveryLocation.lat])
            .extend([establishmentLocation.lng, establishmentLocation.lat]);
          
          map.fitBounds(bounds, { padding: 50 });
        }

        mapRef.current = map;
        setIsLoading(false);

        return () => {
          map.remove();
        };
      } catch (err) {
        console.error('[DeliveryMap] Error initializing map:', err);
        setError('Erro ao inicializar mapa');
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken, deliveryLocation, establishmentLocation, customerName]);

  // Open external navigation
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;
    window.open(url, '_blank');
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${deliveryLocation.lat},${deliveryLocation.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openGoogleMaps}>
              <Navigation className="h-4 w-4 mr-2" />
              Google Maps
            </Button>
            <Button variant="outline" size="sm" onClick={openWaze}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Waze
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="relative rounded-lg overflow-hidden border border-border">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={mapContainer} className="w-full h-48" />
      </div>
      
      <div className="flex gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={openGoogleMaps}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Google Maps
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={openWaze}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Waze
        </Button>
      </div>
    </div>
  );
}
