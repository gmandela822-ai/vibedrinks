import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Search, 
  CreditCard, 
  Banknote, 
  QrCode,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Product, Category } from '@shared/schema';
import { type PaymentMethod, type Salesperson, SALESPERSON_LABELS, isPreparedCategoryName } from '@shared/schema';
import { CartContent } from '@/components/pdv-cart';

interface CartItem {
  product: Product;
  quantity: number;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export default function PDV() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, role, logout, isHydrated } = useAuth();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [salesperson, setSalesperson] = useState<Salesperson | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [changeFor, setChangeFor] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [manualDiscount, setManualDiscount] = useState('');
  const [stockAlertProduct, setStockAlertProduct] = useState<Product | null>(null);

  const isAuthorized = isHydrated && (role === 'pdv' || role === 'admin');

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    enabled: isAuthorized,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    enabled: isAuthorized,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Pedido criado com sucesso!' });
      setCart([]);
      setSalesperson(null);
      setNotes('');
      setPaymentMethod(null);
      setChangeFor('');
      setManualDiscount('');
      setIsPaymentDialogOpen(false);
      setIsCartOpen(false);
    },
    onError: () => {
      toast({ title: 'Erro ao criar pedido', variant: 'destructive' });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/admin-login');
  };

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(e.target.value);
  }, []);

  const handleDiscountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setManualDiscount(e.target.value);
  }, []);

  const handleSalespersonChange = useCallback((value: string) => {
    setSalesperson(value as Salesperson);
  }, []);

  useEffect(() => {
    if (isHydrated && role !== 'pdv' && role !== 'admin') {
      setLocation('/admin-login');
    }
  }, [isHydrated, role, setLocation]);

  if (!isHydrated || (role !== 'pdv' && role !== 'admin')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isProductPrepared = (product: Product): boolean => {
    if (product.isPrepared) return true;
    const category = categories.find(c => c.id === product.categoryId);
    return category ? isPreparedCategoryName(category.name) : false;
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const currentQty = existingItem?.quantity ?? 0;
    const isPrepared = isProductPrepared(product);
    
    if (!isPrepared && (product.stock <= 0 || currentQty >= product.stock)) {
      setStockAlertProduct(product);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    const isPrepared = item ? isProductPrepared(item.product) : false;
    
    if (item && delta > 0 && !isPrepared && item.quantity >= item.product.stock) {
      setStockAlertProduct(item.product);
      return;
    }
    
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.product.salePrice) * item.quantity, 0);
  const discountValue = parseFloat(manualDiscount) || 0;
  const total = Math.max(0, subtotal - discountValue);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const change = paymentMethod === 'cash' && changeFor ? parseFloat(changeFor) - total : 0;

  const handleFinalizeSale = () => {
    if (cart.length === 0) {
      toast({ title: 'Carrinho vazio', variant: 'destructive' });
      return;
    }
    if (!salesperson) {
      toast({ title: 'Selecione o balconista', variant: 'destructive' });
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) {
      toast({ title: 'Selecione um método de pagamento', variant: 'destructive' });
      return;
    }

    const orderData = {
      userId: user?.id,
      orderType: 'counter',
      status: 'accepted',
      subtotal: subtotal.toFixed(2),
      deliveryFee: '0.00',
      discount: discountValue.toFixed(2),
      total: total.toFixed(2),
      paymentMethod,
      changeFor: paymentMethod === 'cash' && changeFor ? changeFor : null,
      notes: notes || null,
      customerName: salesperson ? SALESPERSON_LABELS[salesperson] : 'Balconista',
      salesperson: salesperson || null,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.salePrice,
        totalPrice: (Number(item.product.salePrice) * item.quantity).toFixed(2),
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'cash', label: 'Dinheiro', icon: Banknote },
    { id: 'pix', label: 'PIX', icon: QrCode },
    { id: 'card_debit', label: 'Débito', icon: CreditCard },
    { id: 'card_credit', label: 'Crédito', icon: CreditCard },
  ];

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="bg-black border-b border-primary/20 py-2 px-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="font-serif text-lg sm:text-xl text-primary">PDV</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline">
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground px-2"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary border-primary/30 text-sm"
                data-testid="input-search-product"
              />
            </div>

            <div className="relative flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => scrollCategories('left')}
                data-testid="button-scroll-left"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                ref={categoryScrollRef}
                className="flex gap-1.5 overflow-x-auto flex-1 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="flex-shrink-0 text-xs px-3"
                  data-testid="button-category-all"
                >
                  Todos
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex-shrink-0 whitespace-nowrap text-xs px-3"
                    data-testid={`button-category-${cat.id}`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => scrollCategories('right')}
                data-testid="button-scroll-right"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 sm:p-3 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {filteredProducts.map((product) => {
                const isPrepared = isProductPrepared(product);
                const isOutOfStock = !isPrepared && product.stock <= 0;
                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer hover-elevate active-elevate-2 ${isOutOfStock ? 'opacity-50' : ''}`}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardContent className="p-2 sm:p-3">
                      <h3 className="font-medium text-xs sm:text-sm mb-1 line-clamp-2 min-h-[2rem]">{product.name}</h3>
                      <p className="text-primary font-bold text-sm sm:text-base">{formatCurrency(product.salePrice)}</p>
                      {isPrepared ? (
                        <Badge variant="default" className="mt-1 text-xs bg-green-600">
                          Disponivel
                        </Badge>
                      ) : isOutOfStock ? (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          Esgotado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {product.stock}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex w-80 xl:w-96 bg-card border-l border-border flex-col">
          <CartContent
            salesperson={salesperson}
            cart={cart}
            notes={notes}
            manualDiscount={manualDiscount}
            discountValue={discountValue}
            subtotal={subtotal}
            total={total}
            onSalespersonChange={handleSalespersonChange}
            onNoteChange={handleNoteChange}
            onDiscountChange={handleDiscountChange}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onFinalizeSale={handleFinalizeSale}
          />
        </aside>
      </div>

      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="h-14 w-14 rounded-full shadow-lg relative"
              data-testid="button-open-cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] sm:w-[380px] p-0">
            <SheetHeader className="p-3 border-b">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho ({cartItemCount})
              </SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-4rem)]">
              <CartContent
                salesperson={salesperson}
                cart={cart}
                notes={notes}
                manualDiscount={manualDiscount}
                discountValue={discountValue}
                subtotal={subtotal}
                total={total}
                onSalespersonChange={handleSalespersonChange}
                onNoteChange={handleNoteChange}
                onDiscountChange={handleDiscountChange}
                onRemoveFromCart={removeFromCart}
                onUpdateQuantity={updateQuantity}
                onFinalizeSale={handleFinalizeSale}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-sm sm:max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Pagamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-3 bg-secondary rounded-lg">
              <p className="text-muted-foreground text-xs sm:text-sm">Total a Pagar</p>
              <p className="text-3xl sm:text-4xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>

            <div>
              <Label className="mb-2 block text-sm">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={paymentMethod === method.id ? 'default' : 'outline'}
                    className="h-14 sm:h-16 flex-col gap-1"
                    onClick={() => setPaymentMethod(method.id)}
                    data-testid={`button-payment-${method.id}`}
                  >
                    <method.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div>
                <Label htmlFor="changeFor" className="text-sm">Troco para</Label>
                <Input
                  id="changeFor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value)}
                  className="bg-secondary border-primary/30 text-base"
                  data-testid="input-change-for"
                />
                {change > 0 && (
                  <p className="text-green-500 mt-2 text-base font-semibold">
                    Troco: {formatCurrency(change)}
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full py-5 text-base"
              disabled={!paymentMethod || createOrderMutation.isPending}
              onClick={handleConfirmPayment}
              data-testid="button-confirm-payment"
            >
              {createOrderMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!stockAlertProduct} onOpenChange={() => setStockAlertProduct(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Estoque Insuficiente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base">
              O produto <strong>{stockAlertProduct?.name}</strong> está com estoque zerado ou você já adicionou a quantidade máxima disponível ({stockAlertProduct?.stock ?? 0} unidades).
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStockAlertProduct(null)} data-testid="button-close-stock-alert">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
