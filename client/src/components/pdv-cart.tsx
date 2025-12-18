import { memo } from 'react';
import { Plus, Minus, Trash2, User, Package, Check, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@shared/schema';
import { type Salesperson, SALESPERSON_LABELS } from '@shared/schema';

interface CartItem {
  product: Product;
  quantity: number;
}

interface NotesAndDiscountInputsProps {
  notes: string;
  manualDiscount: string;
  onNoteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface CartContentProps {
  salesperson: Salesperson | null;
  cart: CartItem[];
  notes: string;
  manualDiscount: string;
  discountValue: number;
  subtotal: number;
  total: number;
  onSalespersonChange: (value: string) => void;
  onNoteChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onFinalizeSale: () => void;
}

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

export const NotesAndDiscountInputs = memo(({
  notes,
  manualDiscount,
  onNoteChange,
  onDiscountChange,
}: NotesAndDiscountInputsProps) => (
  <>
    <Input
      placeholder="Observações..."
      value={notes}
      onChange={onNoteChange}
      className="bg-secondary border-primary/30 text-sm"
      data-testid="input-notes"
    />
    <div className="flex items-center gap-2">
      <Percent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder="Desconto R$ (ex: 10.50)"
        value={manualDiscount}
        onChange={onDiscountChange}
        className="bg-secondary border-primary/30 text-sm flex-1"
        data-testid="input-discount"
      />
    </div>
  </>
));

NotesAndDiscountInputs.displayName = 'NotesAndDiscountInputs';

export const CartContent = memo(({
  salesperson,
  cart,
  notes,
  manualDiscount,
  discountValue,
  subtotal,
  total,
  onSalespersonChange,
  onNoteChange,
  onDiscountChange,
  onRemoveFromCart,
  onUpdateQuantity,
  onFinalizeSale,
}: CartContentProps) => (
  <div className="flex flex-col h-full">
    <div className="p-3 border-b border-border">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Select 
          value={salesperson || undefined} 
          onValueChange={onSalespersonChange}
        >
          <SelectTrigger className="bg-secondary border-primary/30 text-sm" data-testid="select-salesperson">
            <SelectValue placeholder="Selecione o Balconista" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SALESPERSON_LABELS) as [Salesperson, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key} data-testid={`option-${key}`}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    <div className="flex-1 overflow-auto p-3">
      {cart.length === 0 ? (
        <div className="h-full flex items-center justify-center text-muted-foreground text-center">
          <div>
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs">Toque em um produto</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.product.id} className="bg-secondary rounded-lg p-2" data-testid={`cart-item-${item.product.id}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-xs flex-1 line-clamp-1">{item.product.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onRemoveFromCart(item.product.id)}
                  data-testid={`button-remove-${item.product.id}`}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    data-testid={`button-decrease-${item.product.id}`}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-medium w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    data-testid={`button-increase-${item.product.id}`}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-bold text-primary text-sm">
                  {formatCurrency(Number(item.product.salePrice) * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="p-3 border-t border-border space-y-2">
      <NotesAndDiscountInputs
        notes={notes}
        manualDiscount={manualDiscount}
        onNoteChange={onNoteChange}
        onDiscountChange={onDiscountChange}
      />

      <div className="flex justify-between text-sm">
        <span>Subtotal:</span>
        <span className="font-bold">{formatCurrency(subtotal)}</span>
      </div>

      {discountValue > 0 && (
        <div className="flex justify-between text-green-400 text-sm">
          <span>Desconto:</span>
          <span>-{formatCurrency(discountValue)}</span>
        </div>
      )}

      <div className="flex justify-between text-lg font-bold text-primary">
        <span>Total:</span>
        <span>{formatCurrency(total)}</span>
      </div>

      <Button
        className="w-full py-4"
        disabled={cart.length === 0}
        onClick={onFinalizeSale}
        data-testid="button-finalize-sale"
      >
        <Check className="h-4 w-4 mr-2" />
        Finalizar Venda
      </Button>
    </div>
  </div>
));

CartContent.displayName = 'CartContent';
