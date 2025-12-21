import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, CheckCircle, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashRegisterCloseProps {
  open: boolean;
  onClose: () => void;
  onCloseRegister: (amount: number, notes?: string) => Promise<boolean>;
  summary: {
    totalSales: number;
    totalPix: number;
    totalCard: number;
    totalCash: number;
    transactionCount: number;
  };
  openingAmount: number;
}

export function CashRegisterClose({ 
  open, 
  onClose, 
  onCloseRegister, 
  summary,
  openingAmount 
}: CashRegisterCloseProps) {
  const [countedAmount, setCountedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const expectedCash = openingAmount + summary.totalCash;
  const counted = parseFloat(countedAmount) || 0;
  const difference = counted - expectedCash;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await onCloseRegister(counted, notes || undefined);
    
    if (success) {
      setCountedAmount('');
      setNotes('');
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Fechar Caixa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Summary */}
          <div className="space-y-3 p-4 rounded-lg bg-secondary/50">
            <h4 className="font-semibold text-sm">Resumo do Caixa</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Inicial:</span>
                <span className="font-medium">{formatPrice(openingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas em Dinheiro:</span>
                <span className="font-medium">{formatPrice(summary.totalCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas em Cartão:</span>
                <span className="font-medium">{formatPrice(summary.totalCard)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas em PIX:</span>
                <span className="font-medium">{formatPrice(summary.totalPix)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total Vendas:</span>
                <span className="text-primary">{formatPrice(summary.totalSales)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Transações:</span>
                <span>{summary.transactionCount}</span>
              </div>
            </div>
          </div>

          {/* Expected Cash */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Saldo Esperado em Dinheiro:</span>
              <span className="text-xl font-bold text-primary">{formatPrice(expectedCash)}</span>
            </div>
          </div>

          {/* Counted Amount */}
          <div className="space-y-2">
            <Label htmlFor="counted">Valor Contado (R$)</Label>
            <Input
              id="counted"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={countedAmount}
              onChange={(e) => setCountedAmount(e.target.value)}
            />
          </div>

          {/* Difference */}
          {countedAmount && (
            <div className={cn(
              'p-3 rounded-lg flex items-center gap-3',
              difference === 0 ? 'bg-accent/10 text-accent' :
              difference > 0 ? 'bg-accent/10 text-accent' :
              'bg-destructive/10 text-destructive'
            )}>
              {difference === 0 ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <div>
                <p className="font-semibold">
                  {difference === 0 ? 'Caixa conferido!' :
                   difference > 0 ? `Sobra de ${formatPrice(difference)}` :
                   `Falta de ${formatPrice(Math.abs(difference))}`}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o fechamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading || !countedAmount}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fechando...
                </>
              ) : (
                'Fechar Caixa'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
