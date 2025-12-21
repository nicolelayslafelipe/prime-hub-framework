import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashRegisterClose } from './CashRegisterClose';

interface CashRegisterStatusProps {
  isOpen: boolean;
  openingAmount: number;
  openedAt: string;
  summary: {
    totalSales: number;
    totalPix: number;
    totalCard: number;
    totalCash: number;
    transactionCount: number;
  };
  onCloseRegister: (amount: number, notes?: string) => Promise<boolean>;
}

export function CashRegisterStatus({ 
  isOpen, 
  openingAmount, 
  openedAt, 
  summary,
  onCloseRegister 
}: CashRegisterStatusProps) {
  const [showCloseModal, setShowCloseModal] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 bg-accent/10 border-b border-border">
        <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
          <DollarSign className="h-3 w-3 mr-1" />
          Caixa Aberto
        </Badge>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Aberto às {format(new Date(openedAt), "HH:mm", { locale: ptBR })}
          </span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Inicial: </span>
          <span className="font-medium">{formatPrice(openingAmount)}</span>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Vendas: </span>
          <span className="font-medium text-primary">{formatPrice(summary.totalSales)}</span>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCloseModal(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" />
            Fechar Caixa
          </Button>
        </div>
      </div>

      <CashRegisterClose
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onCloseRegister={onCloseRegister}
        summary={summary}
        openingAmount={openingAmount}
      />
    </>
  );
}
