import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Package, LogOut, Navigation, CheckCircle, Truck, Wifi, WifiOff, MapPinCheck } from 'lucide-react';
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
import type { Order, OrderItem, Address, Motoboy } from '@shared/schema';

interface OrderWithDetails extends Order {
  items: OrderItem[];
  userName?: string;
  userWhatsapp?: string;
  address?: Address;
}

export default function MotoboyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, role, logout } = useAuth();
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const { playOnce } = useNotificationSound();

  useOrderUpdates({
    onConnected: () => setIsSSEConnected(true),
    onDisconnected: () => setIsSSEConnected(false),
    onOrderStatusChanged: (data) => {
      if (data.status === 'ready') {
        playOnce();
        toast({ title: 'Nova entrega disponivel!' });
      }
      if (data.status === 'arrived') {
        playOnce();
        toast({ title: 'Entregador chegou ao destino!' });
      }
    },
    onOrderAssigned: () => {
      playOnce();
      toast({ title: 'Pedido atribuido!' });
    },
  });

  const { data: motoboys = [], isLoading: motoboyLoading } = useQuery<Motoboy[]>({
    queryKey: ['/api/motoboys'],
  });

  const currentMotoboy = motoboys.find(m => m.whatsapp === user?.whatsapp);

  const { data: dispatchedOrdersRaw = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/motoboy', currentMotoboy?.id, 'orders'],
    queryFn: async () => {
      if (!currentMotoboy?.id) return [];
      const res = await fetch(`/api/motoboy/${currentMotoboy.id}/orders`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: isSSEConnected ? 30000 : 5000,
    enabled: !!currentMotoboy?.id,
  });

  const orderIds = dispatchedOrdersRaw.map(o => o.id).join(',');
  
  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items', orderIds],
    queryFn: async () => {
      if (!orderIds) return [];
      const res = await fetch(`/api/order-items?orderIds=${encodeURIComponent(orderIds)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: dispatchedOrdersRaw.length > 0,
    refetchInterval: isSSEConnected ? 30000 : 5000,
  });

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });

  const { data: users = [] } = useQuery<{ id: string; name: string; whatsapp: string }[]>({
    queryKey: ['/api/users'],
  });

  const dispatchedOrders: OrderWithDetails[] = dispatchedOrdersRaw.map(order => ({
    ...order,
    items: orderItems.filter(item => item.orderId === order.id),
    address: addresses.find(a => a.id === order.addressId),
    userName: users.find(u => u.id === order.userId)?.name,
    userWhatsapp: users.find(u => u.id === order.userId)?.whatsapp,
  }));

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/motoboy', currentMotoboy?.id, 'orders'] });
      if (variables.status === 'arrived') {
        toast({ title: 'Chegada confirmada! Cliente foi notificado.' });
      } else {
        toast({ title: 'Entrega confirmada!' });
      }
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation('/admin-login');
  };

  const openMaps = (address: Address) => {
    const query = encodeURIComponent(
      `${address.street}, ${address.number}, ${address.neighborhood}, ${address.city} - ${address.state}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openWhatsApp = (phone: string) => {
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  if (role !== 'motoboy' && role !== 'admin') {
    setLocation('/admin-login');
    return null;
  }

  const renderOrderActions = (order: OrderWithDetails) => {
    const status = order.status as string;
    
    if (status === 'dispatched') {
      return (
        <Button
          className="w-full bg-cyan-600 text-white py-4 text-base font-semibold"
          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'arrived' })}
          disabled={updateStatusMutation.isPending}
          data-testid={`button-arrived-${order.id}`}
        >
          <MapPinCheck className="h-5 w-5 mr-2" />
          CHEGUEI
        </Button>
      );
    }
    
    if (status === 'arrived') {
      return (
        <Button
          className="w-full bg-primary text-primary-foreground py-4 text-base font-semibold"
          onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
          disabled={updateStatusMutation.isPending}
          data-testid={`button-delivered-${order.id}`}
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Confirmar Entrega Realizada
        </Button>
      );
    }

    return (
      <Button
        className="w-full bg-primary text-primary-foreground py-4 text-base font-semibold"
        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
        disabled={updateStatusMutation.isPending}
        data-testid={`button-delivered-${order.id}`}
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Confirmar Entrega Realizada
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black border-b border-primary/20 py-4 px-4 md:px-6 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3">
          <Navigation className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          <h1 className="font-serif text-lg md:text-2xl text-primary">Entregas</h1>
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

      <main className="p-6 max-w-2xl mx-auto">
        {currentMotoboy && (
          <Card className="bg-card border-primary/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-medium">{currentMotoboy.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {dispatchedOrders.length > 0 
                      ? `${dispatchedOrders.length} entrega(s) em andamento`
                      : 'Nenhuma entrega em andamento'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading || motoboyLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !currentMotoboy ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Motoboy nao cadastrado</h2>
              <p className="text-muted-foreground">
                Seu usuario nao esta vinculado a um motoboy. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        ) : dispatchedOrders.length === 0 ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Sem entregas no momento</h2>
              <p className="text-muted-foreground">
                Quando houver pedidos prontos para entrega, eles aparecerao aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-foreground">Minhas Entregas em Andamento</h2>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {dispatchedOrders.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {dispatchedOrders.map((order) => (
                <ExpandableOrderCard
                  key={order.id}
                  order={order}
                  variant="motoboy"
                  defaultExpanded={true}
                  statusColor="bg-purple-500/20 text-purple-400 border-purple-500/30"
                  onOpenMaps={openMaps}
                  onOpenWhatsApp={openWhatsApp}
                  actions={renderOrderActions(order)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
