import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Banner } from '@shared/schema';

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeBanners = banners.filter(b => b.isActive).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % activeBanners.length);
  };

  return (
    <section className="py-8 px-4" data-testid="section-banners">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden gold-glow-sm">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {activeBanners.map((banner) => (
              <div
                key={banner.id}
                className="min-w-full relative aspect-[4/1]"
                data-testid={`banner-${banner.id}`}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center">
                  <div className="p-6 md:p-12 max-w-xl">
                    <h3 className="font-serif text-2xl md:text-4xl font-bold text-primary mb-2">
                      {banner.title}
                    </h3>
                    {banner.description && (
                      <p className="text-white/80 text-sm md:text-base mb-4">
                        {banner.description}
                      </p>
                    )}
                    {banner.linkUrl && (
                      <Button variant="outline" className="border-primary text-primary">
                        Ver mais
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeBanners.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={goToPrev}
                data-testid="button-banner-prev"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={goToNext}
                data-testid="button-banner-next"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {activeBanners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-primary w-6' : 'bg-white/50'
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Ir para banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
