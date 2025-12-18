import { useState } from 'react';
import { useLocation } from 'wouter';
import { Lock, User, Loader2, Phone, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import logoImage from '@assets/vibedrinksfinal_1765554834904.gif';

type LoginMode = 'staff' | 'motoboy';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

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
    if (loginMode === 'motoboy') {
      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
      setPassword(value);
    } else {
      setPassword(e.target.value);
    }
  };

  const handleStaffLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      if (data.success && data.user) {
        login(data.user, data.role);
        toast({ title: 'Login realizado!', description: `Bem-vindo, ${data.user.name}!` });
        
        setTimeout(() => {
          if (data.role === 'admin') {
            window.location.href = '/admin';
          } else if (data.role === 'kitchen') {
            window.location.href = '/cozinha';
          } else if (data.role === 'motoboy') {
            window.location.href = '/motoboy';
          } else if (data.role === 'pdv') {
            window.location.href = '/pdv';
          }
        }, 100);
      } else {
        toast({ title: 'Credenciais invalidas', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Erro ao fazer login', description: 'Verifique suas credenciais', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMotoboyLogin = async () => {
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ title: 'Numero invalido', description: 'Digite um numero de WhatsApp valido', variant: 'destructive' });
      return;
    }
    if (password.length !== 6) {
      toast({ title: 'Senha invalida', description: 'A senha deve ter 6 digitos', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/motoboy-login', { 
        whatsapp: cleanPhone, 
        password 
      });
      const data = await response.json();
      
      if (data.success && data.user) {
        login(data.user, 'motoboy');
        toast({ title: 'Login realizado!', description: `Bem-vindo, ${data.user.name}!` });
        
        setTimeout(() => {
          window.location.href = '/motoboy';
        }, 100);
      } else {
        toast({ title: 'Erro', description: data.error || 'Credenciais invalidas', variant: 'destructive' });
      }
    } catch (error: any) {
      let errorMsg = 'Verifique suas credenciais';
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
      }
      toast({ title: 'Erro ao fazer login', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (loginMode === 'staff') {
      handleStaffLogin();
    } else {
      handleMotoboyLogin();
    }
  };

  const switchMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setPassword('');
    setUsername('');
    setWhatsapp('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-primary/20">
        <CardHeader className="text-center">
          <img src={logoImage} alt="Vibe Drinks" className="h-16 mx-auto mb-4" />
          <CardTitle className="font-serif text-2xl text-primary">
            Acesso Restrito
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Login para funcionarios
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={loginMode === 'staff' ? 'default' : 'outline'}
              className={`flex-1 ${loginMode === 'staff' ? 'bg-primary text-primary-foreground' : 'border-primary/50 text-primary'}`}
              onClick={() => switchMode('staff')}
              data-testid="button-mode-staff"
            >
              <User className="h-4 w-4 mr-2" />
              Admin/Cozinha
            </Button>
            <Button
              variant={loginMode === 'motoboy' ? 'default' : 'outline'}
              className={`flex-1 ${loginMode === 'motoboy' ? 'bg-primary text-primary-foreground' : 'border-primary/50 text-primary'}`}
              onClick={() => switchMode('motoboy')}
              data-testid="button-mode-motoboy"
            >
              <Bike className="h-4 w-4 mr-2" />
              Motoboy
            </Button>
          </div>

          {loginMode === 'staff' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-secondary border-primary/30 text-foreground"
                    data-testid="input-username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={handlePasswordChange}
                    className="pl-10 bg-secondary border-primary/30 text-foreground"
                    data-testid="input-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-foreground">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    className="pl-10 bg-secondary border-primary/30 text-foreground"
                    data-testid="input-motoboy-whatsapp"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motoboy-password" className="text-foreground">Senha (6 digitos)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="motoboy-password"
                    type="password"
                    inputMode="numeric"
                    placeholder="000000"
                    value={password}
                    onChange={handlePasswordChange}
                    maxLength={6}
                    className="pl-10 bg-secondary border-primary/30 text-foreground text-center text-xl tracking-widest"
                    data-testid="input-motoboy-password"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Senha cadastrada pelo administrador</p>
              </div>
            </>
          )}

          <Button
            className="w-full bg-primary text-primary-foreground"
            onClick={handleLogin}
            disabled={isLoading}
            data-testid="button-login"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Entrar'
            )}
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            Voltar para o site
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
