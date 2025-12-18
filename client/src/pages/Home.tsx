import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Clock, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { BannerCarousel } from '@/components/home/BannerCarousel';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { ProductGrid } from '@/components/home/ProductGrid';
import { CartSheet } from '@/components/cart/CartSheet';
import { FloatingCartButton } from '@/components/cart/FloatingCartButton';
import { Button } from '@/components/ui/button';
import logoImage from '@assets/vibedrinksfinal_1765554834904.gif';
import type { Product, Category, Banner } from '@shared/schema';

export const TRENDING_CATEGORY_ID = '__trending__';

export default function Home() {
  const [, setLocation] = useLocation();
  const { role } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const privilegedRoles = ['admin', 'kitchen', 'pdv', 'motoboy'];
    if (role && privilegedRoles.includes(role)) {
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        kitchen: '/cozinha',
        pdv: '/pdv',
        motoboy: '/motoboy',
      };
      setLocation(redirectMap[role]);
    }
  }, []);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery<(Category & { salesCount: number })[]>({
    queryKey: ['/api/categories/by-sales'],
  });

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['/api/banners'],
  });

  const { data: trendingProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products/trending'],
  });

  const hasTrendingProducts = trendingProducts.length > 0;

  const displayProducts = selectedCategory === TRENDING_CATEGORY_ID 
    ? trendingProducts 
    : products;

  const effectiveCategory = selectedCategory === TRENDING_CATEGORY_ID 
    ? null 
    : selectedCategory;

  return (
    <div className="min-h-screen bg-background">
      <Header onCartOpen={() => setCartOpen(true)} />
      
      <main>
        <HeroSection />
        
        <BannerCarousel banners={banners} />
        
        <CategoryCarousel 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          showTrending={hasTrendingProducts}
        />
        
        <ProductGrid 
          products={displayProducts}
          categories={categories}
          isLoading={productsLoading}
          selectedCategory={effectiveCategory}
        />

        <section className="py-16 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-4">
                Por que escolher a Vibe Drinks?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Oferecemos a melhor selecao de bebidas premium com entrega rapida e atendimento de qualidade
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Clock,
                  title: 'Entrega Rapida',
                  description: 'Receba suas bebidas em ate 40 minutos na regiao metropolitana'
                },
                {
                  icon: MapPin,
                  title: 'Ampla Cobertura',
                  description: 'Atendemos toda a Grande Sao Paulo com taxas acessiveis'
                },
                {
                  icon: MessageCircle,
                  title: 'Atendimento 24h',
                  description: 'Suporte via WhatsApp para tirar todas suas duvidas'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="text-center p-8 rounded-2xl bg-card/50 border border-primary/10 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/10 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <FloatingCartButton onClick={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
