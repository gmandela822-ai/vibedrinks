import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useOrderUpdates } from '@/hooks/use-order-updates';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useToast } from '@/hooks/use-toast';
import { ExpandableOrderCard } from '@/components/ExpandableOrderCard';
import type { Order, OrderItem, Motoboy } from '@shared/schema';

interface OrderWithDetails extends Order {
  items: OrderItem[];
  motoboy?: Motoboy;
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isSSEConnected, setIsSSEConnected] = useState(false);
  const { playOnce } = useNotificationSound();
  const { toast } = useToast();

  useOrderUpdates({
    onConnected: () => setIsSSEConnected(true),
    onDisconnected: () => setIsSSEConnected(false),
    onOrderStatusChanged: (data) => {
      const statusMessages: Record<string, string> = {
        accepted: 'Seu pedido foi aceito!',
        preparing: 'Seu pedido esta sendo preparado!',
        dispatched: 'Seu pedido saiu para entrega!',
        arrived: 'O entregador chegou!',
        delivered: 'Pedido entregue com sucesso!',
      };
      
      if (statusMessages[data.status]) {
        playOnce();
        toast({ title: statusMessages[data.status] });
      }
    },
  });

  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders', 'user', user?.id],
    enabled: !!user?.id,
    refetchInterval: isSSEConnected ? 30000 : 5000,
  });

  const userOrders = orders.filter(o => o.userId === user?.id);
  const orderIds = userOrders.map(o => o.id).join(',');
  
  const { data: orderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items', orderIds],
    queryFn: async () => {
      if (!orderIds) return [];
      const res = await fetch(`/api/order-items?orderIds=${encodeURIComponent(orderIds)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: userOrders.length > 0,
    refetchInterval: isSSEConnected ? 30000 : 5000,
  });

  const { data: motoboys = [] } = useQuery<Motoboy[]>({
    queryKey: ['/api/motoboys'],
  });

  const ordersWithDetails: OrderWithDetails[] = userOrders.map(order => ({
    ...order,
    items: orderItems.filter(item => item.orderId === order.id),
    motoboy: order.motoboyId ? motoboys.find(m => m.id === order.motoboyId) : undefined,
  }));

  if (!isAuthenticated) {
    setLocation('/login?redirect=/pedidos');
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao cardapio
          </Button>
          <div className="flex items-center gap-2">
            <Badge 
              className={isSSEConnected 
                ? "bg-green-500/20 text-green-400 border-green-500/30" 
                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              }
              data-testid="badge-connection-status"
            >
              {isSSEConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isSSEConnected ? 'Ao Vivo' : 'Atualizando...'}
            </Badge>
          </div>
        </div>

        <h1 className="font-serif text-3xl text-primary mb-8">Meus Pedidos</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-primary/20">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ordersWithDetails.length === 0 ? (
          <Card className="bg-card border-primary/20">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum pedido ainda</h2>
              <p className="text-muted-foreground mb-6">
                Voce ainda nao fez nenhum pedido. Que tal explorar nosso cardapio?
              </p>
              <Button
                className="bg-primary text-primary-foreground"
                onClick={() => setLocation('/')}
                data-testid="button-explore"
              >
                Ver Cardapio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ordersWithDetails.map((order) => (
              <ExpandableOrderCard
                key={order.id}
                order={order}
                variant="customer"
                defaultExpanded={order.status !== 'delivered' && order.status !== 'cancelled'}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
