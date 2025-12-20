import { useConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';

interface HeroBannerProps {
  className?: string;
}

export function HeroBanner({ className }: HeroBannerProps) {
  const { config } = useConfig();
  
  const { banner, bannerText, showBanner } = config.establishment;

  if (!showBanner || !banner) {
    return null;
  }

  return (
    <div 
      className={cn(
        'relative w-full h-32 md:h-40 overflow-hidden rounded-xl',
        className
      )}
    >
      <img 
        src={banner}
        alt="Banner promocional"
        className="w-full h-full object-cover"
      />
      {/* Overlay gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      
      {bannerText && (
        <div className="absolute inset-0 flex items-center p-6">
          <div className="max-w-md">
            <p className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-lg">
              {bannerText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
