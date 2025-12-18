import { useState } from 'react';
import { Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCart } from '@/lib/cart';
import { motion } from 'framer-motion';
import type { Product } from '@shared/schema';
import { isPreparedCategoryName } from '@shared/schema';

interface ProductCardProps {
  product: Product;
  categoryName?: string;
}

export function ProductCard({ product, categoryName }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [showStockAlert, setShowStockAlert] = useState(false);
  const cartItem = items.find(item => item.productId === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  // Produtos preparados não têm controle de estoque - check both isPrepared flag and category name
  const isPreparedProduct = product.isPrepared === true || (categoryName ? isPreparedCategoryName(categoryName) : false);
  const isOutOfStock = !isPreparedProduct && product.stock <= 0;
  const isLowStock = !isPreparedProduct && product.stock > 0 && product.stock <= 5;

  const handleAddItem = () => {
    // Produtos preparados podem ser adicionados sem limite de estoque
    if (!isPreparedProduct && (product.stock <= 0 || quantity >= product.stock)) {
      setShowStockAlert(true);
      return;
    }
    addItem(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Card 
        className="group h-full flex flex-col bg-gradient-to-b from-card/80 to-card overflow-hidden border border-primary/10 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 card-lift"
        data-testid={`card-product-${product.id}`}
      >
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-secondary/80 to-secondary">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <span className="text-7xl font-serif text-primary/40 group-hover:text-primary/60 transition-colors duration-500">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary" className="text-base px-4 py-2 bg-black/50 border border-white/20">
                Esgotado
              </Badge>
            </div>
          )}

          {isLowStock && !isOutOfStock && (
            <Badge 
              className="absolute top-3 right-3 bg-orange-500/90 text-white border-none text-xs"
            >
              Ultimas {product.stock}
            </Badge>
          )}

          {quantity > 0 && !isOutOfStock && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 left-3"
            >
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-sm border-none">
                {quantity}x
              </Badge>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4 gap-3">
          <div className="flex-1">
            <h3 
              className="font-semibold text-card-foreground text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-300"
              data-testid={`text-product-name-${product.id}`}
            >
              {product.name}
            </h3>
            
            {product.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="space-y-3 mt-auto">
            <div className="flex items-baseline gap-2">
              <span 
                className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent"
                data-testid={`text-product-price-${product.id}`}
              >
                {formatPrice(product.salePrice)}
              </span>
            </div>

            <div className="flex items-center justify-center">
              {isOutOfStock ? (
                <Button variant="secondary" size="sm" disabled className="w-full opacity-50">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Indisponivel
                </Button>
              ) : quantity > 0 ? (
                <div className="flex items-center justify-between w-full bg-secondary/50 rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md text-primary hover:bg-primary/20"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    data-testid={`button-decrease-${product.id}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span 
                    className="w-10 text-center font-bold text-lg text-card-foreground"
                    data-testid={`text-quantity-${product.id}`}
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md text-primary hover:bg-primary/20"
                    onClick={handleAddItem}
                    disabled={!isPreparedProduct && quantity >= product.stock}
                    data-testid={`button-increase-${product.id}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-400 hover:to-yellow-400 transition-all duration-300"
                  onClick={handleAddItem}
                  data-testid={`button-add-${product.id}`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showStockAlert} onOpenChange={setShowStockAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Produto Esgotado
            </DialogTitle>
            <DialogDescription className="text-base">
              O estoque de <strong>{product.name}</strong> esta zerado ou voce ja adicionou a quantidade maxima disponivel ({product.stock} unidades).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowStockAlert(false)} data-testid="button-close-stock-alert">
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
