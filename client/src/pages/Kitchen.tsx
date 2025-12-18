import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChefHat, Package, LogOut, Truck, User as UserIcon, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useOrderUpdates } from '@/hooks/use-order-updates';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ExpandableOrderCard } from '@/components/ExpandableOrderCard';
import type { Order, OrderItem, Product } from '@shared/schema';
import { ORDER_TYPE_LABELS, type OrderStatus, type OrderType, PREPARED_CATEGORIES, isPreparedCategoryName } from '@shared/schema';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface OrderWithItems extends Order {
  items: OrderItem[];
  userName?: string;
  userWhatsapp?: string;
}

interface SelectedIngredient {
  productId: string;
  quantity: number;
  shouldDeductStock: boolean;
}

export default function Kitchen() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { role, logout } = useAuth();
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const { playOnce, playMultiple } = useNotificationSound();
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedOrderForIngredients, setSelectedOrderForIngredients] = useState<{ orderId: string; itemId: string; categoryName: string } | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredient[]>([]);

  useOrderUpdates({
    onConnected: () => setIsSSEConnected(true),
    onDisconnected: () => setIsSSEConnected(false),
    onOrderCreated: () => {
      playMultiple(3);
      toast({ title: 'Novo pedido recebido!' });
    },
    onOrderStatusChanged: (data) => {
      if (data.status === 'accepted') {
        playOnce();
        toast({ title: 'Novo pedido na fila!' });
      }
      if (data.status === 'ready') {
        playOnce();
        toast({ title: 'Pedido pronto para entrega!' });
      }
    },
  });

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: isSSEConnected ? 30000 : 5000,
  });

  const { data: users = [] } = useQuery<{ id: string; name: string; whatsapp: string }[]>({
    queryKey: ['/api/users'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/categories'],
  });

  const orderIds = orders.map(o => o.id).join(',');
  
  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items', orderIds],
    queryFn: async () => {
      if (!orderIds) return [];
      const res = await fetch(`/api/order-items?orderIds=${encodeURIComponent(orderIds)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: orders.length > 0,
    refetchInterval: isSSEConnected ? 30000 : 5000,
  });

  const ordersWithItems: OrderWithItems[] = orders.map(order => {
    const user = users.find(u => u.id === order.userId);
    return {
      ...order,
      items: orderItems.filter(item => item.orderId === order.id),
      userName: user?.name,
      userWhatsapp: user?.whatsapp,
    };
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      return apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const addIngredientMutation = useMutation({
    mutationFn: async ({ orderId, itemId, ingredientProductId, quantity, shouldDeductStock }: { orderId: string; itemId: string; ingredientProductId: string; quantity: number; shouldDeductStock: boolean }) => {
      return apiRequest('POST', `/api/orders/${orderId}/items/${itemId}/ingredients`, { ingredientProductId, quantity, shouldDeductStock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Ingrediente adicionado!' });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar ingrediente', variant: 'destructive' });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/admin-login');
  };

  if (role !== 'kitchen' && role !== 'admin') {
    setLocation('/admin-login');
    return null;
  }

  const acceptedOrders = ordersWithItems.filter(o => o.status === 'accepted');
  const preparingOrders = ordersWithItems.filter(o => o.status === 'preparing');
  const readyOrders = ordersWithItems.filter(o => o.status === 'ready');

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const renderOrderActions = (order: OrderWithItems, status: string) => {
    if (status === 'accepted') {
      return (
        <div className="flex flex-col gap-2">
          <Button
            className="w-full bg-primary text-primary-foreground py-4 text-base font-semibold"
            onClick={() => {
              const item = order.items?.[0];
              if (item && selectedOrderForIngredients?.itemId !== item.id) {
                setSelectedOrderForIngredients({ orderId: order.id, itemId: item.id, categoryName: "" });
              } else {
                updateStatusMutation.mutate({ orderId: order.id, status: 'preparing' });
              }
            }}
            disabled={updateStatusMutation.isPending}
            data-testid={`button-start-${order.id}`}
          >
            <ChefHat className="h-5 w-5 mr-2" />
            Iniciar Producao
          </Button>
        </div>
      );
    }
    if (status === 'preparing') {
      return (
        <Button
          className="w-full bg-green-600 text-white py-4 text-base font-semibold"
          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
          disabled={updateStatusMutation.isPending}
          data-testid={`button-ready-${order.id}`}
        >
          <Package className="h-5 w-5 mr-2" />
          Pedido Pronto
        </Button>
      );
    }
    if (status === 'ready') {
      const isDelivery = order.orderType === 'delivery';
      if (!isDelivery) {
        return (
          <Button
            className="w-full bg-cyan-600 text-white py-4 text-base font-semibold"
            onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
            disabled={updateStatusMutation.isPending}
            data-testid={`button-pickup-${order.id}`}
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Cliente Retirou
          </Button>
        );
      }
      return null;
    }
    return null;
  };

  // Filtrar APENAS categorias ICE e CERVEJAS
  const allowedCategoryNames = ["ICE", "CERVEJAS"];
  const allowedCategoryIds = new Set(
    categories
      .filter((c: { id: string; name: string }) => 
        allowedCategoryNames.some(name => c.name.toUpperCase().includes(name))
      )
      .map((c: { id: string; name: string }) => c.id)
  );

  const ingredientsToShow = allProducts.filter(p => {
    const isFromAllowedCategory = allowedCategoryIds.has(p.categoryId);
    const matchesSearch = p.name.toLowerCase().includes(ingredientSearch.toLowerCase());
    const hasStock = p.stock > 0;
    
    return matchesSearch && hasStock && isFromAllowedCategory;
  }).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={!!selectedOrderForIngredients} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrderForIngredients(null);
          setSelectedIngredients([]);
          setIngredientSearch("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecione Ingredientes Usados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Procurar ingrediente..."
              value={ingredientSearch}
              onChange={(e) => setIngredientSearch(e.target.value)}
              data-testid="input-ingredient-search"
            />
            <Command>
              <CommandList>
                <CommandEmpty>Nenhum ingrediente encontrado</CommandEmpty>
                <CommandGroup>
                  {ingredientsToShow.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => {
                        // Toggle ingredient in selected list
                        setSelectedIngredients(prev => {
                          const existing = prev.find(ing => ing.productId === product.id);
                          if (existing) {
                            return prev.filter(ing => ing.productId !== product.id);
                          }
                          return [...prev, { productId: product.id, quantity: 1, shouldDeductStock: true }];
                        });
                      }}
                      data-testid={`item-ingredient-${product.id}`}
                    >
                      <Checkbox
                        checked={selectedIngredients.some(ing => ing.productId === product.id)}
                        className="mr-2"
                      />
                      <span>{product.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {selectedIngredients.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium">Ingredientes Selecionados:</p>
                {selectedIngredients.map((ing) => {
                  const product = allProducts.find(p => p.id === ing.productId);
                  return (
                    <div key={ing.productId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{product?.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedIngredients(prev => prev.filter(i => i.productId !== ing.productId))}
                          data-testid={`button-remove-ingredient-${ing.productId}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={ing.shouldDeductStock}
                          onCheckedChange={(checked) => {
                            setSelectedIngredients(prev =>
                              prev.map(i =>
                                i.productId === ing.productId
                                  ? { ...i, shouldDeductStock: checked as boolean }
                                  : i
                              )
                            );
                          }}
                          data-testid={`checkbox-deduct-${ing.productId}`}
                        />
                        <Label className="text-xs cursor-pointer">
                          {ing.shouldDeductStock ? "Usar produto (deduzir estoque)" : "Cancelar uso (sem dedução)"}
                        </Label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => {
                if (selectedOrderForIngredients && selectedIngredients.length > 0) {
                  // Submit all selected ingredients
                  selectedIngredients.forEach(ing => {
                    addIngredientMutation.mutate({
                      orderId: selectedOrderForIngredients.orderId,
                      itemId: selectedOrderForIngredients.itemId,
                      ingredientProductId: ing.productId,
                      quantity: ing.quantity,
                      shouldDeductStock: ing.shouldDeductStock
                    });
                  });
                  // Close dialog
                  setSelectedOrderForIngredients(null);
                  setSelectedIngredients([]);
                  setIngredientSearch("");
                } else if (selectedOrderForIngredients) {
                  // No ingredients selected, just proceed to preparing
                  updateStatusMutation.mutate({ orderId: selectedOrderForIngredients.orderId, status: 'preparing' });
                  setSelectedOrderForIngredients(null);
                  setSelectedIngredients([]);
                  setIngredientSearch("");
                }
              }}
              disabled={addIngredientMutation.isPending}
              data-testid="button-confirm-ingredients"
            >
              {selectedIngredients.length > 0 ? `Confirmar ${selectedIngredients.length} ingrediente(s)` : "Continuar sem ingredientes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="bg-black border-b border-primary/20 py-4 px-4 md:px-6 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="font-serif text-lg md:text-2xl text-primary">Cozinha</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Badge 
            className={isSSEConnected 
              ? "bg-green-500/20 text-green-400 border-green-500/30" 
              : "bg-red-500/20 text-red-400 border-red-500/30"
            }
            data-testid="badge-connection-status"
          >
            {isSSEConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            <span className="hidden sm:inline">{isSSEConnected ? 'Ao Vivo' : 'Offline'}</span>
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-4 py-1">
                  Novos Pedidos ({acceptedOrders.length})
                </Badge>
              </div>
              <div className="space-y-4">
                {acceptedOrders.length === 0 ? (
                  <Card className="bg-card/50 border-dashed border-primary/20">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Nenhum pedido aguardando producao
                    </CardContent>
                  </Card>
                ) : (
                  acceptedOrders.map((order) => (
                    <ExpandableOrderCard
                      key={order.id}
                      order={order}
                      variant="kitchen"
                      defaultExpanded={true}
                      showElapsedTime={true}
                      elapsedTimeDate={order.acceptedAt || order.createdAt}
                      statusColor="bg-blue-500/20 text-blue-400 border-blue-500/30"
                      actions={renderOrderActions(order, 'accepted')}
                      onOpenWhatsApp={openWhatsApp}
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-lg px-4 py-1">
                  Em Producao ({preparingOrders.length})
                </Badge>
              </div>
              <div className="space-y-4">
                {preparingOrders.length === 0 ? (
                  <Card className="bg-card/50 border-dashed border-primary/20">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Nenhum pedido em producao
                    </CardContent>
                  </Card>
                ) : (
                  preparingOrders.map((order) => (
                    <ExpandableOrderCard
                      key={order.id}
                      order={order}
                      variant="kitchen"
                      defaultExpanded={true}
                      showElapsedTime={true}
                      elapsedTimeDate={order.preparingAt || order.createdAt}
                      statusColor="bg-orange-500/20 text-orange-400 border-orange-500/30"
                      actions={renderOrderActions(order, 'preparing')}
                      onOpenWhatsApp={openWhatsApp}
                    />
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-4 py-1">
                  Prontos ({readyOrders.length})
                </Badge>
              </div>
              <div className="space-y-4">
                {readyOrders.length === 0 ? (
                  <Card className="bg-card/50 border-dashed border-primary/20">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Nenhum pedido pronto
                    </CardContent>
                  </Card>
                ) : (
                  readyOrders.map((order) => (
                    <ExpandableOrderCard
                      key={order.id}
                      order={order}
                      variant="kitchen"
                      defaultExpanded={true}
                      showElapsedTime={true}
                      elapsedTimeDate={order.readyAt || order.createdAt}
                      statusColor="bg-green-500/20 text-green-400 border-green-500/30"
                      actions={renderOrderActions(order, 'ready')}
                      onOpenWhatsApp={openWhatsApp}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
