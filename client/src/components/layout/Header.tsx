import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import logoImage from '@assets/vibedrinksfinal_1765554834904.gif';

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, subtotal } = useCart();
  const { isAuthenticated, user, logout } = useAuth();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-yellow-400 to-yellow-500 backdrop-blur-xl border-none shadow-2xl" style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3), 0 0px 12px rgba(255, 215, 0, 0.4)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src={logoImage} 
              alt="Vibe Drinks" 
              className="h-10 w-auto hover:opacity-90 transition-opacity drop-shadow-lg"
              data-testid="img-logo"
              style={{ filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.35)) drop-shadow(0 0px 8px rgba(0, 0, 0, 0.2))' }}
            />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative bg-gray-900 text-yellow-400 hover:bg-gray-950 hover:text-yellow-300 transition-all drop-shadow-md hover:drop-shadow-lg active:drop-shadow-sm"
              onClick={onCartOpen}
              data-testid="button-cart"
              style={{ 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingCart className="h-5 w-5 drop-shadow" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge 
                      className="h-5 min-w-5 flex items-center justify-center p-0 px-1 bg-red-500 text-white text-xs font-bold border-none drop-shadow-lg"
                      data-testid="badge-cart-count"
                      style={{ boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
                    >
                      {itemCount}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="icon"
                className="bg-gray-900 text-yellow-400 hover:bg-gray-950 hover:text-yellow-300 transition-all drop-shadow-md hover:drop-shadow-lg active:drop-shadow-sm"
                onClick={() => setLocation('/perfil')}
                data-testid="button-profile"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                <User className="h-5 w-5 drop-shadow" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-900 text-yellow-400 font-medium hover:bg-gray-950 hover:text-yellow-300 transition-all drop-shadow-md hover:drop-shadow-lg active:drop-shadow-sm"
                onClick={() => setLocation('/login')}
                data-testid="button-login"
                style={{ 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s ease'
                }}
              >
                Entrar
              </Button>
            )}

            <Link 
              href="/admin-login" 
              className="text-yellow-400 hover:text-yellow-300 transition-all p-2 drop-shadow hover:drop-shadow-md"
            >
              <Settings className="h-4 w-4 drop-shadow" />
            </Link>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-gray-900 text-yellow-400 hover:bg-gray-950 hover:text-yellow-300 transition-all drop-shadow-md hover:drop-shadow-lg active:drop-shadow-sm" 
                  data-testid="button-menu"
                  style={{ 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 -3px 8px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Menu className="h-5 w-5 drop-shadow" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-900 border-yellow-400/30 backdrop-blur-xl w-80">
                <SheetHeader>
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col h-full pt-8">
                  <div className="flex items-center justify-between mb-8">
                    <img src={logoImage} alt="Vibe Drinks" className="h-8 drop-shadow-lg" />
                  </div>

                  {isAuthenticated && (
                    <div className="space-y-1 mb-8">
                      <p className="text-sm text-gray-400 drop-shadow">Bem-vindo,</p>
                      <p className="text-lg font-semibold text-yellow-400 drop-shadow-md">{user?.name}</p>
                    </div>
                  )}

                  <nav className="flex flex-col gap-2">
                    {isAuthenticated ? (
                      <>
                        <Link 
                          href="/perfil" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-yellow-500/10 transition-all drop-shadow-sm hover:drop-shadow-md"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid="link-profile-mobile"
                          style={{ boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)' }}
                        >
                          <User className="h-5 w-5 text-yellow-400 drop-shadow" />
                          Meu Perfil
                        </Link>
                        <Link 
                          href="/pedidos" 
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-yellow-500/10 transition-all drop-shadow-sm hover:drop-shadow-md"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid="link-orders-mobile"
                          style={{ boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)' }}
                        >
                          <ShoppingCart className="h-5 w-5 text-yellow-400 drop-shadow" />
                          Meus Pedidos
                        </Link>
                        
                        <div className="my-4 border-t border-yellow-400/10" />
                        
                        <Button 
                          variant="ghost" 
                          className="justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 drop-shadow-sm hover:drop-shadow-md transition-all"
                          onClick={() => { logout(); setMobileMenuOpen(false); }}
                          style={{ boxShadow: 'inset 0 -2px 4px rgba(0, 0, 0, 0.2)' }}
                        >
                          <X className="h-5 w-5 mr-3 drop-shadow" />
                          Sair da conta
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold hover:from-yellow-500 hover:to-yellow-600 drop-shadow-lg hover:drop-shadow-xl transition-all"
                        onClick={() => { setLocation('/login'); setMobileMenuOpen(false); }}
                        style={{ boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.15)' }}
                      >
                        Entrar ou Cadastrar
                      </Button>
                    )}
                  </nav>

                  {itemCount > 0 && (
                    <div className="mt-auto pt-8 border-t border-yellow-400/10">
                      <Button
                        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-semibold hover:from-yellow-500 hover:to-yellow-600 drop-shadow-lg hover:drop-shadow-xl transition-all"
                        onClick={() => { onCartOpen(); setMobileMenuOpen(false); }}
                        style={{ boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3), inset 0 -3px 8px rgba(0, 0, 0, 0.15)' }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 drop-shadow" />
                        Ver Carrinho ({itemCount}) - {formatPrice(subtotal)}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
