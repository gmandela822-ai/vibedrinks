import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MapPin, CreditCard, Banknote, QrCode, Truck, ArrowLeft, Loader2, Copy, Check, Gift, Clock } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { isBusinessHoursOpen, BUSINESS_HOURS } from '@/lib/business-hours';
import type { Settings, PaymentMethod } from '@shared/schema';
import { PAYMENT_METHOD_LABELS } from '@shared/schema';
import { NEIGHBORHOODS, DELIVERY_ZONES, DELIVERY_FEE_WARNING, type DeliveryZone } from '@shared/delivery-zones';
import { calculateDeliveryFee, getGroupedNeighborhoods } from '@/lib/delivery-fees';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { items, combos, subtotal, comboDiscount, total: cartTotal, clearCart } = useCart();
  const { user, address, isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');

  const { data: settings } = useQuery<Settings>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    if (address?.neighborhood && !selectedNeighborhood) {
      setSelectedNeighborhood(address.neighborhood);
    }
  }, [address]);

  const groupedNeighborhoods = useMemo(() => getGroupedNeighborhoods(), []);
  const fallbackFee = Number(settings?.minDeliveryFee ?? 20.00);

  const deliveryFeeResult = useMemo(() => {
    const neighborhoodToUse = selectedNeighborhood || address?.neighborhood || '';
    return calculateDeliveryFee(neighborhoodToUse, fallbackFee);
  }, [selectedNeighborhood, address, fallbackFee]);

  const deliveryFee = deliveryFeeResult.fee;
  const isUnlistedNeighborhood = deliveryFeeResult.isUnlisted;
  const zoneInfo = deliveryFeeResult.zoneName ? {
    name: deliveryFeeResult.zoneName,
    fee: deliveryFeeResult.fee
  } : null;
  
  const total = cartTotal + deliveryFee;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderData = {
        userId: user?.id,
        addressId: address?.id,
        items: items.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.salePrice,
          totalPrice: Number(item.product.salePrice) * item.quantity,
        })),
        subtotal,
        deliveryFee,
        deliveryDistance: 0,
        discount: comboDiscount,
        total,
        paymentMethod,
        changeFor: paymentMethod === 'cash' && needsChange ? Number(changeFor) : null,
      };
      return apiRequest('POST', '/api/orders', orderData);
    },
    onSuccess: async () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Pedido realizado!', description: 'Acompanhe o status do seu pedido' });
      setLocation('/pedidos');
    },
    onError: () => {
      toast({ title: 'Erro ao criar pedido', variant: 'destructive' });
    },
  });

  const copyPixKey = () => {
    if (settings?.pixKey) {
      navigator.clipboard.writeText(settings.pixKey);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
      toast({ title: 'Chave PIX copiada!' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const isOpen = isBusinessHoursOpen();

  // Redirect to login if not authenticated or no address
  useEffect(() => {
    if (!isAuthenticated || !address) {
      setLocation('/login?redirect=/checkout');
    }
  }, [isAuthenticated, address, setLocation]);

  // Redirect to home if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      setLocation('/');
    }
  }, [items.length, setLocation]);

  // Show loading while checking auth
  if (!isAuthenticated || !address || items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-primary"
          onClick={() => setLocation('/')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar ao cardapio
        </Button>

        {!isOpen && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Estabelecimento Fechado</p>
                  <p className="text-sm">Estamos abertos de 14h às 6h da manhã. Voltamos às 14:00!</p>
                  <p className="text-xs mt-2">Entre em contato: <a href={BUSINESS_HOURS.WHATSAPP_LINK} className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">WhatsApp {BUSINESS_HOURS.WHATSAPP}</a></p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <h1 className="font-serif text-3xl text-primary mb-8">Finalizar Pedido</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereco de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary/50 p-4 rounded-lg border border-primary/10">
                  <p className="font-medium text-foreground">{user?.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {address.neighborhood} - Sao Paulo, SP
                  </p>
                  {address.notes && (
                    <p className="text-yellow text-sm mt-2">Obs: {address.notes}</p>
                  )}
                </div>
                
                <div className="mt-4">
                  <Label className="text-foreground text-sm mb-2 block">
                    Confirmar bairro para calculo da taxa
                  </Label>
                  <Select
                    value={selectedNeighborhood}
                    onValueChange={setSelectedNeighborhood}
                  >
                    <SelectTrigger 
                      className="bg-secondary border-primary/30"
                      data-testid="select-neighborhood-checkout"
                    >
                      <SelectValue placeholder={address.neighborhood || "Selecione seu bairro"} />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedNeighborhoods.map(({ zone, zoneInfo, neighborhoods }) => (
                        <div key={zone}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50">
                            {zoneInfo.name} - {formatPrice(zoneInfo.fee)}
                          </div>
                          {neighborhoods.map((n) => (
                            <SelectItem 
                              key={n.name} 
                              value={n.name}
                              data-testid={`option-neighborhood-${n.name}`}
                            >
                              {n.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {zoneInfo && (
                  <div className="mt-3 p-2 bg-primary/10 rounded-lg">
                    <p className="text-primary text-sm font-medium" data-testid="text-zone-info">
                      Zona: {zoneInfo.name} - Taxa: {formatPrice(zoneInfo.fee)}
                    </p>
                  </div>
                )}

                {isUnlistedNeighborhood && (
                  <div className="mt-3 p-2 bg-yellow/10 rounded-lg">
                    <p className="text-muted-foreground text-sm" data-testid="text-unlisted-warning">
                      Bairro nao cadastrado - taxa maxima aplicada
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground mt-3">{DELIVERY_FEE_WARNING}</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  className="space-y-3"
                >
                  <div 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'pix' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-secondary/30'
                    }`}
                    onClick={() => setPaymentMethod('pix')}
                  >
                    <RadioGroupItem value="pix" id="pix" className="border-primary" />
                    <QrCode className="h-5 w-5 text-primary" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer text-foreground">
                      PIX
                      <span className="block text-xs text-muted-foreground">Pagamento instantaneo</span>
                    </Label>
                  </div>

                  <div 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'cash' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-secondary/30'
                    }`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <RadioGroupItem value="cash" id="cash" className="border-primary" />
                    <Banknote className="h-5 w-5 text-primary" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer text-foreground">
                      Dinheiro
                      <span className="block text-xs text-muted-foreground">Pague na entrega</span>
                    </Label>
                  </div>

                  <div 
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'card_pos' ? 'border-primary bg-primary/10' : 'border-primary/20 bg-secondary/30'
                    }`}
                    onClick={() => setPaymentMethod('card_pos')}
                  >
                    <RadioGroupItem value="card_pos" id="card_pos" className="border-primary" />
                    <CreditCard className="h-5 w-5 text-primary" />
                    <Label htmlFor="card_pos" className="flex-1 cursor-pointer text-foreground">
                      Cartao (Maquininha)
                      <span className="block text-xs text-muted-foreground">Credito ou debito na entrega</span>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'cash' && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="needs-change"
                        checked={needsChange}
                        onChange={(e) => setNeedsChange(e.target.checked)}
                        className="rounded border-primary"
                      />
                      <Label htmlFor="needs-change" className="text-foreground">Preciso de troco</Label>
                    </div>
                    {needsChange && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Troco para quanto?</Label>
                        <Input
                          type="number"
                          placeholder="R$ 0,00"
                          value={changeFor}
                          onChange={(e) => setChangeFor(e.target.value)}
                          className="mt-1 bg-secondary border-primary/30 text-foreground"
                          data-testid="input-change-for"
                        />
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <QrCode className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-400 mb-1">Pagamento PIX na Entrega</p>
                        <p className="text-sm text-muted-foreground">
                          O motoboy ira realizar a cobranca via QR Code na maquininha no momento da entrega.
                        </p>
                        <p className="text-xs text-amber-500/80 mt-2">
                          Tenha o app do seu banco pronto para escanear o QR Code.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-card border-primary/20 sticky top-4">
              <CardHeader>
                <CardTitle className="text-foreground">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-foreground">
                        {formatPrice(Number(item.product.salePrice) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator className="bg-primary/20" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>

                  {comboDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-500 flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        Desconto Combo (5%)
                      </span>
                      <span className="text-green-500" data-testid="text-combo-discount">
                        - {formatPrice(comboDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      Taxa de entrega
                    </span>
                    <span className="text-foreground" data-testid="text-delivery-fee">
                      {formatPrice(deliveryFee)}
                    </span>
                  </div>
                </div>

                <Separator className="bg-primary/20" />

                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-xl text-primary" data-testid="text-total">
                    {formatPrice(total)}
                  </span>
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground font-semibold py-6"
                  onClick={() => createOrderMutation.mutate()}
                  disabled={createOrderMutation.isPending || !isOpen}
                  data-testid="button-place-order"
                >
                  {!isOpen ? (
                    'Estabelecimento Fechado'
                  ) : createOrderMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `Confirmar Pedido - ${formatPrice(total)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
