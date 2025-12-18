import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, Package, Truck, MapPin, Phone, User as UserIcon, MessageCircle, Bell, Edit2, CreditCard, Banknote, QrCode, Wallet, FileText, Store } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Order, OrderItem, Address, Motoboy } from '@shared/schema';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, ORDER_TYPE_LABELS, type OrderStatus, type PaymentMethod, type OrderType } from '@shared/schema';

function openWhatsApp(phone: string, message?: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const url = message 
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${formattedPhone}`;
  window.open(url, '_blank');
}

function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 3)} ${clean.slice(3, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

const PAYMENT_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  cash: Banknote,
  pix: QrCode,
  card_pos: CreditCard,
  card_credit: CreditCard,
  card_debit: Wallet,
};

interface OrderItemWithNotes extends OrderItem {
  notes?: string;
  preparationIngredients?: Array<{
    id: string;
    orderItemId: string;
    ingredientProductId: string;
    quantity: number;
    ingredientProduct?: { id: string; name: string };
  }>;
}

interface OrderWithDetails extends Order {
  items?: OrderItemWithNotes[];
  userName?: string;
  userWhatsapp?: string;
  address?: Address;
  motoboy?: Motoboy;
}

interface ExpandableOrderCardProps {
  order: OrderWithDetails;
  defaultExpanded?: boolean;
  showActions?: boolean;
  actions?: React.ReactNode;
  variant?: 'default' | 'customer' | 'kitchen' | 'motoboy' | 'admin';
  statusColor?: string;
  showElapsedTime?: boolean;
  elapsedTimeDate?: Date | string | null;
  onOpenMaps?: (address: Address) => void;
  onOpenWhatsApp?: (phone: string) => void;
  onEditDeliveryFee?: (orderId: string, newFee: number) => void;
  isEditingDeliveryFee?: boolean;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  accepted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  preparing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ready: 'bg-green-500/20 text-green-300 border-green-500/30',
  dispatched: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  arrived: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  delivered: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const ORDER_PROGRESS_STEPS: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'dispatched', 'arrived', 'delivered'];

function getProgressPercentage(status: OrderStatus): number {
  if (status === 'cancelled') return 0;
  const stepIndex = ORDER_PROGRESS_STEPS.indexOf(status);
  if (stepIndex === -1) return 0;
  return ((stepIndex + 1) / ORDER_PROGRESS_STEPS.length) * 100;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getElapsedTime(date: Date | string | null): string {
  if (!date) return '0min';
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}

export function ExpandableOrderCard({
  order,
  defaultExpanded = false,
  showActions = true,
  actions,
  variant = 'default',
  statusColor,
  showElapsedTime = false,
  elapsedTimeDate,
  onOpenMaps,
  onOpenWhatsApp,
  onEditDeliveryFee,
  isEditingDeliveryFee = false,
}: ExpandableOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [newDeliveryFee, setNewDeliveryFee] = useState<string>(String(order.deliveryFee || 0));
  const [ingredientsMap, setIngredientsMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const loadIngredients = async () => {
      if (!order.items || order.items.length === 0) return;
      
      const map: Record<string, any[]> = {};
      for (const item of order.items) {
        try {
          const res = await fetch(`/api/orders/${order.id}/items/${item.id}/ingredients`);
          if (res.ok) {
            map[item.id] = await res.json();
          }
        } catch (err) {
          console.error('Error loading ingredients:', err);
        }
      }
      setIngredientsMap(map);
    };
    
    loadIngredients();
  }, [order.id, order.items]);
  
  const status = order.status as OrderStatus;
  const paymentMethod = order.paymentMethod as PaymentMethod;
  const orderType = order.orderType as OrderType;
  const colorClass = statusColor || STATUS_COLORS[status];
  const PaymentIcon = PAYMENT_ICONS[paymentMethod] || CreditCard;

  const orderId = order.id.slice(-6).toUpperCase();
  const customerName = order.customerName || order.userName || 'Cliente';

  const showCustomerSection = variant !== 'customer';
  const showAddressSection = orderType === 'delivery' && order.address;
  const showMotoboySection = order.motoboy || (order.motoboyId && !order.motoboy) || (orderType === 'delivery' && status === 'ready' && !order.motoboyId);

  return (
    <Card 
      className={`bg-card border-primary/20 ${variant === 'kitchen' ? 'border-l-4' : ''}`}
      style={variant === 'kitchen' ? { borderLeftColor: status === 'preparing' ? '#f97316' : status === 'ready' ? '#22c55e' : '#3b82f6' } : undefined}
      data-testid={`order-card-${order.id}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {variant === 'customer' && status !== 'cancelled' && (
          <div className="px-4 pt-3" data-testid={`progress-bar-${order.id}`}>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${getProgressPercentage(status)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Pedido</span>
              <span>Entregue</span>
            </div>
          </div>
        )}

        {variant === 'customer' && status === 'arrived' && (
          <div 
            className="mx-4 mt-3 bg-cyan-500/20 border border-cyan-500/50 rounded-lg p-3 animate-pulse"
            data-testid={`alert-arrived-${order.id}`}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-cyan-300 font-semibold text-sm">Motoboy chegou!</p>
                <p className="text-cyan-200 text-xs">Va ate a porta receber seu pedido</p>
              </div>
            </div>
          </div>
        )}

        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate py-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col min-w-0 gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-lg" data-testid={`order-id-${order.id}`}>#{orderId}</span>
                    <Badge className={`${colorClass} border text-xs`} data-testid={`badge-status-${order.id}`}>
                      {ORDER_STATUS_LABELS[status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground" data-testid={`customer-name-${order.id}`}>
                      {customerName}
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-order-type-${order.id}`}>
                      {orderType === 'counter' ? <Store className="h-3 w-3 mr-1" /> : <Truck className="h-3 w-3 mr-1" />}
                      {ORDER_TYPE_LABELS[orderType]}
                    </Badge>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-payment-${order.id}`}>
                      <PaymentIcon className="h-3 w-3 mr-1" />
                      {PAYMENT_METHOD_LABELS[paymentMethod]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span data-testid={`order-date-${order.id}`}>{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {showElapsedTime && elapsedTimeDate && (
                  <Badge className={`${colorClass} border flex items-center gap-1`} data-testid={`badge-elapsed-${order.id}`}>
                    <Clock className="h-3 w-3" />
                    {getElapsedTime(elapsedTimeDate)}
                  </Badge>
                )}
                <span className="font-bold text-primary text-lg" data-testid={`order-total-${order.id}`}>{formatCurrency(order.total)}</span>
                <Button variant="ghost" size="icon" data-testid={`button-toggle-${order.id}`}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {showCustomerSection && order.userWhatsapp && (
              <div 
                className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                data-testid={`section-customer-${order.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 rounded-full p-2">
                      <UserIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground" data-testid={`customer-name-expanded-${order.id}`}>
                        {customerName}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`customer-phone-${order.id}`}>
                        {formatPhone(order.userWhatsapp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 text-white flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(order.userWhatsapp!, `Ola! Sobre o pedido #${orderId} da Vibe Drinks...`);
                    }}
                    data-testid={`button-whatsapp-customer-${order.id}`}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Ligar
                  </Button>
                </div>
              </div>
            )}

            {showAddressSection && order.address && (
              <div 
                className={`bg-secondary/50 rounded-lg p-3 ${onOpenMaps ? 'cursor-pointer hover-elevate' : ''}`}
                onClick={() => onOpenMaps && order.address && onOpenMaps(order.address)}
                data-testid={`section-address-${order.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 rounded-full p-2 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-sm space-y-1">
                    <p className="text-foreground font-medium" data-testid={`address-street-${order.id}`}>
                      {order.address.street}, {order.address.number}
                    </p>
                    {order.address.complement && (
                      <p className="text-muted-foreground" data-testid={`address-complement-${order.id}`}>
                        {order.address.complement}
                      </p>
                    )}
                    <p data-testid={`address-neighborhood-${order.id}`}>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {order.address.neighborhood}
                      </Badge>
                      <span className="text-muted-foreground ml-2">
                        {order.address.city}/{order.address.state}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs" data-testid={`address-cep-${order.id}`}>
                      CEP: {order.address.zipCode}
                    </p>
                    {order.address.notes && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mt-2" data-testid={`address-reference-${order.id}`}>
                        <p className="text-yellow-400 text-xs font-medium">Referencia:</p>
                        <p className="text-foreground text-xs">{order.address.notes}</p>
                      </div>
                    )}
                    {onOpenMaps && (
                      <p className="text-primary text-xs mt-1">Toque para abrir no Maps</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4" data-testid={`section-items-${order.id}`}>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Itens do Pedido</h4>
                <Badge variant="secondary" className="text-xs">{order.items?.length || 0} itens</Badge>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 space-y-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} data-testid={`item-${order.id}-${idx}`}>
                    <div className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="text-foreground font-medium" data-testid={`item-name-${order.id}-${idx}`}>
                          {item.quantity}x {item.productName}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span data-testid={`item-unit-price-${order.id}-${idx}`}>
                            {formatCurrency(item.unitPrice)} un.
                          </span>
                        </div>
                      </div>
                      <span className="text-foreground font-medium" data-testid={`item-total-${order.id}-${idx}`}>
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                    {item.notes && (
                      <div className="mt-1 text-xs text-yellow-400 bg-yellow-500/10 rounded px-2 py-1" data-testid={`item-notes-${order.id}-${idx}`}>
                        Obs: {item.notes}
                      </div>
                    )}
                    {ingredientsMap[item.id] && ingredientsMap[item.id].length > 0 && (
                      <div className="mt-2 text-xs text-cyan-400 bg-cyan-500/10 rounded px-2 py-1" data-testid={`item-ingredients-${order.id}-${idx}`}>
                        <span className="font-medium">Ingredientes usados:</span>
                        <div className="mt-1">
                          {ingredientsMap[item.id].map((ing) => (
                            <div key={ing.id}>
                              • {ing.ingredientProduct?.name || 'Produto desconhecido'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {idx < (order.items?.length || 0) - 1 && (
                      <Separator className="mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary/30 rounded-lg p-3 space-y-2" data-testid={`section-payment-${order.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Pagamento</h4>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between" data-testid={`payment-subtotal-${order.id}`}>
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
                </div>
                
                {Number(order.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-400" data-testid={`payment-discount-${order.id}`}>
                    <span>Desconto</span>
                    <span>-{formatCurrency(order.discount || 0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center" data-testid={`payment-delivery-fee-${order.id}`}>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Taxa de Entrega</span>
                    {order.deliveryFeeAdjusted && (
                      <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/50">Ajustada</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-foreground">{formatCurrency(order.deliveryFee)}</span>
                    {variant === 'admin' && onEditDeliveryFee && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewDeliveryFee(String(order.deliveryFee || 0));
                          setShowFeeDialog(true);
                        }}
                        data-testid={`button-edit-fee-${order.id}`}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold text-base" data-testid={`payment-total-${order.id}`}>
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex items-center justify-between" data-testid={`payment-method-detail-${order.id}`}>
                  <span className="text-muted-foreground">Forma de Pagamento</span>
                  <Badge variant="outline" className="text-xs">
                    <PaymentIcon className="h-3 w-3 mr-1" />
                    {PAYMENT_METHOD_LABELS[paymentMethod]}
                  </Badge>
                </div>
                
                {paymentMethod === 'cash' && order.changeFor && Number(order.changeFor) > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2 mt-2" data-testid={`payment-change-${order.id}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-medium">Troco para</span>
                      <span className="text-yellow-400 font-bold">{formatCurrency(order.changeFor)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-muted-foreground">Troco a devolver</span>
                      <span className="text-yellow-300">{formatCurrency(Number(order.changeFor) - Number(order.total))}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {order.notes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3" data-testid={`section-notes-${order.id}`}>
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-yellow-400" />
                  <p className="text-yellow-400 text-sm font-medium">Observacoes do Pedido</p>
                </div>
                <p className="text-foreground text-sm">{order.notes}</p>
              </div>
            )}

            {showMotoboySection && (
              <>
                {order.motoboy && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3" data-testid={`section-motoboy-${order.id}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-500/20 rounded-full p-2">
                          <Truck className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground" data-testid={`motoboy-name-${order.id}`}>
                            {order.motoboy.name}
                          </p>
                          {order.motoboy.whatsapp && (
                            <p className="text-sm text-muted-foreground" data-testid={`motoboy-phone-${order.id}`}>
                              {formatPhone(order.motoboy.whatsapp)}
                            </p>
                          )}
                        </div>
                      </div>
                      {order.motoboy.whatsapp && (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-purple-600 text-white flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(order.motoboy!.whatsapp, `Ola! Sobre o pedido #${orderId} da Vibe Drinks...`);
                          }}
                          data-testid={`button-whatsapp-motoboy-${order.id}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Ligar
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {order.motoboyId && !order.motoboy && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3" data-testid={`motoboy-assigned-${order.id}`}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-purple-300">Motoboy atribuido</span>
                    </div>
                  </div>
                )}

                {orderType === 'delivery' && status === 'ready' && !order.motoboyId && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center" data-testid={`motoboy-pending-${order.id}`}>
                    <Truck className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-purple-300 text-sm">Aguardando atribuicao de motoboy</p>
                  </div>
                )}
              </>
            )}

            {showActions && actions && (
              <div className="pt-2 border-t border-border" data-testid={`section-actions-${order.id}`}>
                {actions}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Taxa de Entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Nova taxa de entrega (R$)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                min="0"
                value={newDeliveryFee}
                onChange={(e) => setNewDeliveryFee(e.target.value)}
                placeholder="0.00"
                data-testid="input-delivery-fee"
              />
            </div>
            {order.originalDeliveryFee !== null && order.originalDeliveryFee !== undefined && (
              <p className="text-sm text-muted-foreground">
                Taxa original: {formatCurrency(order.originalDeliveryFee)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Novo total: {formatCurrency(
                Number(order.subtotal) - Number(order.discount || 0) + Number(newDeliveryFee || 0)
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeeDialog(false)}
              data-testid="button-cancel-fee"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (onEditDeliveryFee) {
                  onEditDeliveryFee(order.id, parseFloat(newDeliveryFee) || 0);
                  setShowFeeDialog(false);
                }
              }}
              disabled={isEditingDeliveryFee}
              data-testid="button-save-fee"
            >
              {isEditingDeliveryFee ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
