import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';
import { Wine, Loader2, Plus, Minus, ShoppingCart, Sparkles, Pause, Play, GripHorizontal } from 'lucide-react';
import type { Product, Category } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { getStorageUrl } from '@/lib/supabase';

interface SpecialDrinksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpecialDrinksModal({ open, onOpenChange }: SpecialDrinksModalProps) {
  const { items, addItem, updateQuantity } = useCart();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const dragStartX = useRef(0);
  const dragStartTime = useRef(0);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const specialCategoryNames = ['CAIPIRINHAS', 'DRINKS ESPECIAIS', 'COPAO', 'BATIDAS'];

  const specialCategories = categories.filter(c => 
    c.isActive && 
    specialCategoryNames.some(name => c.name.toLowerCase() === name.toLowerCase())
  );

  useEffect(() => {
    if (open && specialCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(specialCategories[0].id);
    }
  }, [open, specialCategories, selectedCategory]);

  useEffect(() => {
    if (!open) {
      setSelectedCategory(null);
      setCurrentIndex(0);
    }
  }, [open]);

  const specialDrinks = products.filter(p => {
    if (!p.isActive) return false;
    if (!selectedCategory) return false;
    return p.categoryId === selectedCategory;
  });

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (!isAutoPlaying || specialDrinks.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % specialDrinks.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, specialDrinks.length, selectedCategory]);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.productId === productId);
    return item?.quantity ?? 0;
  };

  const handleAddToCart = (product: Product) => {
    if (!product.isPrepared) {
      const cartItem = items.find(i => i.productId === product.id);
      const currentQty = cartItem?.quantity ?? 0;
      
      if (product.stock <= 0 || currentQty >= product.stock) {
        toast({
          title: 'Estoque Insuficiente',
          description: `O produto ${product.name} está com estoque zerado ou você já adicionou a quantidade máxima disponível.`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    addItem(product);
    toast({
      title: 'Adicionado ao carrinho',
      description: `${product.name} foi adicionado.`,
    });
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragStartX.current = 'touches' in e ? e.touches[0].clientX : e.clientX;
    dragStartTime.current = Date.now();
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const deltaX = dragStartX.current - endX;
    const deltaTime = Date.now() - dragStartTime.current;
    
    if (Math.abs(deltaX) > 30 && deltaTime < 500) {
      if (deltaX > 0) {
        setCurrentIndex(prev => (prev + 1) % specialDrinks.length);
      } else {
        setCurrentIndex(prev => prev === 0 ? specialDrinks.length - 1 : prev - 1);
      }
      setIsAutoPlaying(false);
    }
  };

  const isLoading = productsLoading || categoriesLoading;
  const currentDrink = specialDrinks[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl">
            <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Wine className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent truncate">
              Drinks Especiais
            </span>
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400 flex-shrink-0" />
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-80px)]">
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {specialCategories.map(category => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setIsAutoPlaying(true);
                      }}
                      className={`text-xs sm:text-sm ${selectedCategory === category.id ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}`}
                      data-testid={`button-filter-${category.id}`}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>

                {specialDrinks.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Wine className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm sm:text-base">Nenhum drink especial disponível no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {currentIndex + 1} de {specialDrinks.length}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        aria-label={isAutoPlaying ? 'Pausar carrossel' : 'Iniciar carrossel'}
                        data-testid="button-toggle-autoplay"
                        className="h-8 text-xs sm:text-sm"
                      >
                        {isAutoPlaying ? (
                          <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        ) : (
                          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        )}
                        {isAutoPlaying ? 'Pausar' : 'Iniciar'}
                      </Button>
                    </div>

                    <AnimatePresence mode="wait">
                      {currentDrink && (
                        <motion.div
                          key={currentDrink.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          onMouseDown={handleDragStart}
                          onMouseUp={handleDragEnd}
                          onTouchStart={handleDragStart}
                          onTouchEnd={handleDragEnd}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <Card 
                            className="overflow-hidden border-2 border-purple-500 shadow-lg shadow-purple-500/20"
                            data-testid={`card-special-drink-${currentDrink.id}`}
                          >
                            <div className="flex flex-col">
                              <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                                {currentDrink.imageUrl ? (
                                  <img
                                    src={getStorageUrl(currentDrink.imageUrl)}
                                    alt={currentDrink.name}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Wine className="h-16 w-16 text-purple-400/50" />
                                  </div>
                                )}
                                
                                {!currentDrink.isPrepared && currentDrink.stock <= 0 && (
                                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <Badge variant="secondary" className="text-xs">Esgotado</Badge>
                                  </div>
                                )}

                                <Badge 
                                  className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 border-none text-xs py-0.5 px-2"
                                >
                                  Especial
                                </Badge>
                              </div>
                              
                              <div className="p-3 flex flex-col justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold text-sm line-clamp-2 mb-0.5">
                                    {currentDrink.name}
                                  </h3>
                                  {currentDrink.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {currentDrink.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-base text-purple-400">
                                    {formatPrice(currentDrink.salePrice)}
                                  </span>
                                  
                                  {!((!currentDrink.isPrepared) && currentDrink.stock <= 0) && (
                                    <>
                                      {getCartQuantity(currentDrink.id) === 0 ? (
                                        <Button
                                          size="sm"
                                          onClick={() => handleAddToCart(currentDrink)}
                                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs h-7"
                                          data-testid={`button-add-${currentDrink.id}`}
                                        >
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add
                                        </Button>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className="h-6 w-6"
                                            onClick={() => updateQuantity(currentDrink.id, getCartQuantity(currentDrink.id) - 1)}
                                            data-testid={`button-decrease-${currentDrink.id}`}
                                          >
                                            <Minus className="h-2.5 w-2.5" />
                                          </Button>
                                          <span className="w-5 text-center font-bold text-xs">
                                            {getCartQuantity(currentDrink.id)}
                                          </span>
                                          <Button
                                            size="icon"
                                            className="h-6 w-6 bg-gradient-to-r from-purple-500 to-pink-500"
                                            onClick={() => updateQuantity(currentDrink.id, getCartQuantity(currentDrink.id) + 1)}
                                            data-testid={`button-increase-${currentDrink.id}`}
                                          >
                                            <Plus className="h-2.5 w-2.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-center gap-0.5 px-2">
                        <GripHorizontal className="h-2.5 w-2.5 text-purple-400/40 flex-shrink-0" />
                        <div className="text-xs text-purple-400/50 text-center flex-1">
                          Deslize
                        </div>
                        <GripHorizontal className="h-2.5 w-2.5 text-purple-400/40 flex-shrink-0" />
                      </div>

                      {specialDrinks.length > 1 && (
                        <div 
                          className="flex gap-0.5 justify-center py-0.5"
                          role="tablist"
                          aria-label="Navegacao do carrossel"
                        >
                          {specialDrinks.slice(0, 10).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentIndex(i)}
                              className={`rounded-full transition-all flex-shrink-0 ${
                                i === currentIndex 
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 h-1 w-3' 
                                  : 'bg-purple-500/30 h-0.5 w-1'
                              }`}
                              role="tab"
                              aria-selected={i === currentIndex}
                              aria-label={`Ir para drink ${i + 1}`}
                              data-testid={`button-dot-${i}`}
                            />
                          ))}
                          {specialDrinks.length > 10 && (
                            <span className="text-xs text-muted-foreground ml-0.5">+{specialDrinks.length - 10}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 sm:pt-4 mt-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-sm sm:text-base" 
                    size="default"
                    onClick={() => onOpenChange(false)}
                    data-testid="button-close-special-drinks"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Continuar Comprando
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
