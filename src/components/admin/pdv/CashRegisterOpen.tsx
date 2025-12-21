import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, DollarSign } from 'lucide-react';

interface CashRegisterOpenProps {
  open: boolean;
  onOpenRegister: (amount: number) => Promise<boolean>;
}

export function CashRegisterOpen({ open, onOpenRegister }: CashRegisterOpenProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await onOpenRegister(parseFloat(amount) || 0);
    
    if (success) {
      setAmount('');
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Abrir Caixa
          </DialogTitle>
          <DialogDescription>
            Informe o valor inicial em dinheiro para começar a operar o PDV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opening-amount">Valor Inicial (R$)</Label>
            <Input
              id="opening-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Este valor representa o troco inicial disponível no caixa.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Abrindo...
              </>
            ) : (
              'Abrir Caixa'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
