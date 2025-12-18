import { useState, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { Phone, User, MapPin, ArrowRight, Loader2, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import logoImage from '@assets/vibedrinksfinal_1765554834904.gif';
import { NEIGHBORHOODS, DELIVERY_ZONES, DELIVERY_FEE_WARNING, type DeliveryZone as DeliveryZoneType } from '@shared/delivery-zones';

type Step = 'phone' | 'password' | 'register';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, setAddress } = useAuth();
  
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [notes, setNotes] = useState('');

  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingLoginData, setPendingLoginData] = useState<{ user: any; address: any } | null>(null);

  const groupedNeighborhoods = useMemo(() => {
    const zones: DeliveryZoneType[] = ['S', 'A', 'B', 'C', 'D'];
    return zones.map(zone => ({
      zone,
      zoneInfo: DELIVERY_ZONES[zone],
      neighborhoods: NEIGHBORHOODS.filter(n => n.zone === zone)
    }));
  }, []);

  const selectedNeighborhoodFee = useMemo(() => {
    const found = NEIGHBORHOODS.find(n => n.name === selectedNeighborhood);
    if (found) {
      return DELIVERY_ZONES[found.zone].fee;
    }
    return null;
  }, [selectedNeighborhood]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPassword(value);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setNewPassword(value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setConfirmPassword(value);
  };

  const handleCheckPhone = async () => {
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      toast({ title: 'Numero invalido', description: 'Digite DDD + 9 + numero (11 digitos)', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/check-phone', { whatsapp: cleanPhone });
      const data = await response.json();
      
      if (data.isMotoboy) {
        toast({ 
          title: 'Acesso de motoboy', 
          description: 'Use o login de funcionarios para acessar', 
          variant: 'destructive' 
        });
        setTimeout(() => setLocation('/admin-login'), 2000);
        return;
      }
      
      if (data.exists) {
        setUserName(data.userName);
        setStep('password');
      } else {
        setStep('register');
      }
    } catch (error) {
      setStep('register');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (password.length !== 6) {
      toast({ title: 'Senha invalida', description: 'A senha deve ter 6 digitos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const response = await apiRequest('POST', '/api/auth/customer-login', { 
        whatsapp: cleanPhone, 
        password 
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.requiresPasswordChange) {
          setPendingLoginData({ user: data.user, address: data.address });
          setShowChangePasswordDialog(true);
        } else {
          login(data.user, 'customer');
          if (data.address) {
            setAddress(data.address);
          }
          toast({ title: 'Bem-vindo de volta!', description: `Ola, ${data.user.name}!` });
          
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect') || '/';
          setLocation(redirect);
        }
      } else {
        toast({ title: 'Erro', description: data.error || 'Senha incorreta', variant: 'destructive' });
      }
    } catch (error: any) {
      let errorMsg = 'Verifique sua senha e tente novamente';
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
      }
      toast({ 
        title: 'Erro ao entrar', 
        description: errorMsg, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotPasswordLoading(true);
    try {
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const response = await apiRequest('POST', '/api/auth/forgot-password', { whatsapp: cleanPhone });
      const data = await response.json();
      
      if (data.success) {
        setShowForgotPasswordDialog(false);
        toast({ 
          title: 'Solicitacao enviada!', 
          description: 'O administrador entrara em contato pelo WhatsApp com sua nova senha temporaria.'
        });
        setStep('phone');
        setPassword('');
      } else {
        toast({ title: 'Erro', description: data.error || 'Erro ao solicitar', variant: 'destructive' });
      }
    } catch (error: any) {
      let errorMsg = 'Tente novamente mais tarde';
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
      }
      toast({ title: 'Erro', description: errorMsg, variant: 'destructive' });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length !== 6) {
      toast({ title: 'Senha invalida', description: 'A senha deve ter 6 digitos', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Senhas nao conferem', description: 'Digite a mesma senha nos dois campos', variant: 'destructive' });
      return;
    }

    setChangePasswordLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/change-password', {
        userId: pendingLoginData?.user?.id,
        newPassword
      });
      const data = await response.json();
      
      if (data.success) {
        setShowChangePasswordDialog(false);
        login(data.user, 'customer');
        if (pendingLoginData?.address) {
          setAddress(pendingLoginData.address);
        }
        toast({ title: 'Senha alterada!', description: 'Sua nova senha foi definida com sucesso.' });
        
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/';
        setLocation(redirect);
      } else {
        toast({ title: 'Erro', description: data.error || 'Erro ao alterar senha', variant: 'destructive' });
      }
    } catch (error: any) {
      let errorMsg = 'Tente novamente';
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
      }
      toast({ title: 'Erro', description: errorMsg, variant: 'destructive' });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast({ title: 'Nome obrigatorio', variant: 'destructive' });
      return;
    }
    if (password.length !== 6) {
      toast({ title: 'Senha invalida', description: 'A senha deve ter 6 digitos', variant: 'destructive' });
      return;
    }
    if (!selectedNeighborhood) {
      toast({ title: 'Bairro obrigatorio', description: 'Selecione seu bairro', variant: 'destructive' });
      return;
    }
    if (!street || !number) {
      toast({ title: 'Endereco incompleto', description: 'Preencha rua e numero', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = whatsapp.replace(/\D/g, '');
      const response = await apiRequest('POST', '/api/auth/register', {
        user: { name, whatsapp: cleanPhone, password },
        address: { 
          street, 
          number, 
          complement, 
          neighborhood: selectedNeighborhood, 
          city: 'Sao Paulo', 
          state: 'SP', 
          zipCode: '', 
          notes 
        }
      });
      const data = await response.json();
      
      login(data.user, 'customer');
      setAddress(data.address);
      toast({ title: 'Cadastro realizado!', description: `Bem-vindo, ${name}!` });
      
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/';
      setLocation(redirect);
    } catch (error: any) {
      let errorMsg = 'Tente novamente';
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
      }
      toast({ 
        title: 'Erro ao cadastrar', 
        description: errorMsg, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const stepIndicators = [
    { step: 'phone', label: 'Telefone' },
    { step: 'password', label: 'Senha' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-black/50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-20 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-card/80 backdrop-blur-xl border-primary/20 shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-2">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Vibe Drinks" 
                className="h-14 mx-auto mb-4 hover:opacity-80 transition-opacity"
              />
            </Link>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CardTitle className="font-serif text-2xl bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                  {step === 'phone' && 'Entrar'}
                  {step === 'password' && `Ola, ${userName}!`}
                  {step === 'register' && 'Criar Conta'}
                </CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  {step === 'phone' && 'Digite seu numero de WhatsApp para continuar'}
                  {step === 'password' && 'Digite sua senha de 6 digitos'}
                  {step === 'register' && 'Complete seu cadastro para fazer pedidos'}
                </CardDescription>
              </motion.div>
            </AnimatePresence>

            {step !== 'register' && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {stepIndicators.map((indicator, index) => (
                  <div key={indicator.step} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        step === indicator.step 
                          ? 'bg-primary text-primary-foreground' 
                          : step === 'password' && indicator.step === 'phone'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {step === 'password' && indicator.step === 'phone' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < stepIndicators.length - 1 && (
                      <div className={`w-12 h-0.5 mx-1 ${
                        step === 'password' ? 'bg-primary' : 'bg-secondary'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            <AnimatePresence mode="wait">
              {step === 'phone' && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-foreground">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(11) 9 1234-5678"
                        value={whatsapp}
                        onChange={handlePhoneChange}
                        className="pl-11 bg-secondary/50 border-primary/20 text-foreground focus:border-primary h-12 text-lg"
                        data-testid="input-whatsapp"
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-lg"
                    onClick={handleCheckPhone}
                    disabled={isLoading}
                    data-testid="button-continue"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-primary"
                    onClick={() => setLocation('/')}
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para o site
                  </Button>
                </motion.div>
              )}

              {step === 'password' && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">Senha (6 digitos)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                      <Input
                        id="password"
                        type="password"
                        inputMode="numeric"
                        placeholder="******"
                        value={password}
                        onChange={handlePasswordChange}
                        maxLength={6}
                        className="pl-11 bg-secondary/50 border-primary/20 text-foreground text-center text-2xl tracking-[0.5em] h-12 font-mono"
                        data-testid="input-password"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setStep('phone');
                        setPassword('');
                      }}
                      data-testid="button-back-password"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
                      onClick={handleLogin}
                      disabled={isLoading || password.length !== 6}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Entrar'
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground text-sm hover:text-primary"
                    onClick={() => setShowForgotPasswordDialog(true)}
                    data-testid="button-forgot-password"
                  >
                    Esqueci minha senha
                  </Button>
                </motion.div>
              )}

              {step === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-11 bg-secondary/50 border-primary/20 text-foreground h-11"
                        data-testid="input-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-foreground">Crie uma senha (6 digitos)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                      <Input
                        id="register-password"
                        type="password"
                        inputMode="numeric"
                        placeholder="******"
                        value={password}
                        onChange={handlePasswordChange}
                        maxLength={6}
                        className="pl-11 bg-secondary/50 border-primary/20 text-foreground text-center text-xl tracking-[0.5em] h-11 font-mono"
                        data-testid="input-register-password"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Apenas numeros, 6 digitos</p>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-secondary/30 border border-primary/10">
                    <Label className="text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Endereco de entrega
                    </Label>
                    
                    <div className="space-y-3">
                      <Select
                        value={selectedNeighborhood}
                        onValueChange={setSelectedNeighborhood}
                      >
                        <SelectTrigger 
                          className="bg-secondary/50 border-primary/20 h-11"
                          data-testid="select-neighborhood-register"
                        >
                          <SelectValue placeholder="Selecione seu bairro" />
                        </SelectTrigger>
                        <SelectContent>
                          {groupedNeighborhoods.map(({ zone, zoneInfo, neighborhoods }) => (
                            <div key={zone}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50 sticky top-0">
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
                      
                      {selectedNeighborhoodFee !== null && (
                        <p className="text-sm text-primary flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Taxa de entrega: {formatPrice(selectedNeighborhoodFee)}
                        </p>
                      )}

                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          placeholder="Rua"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="col-span-3 bg-secondary/50 border-primary/20 text-foreground h-10"
                          data-testid="input-street"
                        />
                        <Input
                          placeholder="Nro"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                          className="bg-secondary/50 border-primary/20 text-foreground h-10"
                          data-testid="input-number"
                        />
                      </div>

                      <Input
                        placeholder="Complemento (opcional)"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        className="bg-secondary/50 border-primary/20 text-foreground h-10"
                        data-testid="input-complement"
                      />

                      <Textarea
                        placeholder="Observacoes para entrega..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-secondary/50 border-primary/20 text-foreground resize-none"
                        rows={2}
                        data-testid="input-notes"
                      />
                      
                      <p className="text-xs text-muted-foreground">{DELIVERY_FEE_WARNING}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setStep('phone');
                        setPassword('');
                      }}
                      data-testid="button-back-register"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold"
                      onClick={handleRegister}
                      disabled={isLoading}
                      data-testid="button-register"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Criar Conta'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Ao confirmar, o administrador recebera sua solicitacao e entrara em contato pelo WhatsApp com uma senha temporaria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              WhatsApp: <span className="font-medium text-foreground">{whatsapp}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Nome: <span className="font-medium text-foreground">{userName}</span>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForgotPasswordDialog(false)}
              disabled={forgotPasswordLoading}
              data-testid="button-cancel-forgot"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={forgotPasswordLoading}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
              data-testid="button-confirm-forgot"
            >
              {forgotPasswordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Solicitar Nova Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePasswordDialog} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md" 
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle>Criar Nova Senha</DialogTitle>
            <DialogDescription>
              Sua senha foi redefinida pelo administrador. Por favor, crie uma nova senha de 6 digitos para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha (6 digitos)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                <Input
                  id="new-password"
                  type="password"
                  inputMode="numeric"
                  placeholder="******"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  maxLength={6}
                  className="pl-11 bg-secondary/50 border-primary/20 text-foreground text-center text-xl tracking-[0.5em] h-11 font-mono"
                  data-testid="input-new-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
                <Input
                  id="confirm-password"
                  type="password"
                  inputMode="numeric"
                  placeholder="******"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  maxLength={6}
                  className="pl-11 bg-secondary/50 border-primary/20 text-foreground text-center text-xl tracking-[0.5em] h-11 font-mono"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordLoading || newPassword.length !== 6 || confirmPassword.length !== 6}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
              data-testid="button-save-new-password"
            >
              {changePasswordLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
