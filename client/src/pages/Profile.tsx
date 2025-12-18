import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, User, MapPin, Package, Clock, Truck, CheckCircle, XCircle, 
  ChefHat, AlertCircle, Edit2, Trash2, Plus, Save, X, Phone, LogOut, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose 
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Order, OrderItem, Address } from '@shared/schema';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type OrderStatus, type PaymentMethod } from '@shared/schema';
import { NEIGHBORHOODS, DELIVERY_ZONES, DELIVERY_FEE_WARNING, type DeliveryZone } from '@shared/delivery-zones';

interface OrderWithItems extends Order {
  items: OrderItem[];
}

const STATUS_CONFIG: Record<OrderStatus, { icon: typeof Package; color: string }> = {
  pending: { icon: AlertCircle, color: 'bg-yellow/20 text-yellow border-yellow/30' },
  accepted: { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  preparing: { icon: ChefHat, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ready: { icon: Package, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  dispatched: { icon: Truck, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  delivered: { icon: CheckCircle, color: 'bg-green-600/20 text-green-500 border-green-600/30' },
  cancelled: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const profileFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 digitos').max(15, 'WhatsApp invalido'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const addressFormSchema = z.object({
  street: z.string().min(3, 'Rua e obrigatoria'),
  number: z.string().min(1, 'Numero e obrigatorio'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro e obrigatorio'),
  city: z.string().min(2, 'Cidade e obrigatoria'),
  state: z.string().length(2, 'Estado deve ter 2 letras'),
  zipCode: z.string().min(8, 'CEP invalido'),
  notes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, login, logout, setAddress: setAuthAddress, address: currentAddress } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      whatsapp: user?.whatsapp || '',
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        whatsapp: user.whatsapp || '',
      });
    }
  }, [user, profileForm]);

  const { data: addresses = [], isLoading: isLoadingAddresses } = useQuery<Address[]>({
    queryKey: ['/api/addresses', user?.id],
    enabled: !!user?.id,
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders', 'user', user?.id],
    enabled: !!user?.id,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, data);
    },
    onSuccess: async (response) => {
      const updatedUser = await response.json();
      login(updatedUser, 'customer');
      setIsEditingProfile(false);
      toast({ title: 'Dados atualizados com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar dados', variant: 'destructive' });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      return apiRequest('POST', '/api/addresses', {
        userId: user?.id,
        ...data,
        isDefault: addresses.length === 0,
      });
    },
    onSuccess: async (response) => {
      const newAddress = await response.json();
      if (addresses.length === 0) {
        setAuthAddress(newAddress);
      }
      setIsAddressDialogOpen(false);
      addressForm.reset();
      toast({ title: 'Endereco adicionado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    },
    onError: () => {
      toast({ title: 'Erro ao adicionar endereco', variant: 'destructive' });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressFormValues) => {
      return apiRequest('PATCH', `/api/addresses/${editingAddress?.id}`, data);
    },
    onSuccess: async (response) => {
      const updatedAddress = await response.json();
      if (currentAddress?.id === editingAddress?.id) {
        setAuthAddress(updatedAddress);
      }
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      addressForm.reset();
      toast({ title: 'Endereco atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar endereco', variant: 'destructive' });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      return apiRequest('DELETE', `/api/addresses/${addressId}`);
    },
    onSuccess: () => {
      toast({ title: 'Endereco removido com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    },
    onError: () => {
      toast({ title: 'Erro ao remover endereco', variant: 'destructive' });
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      return apiRequest('PATCH', `/api/addresses/${addressId}`, { isDefault: true });
    },
    onSuccess: async (response) => {
      const updatedAddress = await response.json();
      setAuthAddress(updatedAddress);
      toast({ title: 'Endereco padrao atualizado!' });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses', user?.id] });
    },
    onError: () => {
      toast({ title: 'Erro ao definir endereco padrao', variant: 'destructive' });
    },
  });

  const openEditAddress = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      street: address.street,
      number: address.number,
      complement: address.complement || '',
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      notes: address.notes || '',
    });
    setIsAddressDialogOpen(true);
  };

  const openNewAddress = () => {
    setEditingAddress(null);
    addressForm.reset({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      notes: '',
    });
    setIsAddressDialogOpen(true);
  };

  const handleSaveAddress = (data: AddressFormValues) => {
    if (editingAddress) {
      updateAddressMutation.mutate(data);
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const handleSaveProfile = (data: ProfileFormValues) => {
    updateUserMutation.mutate(data);
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(price));
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatWhatsapp = (phone: string | undefined | null) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (!isAuthenticated || !user) {
    setLocation('/login?redirect=/perfil');
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation('/');
    toast({ title: 'Voce saiu da sua conta' });
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => setLocation('/')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao cardapio
          </Button>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </div>

        <h1 className="font-serif text-3xl text-primary mb-8">Meu Perfil</h1>

        <Tabs defaultValue="dados" className="space-y-6">
          <TabsList className="bg-card border border-primary/20 p-1">
            <TabsTrigger 
              value="dados" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-dados"
            >
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger 
              value="enderecos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-enderecos"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enderecos
            </TabsTrigger>
            <TabsTrigger 
              value="pedidos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-pedidos"
            >
              <Package className="h-4 w-4 mr-2" />
              Historico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <Card className="bg-card border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Informacoes Pessoais
                </CardTitle>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Nome</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-secondary/50 border-primary/20"
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="whatsapp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">WhatsApp</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-secondary/50 border-primary/20"
                                placeholder="11999999999"
                                data-testid="input-whatsapp"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="submit"
                          disabled={updateUserMutation.isPending}
                          className="bg-primary text-primary-foreground"
                          data-testid="button-save-profile"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {updateUserMutation.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            profileForm.reset({
                              name: user.name || '',
                              whatsapp: user.whatsapp || '',
                            });
                          }}
                          data-testid="button-cancel-edit"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-primary/10">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="font-medium text-foreground" data-testid="text-user-name">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-primary/10">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-medium text-foreground" data-testid="text-user-whatsapp">
                          {formatWhatsapp(user.whatsapp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg border border-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Membro desde</p>
                        <p className="font-medium text-foreground" data-testid="text-member-since">
                          {user.createdAt ? formatDate(user.createdAt) : 'Data nao disponivel'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enderecos" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Meus Enderecos</h2>
              <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openNewAddress}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-add-address"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Endereco
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary/20 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      {editingAddress ? 'Editar Endereco' : 'Novo Endereco'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      {editingAddress 
                        ? 'Atualize os dados do seu endereco de entrega.' 
                        : 'Preencha os dados do novo endereco de entrega.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(handleSaveAddress)} className="space-y-4 pt-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormField
                            control={addressForm.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground">Rua</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-secondary/50 border-primary/20"
                                    placeholder="Nome da rua"
                                    data-testid="input-street"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={addressForm.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Numero</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-secondary/50 border-primary/20"
                                  placeholder="123"
                                  data-testid="input-number"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={addressForm.control}
                        name="complement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Complemento (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-secondary/50 border-primary/20"
                                placeholder="Apto, bloco, etc."
                                data-testid="input-complement"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Bairro</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-secondary/50 border-primary/20" data-testid="select-neighborhood">
                                  <SelectValue placeholder="Selecione o bairro" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-card border-primary/20 max-h-[300px]">
                                {(['S', 'A', 'B', 'C', 'D', 'E'] as DeliveryZone[]).map((zone) => {
                                  const zoneInfo = DELIVERY_ZONES[zone];
                                  const zoneNeighborhoods = NEIGHBORHOODS.filter(n => n.zone === zone);
                                  if (zoneNeighborhoods.length === 0) return null;
                                  return (
                                    <SelectGroup key={zone}>
                                      <SelectLabel className="text-primary font-semibold">
                                        {zoneInfo.name} - R$ {zoneInfo.fee.toFixed(2).replace('.', ',')}
                                      </SelectLabel>
                                      {zoneNeighborhoods.map((n) => (
                                        <SelectItem key={n.name} value={n.name} className="text-foreground">
                                          {n.name}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex items-start gap-2 p-3 bg-yellow/10 border border-yellow/30 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow">{DELIVERY_FEE_WARNING}</p>
                      </div>

                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Cidade</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-secondary/50 border-primary/20"
                                placeholder="Cidade"
                                data-testid="input-city"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">Estado</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-secondary/50 border-primary/20"
                                  placeholder="SP"
                                  maxLength={2}
                                  data-testid="input-state"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground">CEP</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-secondary/50 border-primary/20"
                                  placeholder="00000-000"
                                  data-testid="input-zipcode"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={addressForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Observacoes (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-secondary/50 border-primary/20"
                                placeholder="Ponto de referencia, instrucoes de entrega..."
                                data-testid="input-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                          className="flex-1 bg-primary text-primary-foreground"
                          data-testid="button-save-address"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {createAddressMutation.isPending || updateAddressMutation.isPending
                            ? 'Salvando...'
                            : 'Salvar Endereco'}
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" data-testid="button-cancel-address">
                            Cancelar
                          </Button>
                        </DialogClose>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingAddresses ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-card border-primary/20">
                    <CardContent className="p-6">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <Card className="bg-card border-primary/20">
                <CardContent className="p-12 text-center">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum endereco cadastrado</h3>
                  <p className="text-muted-foreground mb-6">
                    Adicione um endereco para receber suas entregas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <Card 
                    key={address.id} 
                    className={`bg-card border-primary/20 ${address.isDefault ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`address-card-${address.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {address.isDefault && (
                              <Badge className="bg-primary/20 text-primary border-primary/30">
                                Endereco Padrao
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium text-foreground">
                            {address.street}, {address.number}
                            {address.complement && ` - ${address.complement}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.neighborhood}, {address.city} - {address.state}
                          </p>
                          <p className="text-sm text-muted-foreground">CEP: {address.zipCode}</p>
                          {address.notes && (
                            <p className="text-sm text-yellow mt-2">Obs: {address.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {!address.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDefaultAddressMutation.mutate(address.id)}
                              disabled={setDefaultAddressMutation.isPending}
                              data-testid={`button-set-default-${address.id}`}
                            >
                              Definir Padrao
                            </Button>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditAddress(address)}
                              data-testid={`button-edit-address-${address.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  data-testid={`button-delete-address-${address.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-card border-primary/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Remover endereco?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acao nao pode ser desfeita. O endereco sera removido permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteAddressMutation.mutate(address.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Historico de Pedidos</h2>

            {isLoadingOrders ? (
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
            ) : orders.length === 0 ? (
              <Card className="bg-card border-primary/20">
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum pedido ainda</h3>
                  <p className="text-muted-foreground mb-6">
                    Voce ainda nao fez nenhum pedido. Que tal explorar nosso cardapio?
                  </p>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => setLocation('/')}
                    data-testid="button-explore-menu"
                  >
                    Ver Cardapio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = order.status as OrderStatus;
                  const config = STATUS_CONFIG[status];
                  const StatusIcon = config.icon;

                  return (
                    <Card key={order.id} className="bg-card border-primary/20" data-testid={`order-card-${order.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${config.color}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-foreground text-lg">
                              Pedido #{order.id.slice(-6).toUpperCase()}
                            </CardTitle>
                            <p className="text-muted-foreground text-sm flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className={config.color} data-testid={`status-badge-${order.id}`}>
                          {ORDER_STATUS_LABELS[status]}
                        </Badge>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-foreground">
                                {formatPrice(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-primary/10 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">{formatPrice(order.subtotal)}</span>
                          </div>
                          {Number(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-400">Desconto Combo</span>
                              <span className="text-green-400">-{formatPrice(order.discount || 0)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              Entrega
                            </span>
                            <span className="text-foreground">{formatPrice(order.deliveryFee)}</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-2">
                            <span className="text-foreground">Total</span>
                            <span className="text-primary">{formatPrice(order.total)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-2 border-t border-primary/10">
                          <span className="text-muted-foreground">
                            Pagamento: {PAYMENT_METHOD_LABELS[order.paymentMethod as PaymentMethod]}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
