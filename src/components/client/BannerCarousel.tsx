import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBanners, Banner } from '@/hooks/useBanners';
import { cn } from '@/lib/utils';

export function BannerCarousel() {
  const { banners, isLoading } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter(b => b.is_active && b.image_url);

  useEffect(() => {
    if (activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (isLoading || activeBanners.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div className="relative aspect-[21/9] md:aspect-[3/1]">
        <img
          src={currentBanner.image_url!}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Overlay with text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
          <div className="p-6 md:p-10 max-w-lg">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {currentBanner.title}
            </h2>
            {currentBanner.description && (
              <p className="text-white/90 text-sm md:text-base">
                {currentBanner.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/70"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
