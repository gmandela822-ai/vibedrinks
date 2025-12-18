import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Zap, Bell, Wifi } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const installed = localStorage.getItem('pwa-installed');
    
    if (installed === 'true') {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (dismissed !== 'true') {
        setTimeout(() => {
          setShowModal(true);
        }, 2000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (isInstalled || !deferredPrompt) return;
    
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed === 'true') return;

    const handleScroll = () => {
      if (!hasInteracted && window.scrollY > 300) {
        setHasInteracted(true);
        setShowBanner(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [deferredPrompt, isInstalled, hasInteracted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('pwa-installed', 'true');
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }

    setDeferredPrompt(null);
    setShowBanner(false);
    setShowModal(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-background border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="w-6 h-6 text-primary" />
              Instale o Vibe Drinks!
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Tenha a melhor experiencia instalando nosso app no seu dispositivo!
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                <Zap className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Acesso rapido</p>
                  <p className="text-xs text-muted-foreground">Abra direto da tela inicial</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                <Wifi className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Funciona offline</p>
                  <p className="text-xs text-muted-foreground">Navegue mesmo sem internet</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-md bg-secondary/50">
                <Bell className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Notificacoes</p>
                  <p className="text-xs text-muted-foreground">Receba atualizacoes dos pedidos</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={handleInstall} 
                className="w-full"
                data-testid="button-install-pwa-modal"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Agora
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDismiss}
                className="w-full text-muted-foreground"
                data-testid="button-dismiss-pwa-modal"
              >
                Agora nao
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showBanner && !showModal && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:max-w-sm">
          <Card className="border-primary/30 bg-background/95 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Instale o Vibe Drinks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Acesso rapido direto da tela inicial
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      onClick={handleInstall}
                      data-testid="button-install-pwa-banner"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Instalar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleDismissBanner}
                      data-testid="button-dismiss-pwa-banner"
                    >
                      Depois
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={handleDismissBanner}
                  data-testid="button-close-pwa-banner"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
