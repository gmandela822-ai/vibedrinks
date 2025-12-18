import { ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart';

interface FloatingCartButtonProps {
  onClick: () => void;
}

export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-6 right-6 z-50"
        data-testid="container-floating-cart"
      >
        <button
          onClick={onClick}
          className="relative rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-bold shadow-2xl transition-all duration-300 border-2 border-amber-300 flex items-center gap-3 min-h-14"
          style={{
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
          data-testid="button-floating-cart"
        >
          <motion.div
            className="flex items-center gap-3 px-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-black text-amber-400 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-amber-400"
                data-testid="badge-cart-count"
              >
                {itemCount}
              </motion.span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-80">Finalizar Compra</span>
              <span className="text-lg font-bold" data-testid="text-cart-subtotal">{formatCurrency(subtotal)}</span>
            </div>
          </motion.div>
        </button>

        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 blur-xl opacity-40 -z-10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          data-testid="glow-overlay"
        />
      </motion.div>
    </AnimatePresence>
  );
}
