import { useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { Category } from '@shared/schema';
import { TRENDING_CATEGORY_ID } from '@/pages/Home';
import { getCategoryIcon } from '@/lib/category-icons';

interface CategoryCarouselProps {
  categories: (Category & { salesCount?: number })[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  showTrending?: boolean;
}

export function CategoryCarousel({ categories, selectedCategory, onSelectCategory, showTrending = false }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Filter active categories and sort by popularity (salesCount descending)
  // Clone array before sorting to avoid mutating original query data
  const activeCategories = [...categories]
    .filter(c => c.isActive)
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = 200;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    if (direction === 'right') {
      // If at the end, loop back to start
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      // If at the start, loop to the end
      if (container.scrollLeft <= 10) {
        container.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  if (activeCategories.length === 0) return null;

  const CategoryButton = ({ 
    isSelected, 
    onClick, 
    icon: Icon, 
    label, 
    variant = 'default',
    testId
  }: { 
    isSelected: boolean; 
    onClick: () => void; 
    icon: any; 
    label: string;
    variant?: 'default' | 'trending';
    testId: string;
  }) => {
    const baseColors = variant === 'trending' 
      ? {
          selected: 'from-orange-500/30 to-red-500/20 border-orange-500',
          unselected: 'from-secondary/60 to-secondary/40 border-orange-500/30 hover:border-orange-500/60',
          iconBg: isSelected ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-secondary/80 border border-orange-500/30',
          iconColor: isSelected ? 'text-white' : 'text-orange-500',
          textColor: isSelected ? 'text-orange-400' : 'text-white/80',
          glow: '0 0 20px rgba(249, 115, 22, 0.4)'
        }
      : {
          selected: 'from-primary/30 to-amber-500/20 border-primary',
          unselected: 'from-secondary/60 to-secondary/40 border-primary/20 hover:border-primary/50',
          iconBg: isSelected ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : 'bg-secondary/80 border border-primary/30',
          iconColor: isSelected ? 'text-black' : 'text-primary/80',
          textColor: isSelected ? 'text-primary' : 'text-white/80',
          glow: '0 0 20px rgba(255, 215, 0, 0.3)'
        };

    return (
      <button
        onClick={onClick}
        className={`flex flex-col items-center gap-3 min-w-[110px] p-4 rounded-2xl transition-all duration-300 bg-gradient-to-b border-2 backdrop-blur-sm hover-elevate active-elevate-2 ${
          isSelected ? baseColors.selected : baseColors.unselected
        }`}
        style={isSelected ? { boxShadow: baseColors.glow } : {}}
        data-testid={testId}
      >
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${baseColors.iconBg}`}>
          <Icon className={`h-6 w-6 ${baseColors.iconColor}`} />
        </div>
        <span className={`text-sm font-medium text-center transition-colors duration-300 ${baseColors.textColor}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <section className="py-8 px-4" data-testid="section-categories">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
            Categorias
          </h2>
          
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => scroll('left')}
              data-testid="button-category-prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => scroll('right')}
              data-testid="button-category-next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1 -mx-1"
            data-testid="carousel-categories"
          >
            <CategoryButton
              isSelected={selectedCategory === null}
              onClick={() => onSelectCategory(null)}
              icon={() => <span className="text-xl font-bold">A</span>}
              label="Todos"
              testId="button-category-all"
            />

            {showTrending && (
              <motion.button
                onClick={() => onSelectCategory(TRENDING_CATEGORY_ID)}
                className={`relative flex flex-col items-center gap-3 min-w-[120px] p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm overflow-visible ${
                  selectedCategory === TRENDING_CATEGORY_ID
                    ? 'bg-gradient-to-b from-amber-500/40 to-yellow-600/30 border-2 border-amber-400'
                    : 'bg-gradient-to-b from-amber-500/20 to-yellow-600/10 border-2 border-amber-500/40 hover:border-amber-400/70'
                }`}
                style={selectedCategory === TRENDING_CATEGORY_ID ? { boxShadow: '0 0 30px rgba(255, 191, 0, 0.5), 0 0 60px rgba(255, 191, 0, 0.2)' } : { boxShadow: '0 0 15px rgba(255, 191, 0, 0.2)' }}
                data-testid="button-category-trending"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div 
                  className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-2xl opacity-30 blur-sm"
                  animate={{ 
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                <motion.div 
                  className={`relative w-14 h-14 rounded-xl flex items-center justify-center ${
                    selectedCategory === TRENDING_CATEGORY_ID 
                      ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500' 
                      : 'bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-400/50'
                  }`}
                  animate={{ 
                    boxShadow: ['0 0 10px rgba(255, 191, 0, 0.3)', '0 0 20px rgba(255, 191, 0, 0.5)', '0 0 10px rgba(255, 191, 0, 0.3)']
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <TrendingUp className={`h-6 w-6 ${selectedCategory === TRENDING_CATEGORY_ID ? 'text-black' : 'text-amber-400'}`} />
                </motion.div>
                <span className={`relative text-sm font-bold text-center transition-colors duration-300 ${
                  selectedCategory === TRENDING_CATEGORY_ID ? 'text-amber-300' : 'text-amber-400/90'
                }`}>
                  Em Alta
                </span>
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
              </motion.button>
            )}

            {activeCategories.map((category) => {
              const IconComponent = getCategoryIcon(category.iconUrl);
              return (
                <CategoryButton
                  key={category.id}
                  isSelected={selectedCategory === category.id}
                  onClick={() => onSelectCategory(category.id)}
                  icon={IconComponent}
                  label={category.name}
                  testId={`button-category-${category.id}`}
                />
              );
            })}
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
        </div>
      </div>
    </section>
  );
}
