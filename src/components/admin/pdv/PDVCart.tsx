import { usePDV } from '@/contexts/PDVContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingCart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PDVCartProps {
  onCheckout: () => void;
  disabled?: boolean;
}

export function PDVCart({ onCheckout, disabled }: PDVCartProps) {
  const { items, updateQuantity, updateNotes, removeItem, clearCart, getTotal } = usePDV();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const total = getTotal();

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Comanda</h3>
          <span className="text-sm text-muted-foreground">({items.length} itens)</span>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Comanda vazia</p>
              <p className="text-xs">Clique nos produtos para adicionar</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className={cn(
                  'rounded-lg border border-border p-3 space-y-2',
                  'bg-background'
                )}
              >
                {/* Item header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.productName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(item.price)} cada
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-10 text-center font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setExpandedItem(expandedItem === item.productId ? null : item.productId)}
                    >
                      <MessageSquare className={cn(
                        'h-4 w-4',
                        item.notes ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </Button>
                    <span className="font-bold text-primary">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Notes input */}
                {expandedItem === item.productId && (
                  <Input
                    placeholder="Observações..."
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.productId, e.target.value)}
                    className="text-sm"
                  />
                )}

                {/* Show notes preview if collapsed but has notes */}
                {expandedItem !== item.productId && item.notes && (
                  <p className="text-xs text-muted-foreground italic truncate">
                    Obs: {item.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-4">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium">Total</span>
          <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
        </div>

        {/* Checkout button */}
        <Button
          className="w-full h-12 text-lg font-semibold"
          disabled={items.length === 0 || disabled}
          onClick={onCheckout}
        >
          Finalizar Venda
        </Button>
      </div>
    </div>
  );
}
