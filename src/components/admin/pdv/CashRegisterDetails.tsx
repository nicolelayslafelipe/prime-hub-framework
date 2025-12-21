import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, 
  Clock, 
  User, 
  CreditCard, 
  Banknote, 
  Smartphone,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CashTransaction {
  id: string;
  type: string;
  payment_method: string;
  amount: number;
  order_id: string | null;
  notes: string | null;
  created_at: string;
}

interface CashRegisterDetailsProps {
  open: boolean;
  onClose: () => void;
  register: {
    id: string;
    user_id: string;
    status: 'open' | 'closed';
    opening_amount: number;
    closing_amount: number | null;
    expected_amount: number | null;
    difference: number | null;
    notes: string | null;
    opened_at: string;
    closed_at: string | null;
    userName?: string;
  } | null;
}

export function CashRegisterDetails({ open, onClose, register }: CashRegisterDetailsProps) {
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      if (!register?.id || !open) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('cash_transactions')
          .select('*')
          .eq('cash_register_id', register.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [register?.id, open]);

  if (!register) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), "HH:mm", { locale: ptBR });
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'credit':
      case 'debit':
      case 'cartao':
      case 'cartão':
        return <CreditCard className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opening':
        return <ArrowUpCircle className="h-4 w-4 text-accent" />;
      case 'sale':
        return <ShoppingBag className="h-4 w-4 text-primary" />;
      case 'withdrawal':
        return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'opening': return 'Abertura';
      case 'sale': return 'Venda';
      case 'withdrawal': return 'Retirada';
      default: return type;
    }
  };

  // Calculate totals by payment method
  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'sale') {
      const method = t.payment_method.toLowerCase();
      acc[method] = (acc[method] || 0) + t.amount;
      acc.total = (acc.total || 0) + t.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const salesCount = transactions.filter(t => t.type === 'sale').length;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes do Caixa
            </DialogTitle>
            <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
              {register.status === 'open' ? 'Aberto' : 'Fechado'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Operador</span>
              </div>
              <p className="font-medium">{register.userName || 'Usuário'}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Abertura</span>
              </div>
              <p className="font-medium">{formatDateTime(register.opened_at)}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Valor Inicial</span>
              </div>
              <p className="font-medium">{formatPrice(register.opening_amount)}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Vendas</span>
              </div>
              <p className="font-bold text-primary">{salesCount} ({formatPrice(totals.total || 0)})</p>
            </div>
          </div>

          {/* Totals by payment method */}
          {Object.keys(totals).length > 1 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(totals)
                .filter(([key]) => key !== 'total')
                .map(([method, amount]) => (
                  <Badge key={method} variant="outline" className="gap-1">
                    {getPaymentIcon(method)}
                    <span className="capitalize">{method}</span>: {formatPrice(amount)}
                  </Badge>
                ))}
            </div>
          )}

          {/* Transactions list */}
          <div className="flex-1 border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 text-sm font-medium border-b grid grid-cols-12 gap-2">
              <span className="col-span-2">Hora</span>
              <span className="col-span-3">Tipo</span>
              <span className="col-span-3">Pagamento</span>
              <span className="col-span-2 text-right">Valor</span>
              <span className="col-span-2 text-right">Pedido</span>
            </div>
            <ScrollArea className="h-[280px]">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma transação registrada</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((t) => (
                    <div 
                      key={t.id} 
                      className="px-4 py-2 text-sm grid grid-cols-12 gap-2 items-center hover:bg-muted/50"
                    >
                      <span className="col-span-2 text-muted-foreground">
                        {formatTime(t.created_at)}
                      </span>
                      <span className="col-span-3 flex items-center gap-1.5">
                        {getTypeIcon(t.type)}
                        {getTypeLabel(t.type)}
                      </span>
                      <span className="col-span-3 flex items-center gap-1.5 capitalize">
                        {getPaymentIcon(t.payment_method)}
                        {t.payment_method}
                      </span>
                      <span className={cn(
                        "col-span-2 text-right font-medium",
                        t.type === 'sale' && "text-accent",
                        t.type === 'withdrawal' && "text-destructive"
                      )}>
                        {t.type === 'withdrawal' ? '-' : ''}{formatPrice(t.amount)}
                      </span>
                      <span className="col-span-2 text-right text-muted-foreground">
                        {t.order_id ? `#${t.order_id.slice(0, 8)}` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Closing info */}
          {register.status === 'closed' && register.closing_amount !== null && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">Valor Esperado</p>
                <p className="font-medium">{formatPrice(register.expected_amount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Contado</p>
                <p className="font-medium">{formatPrice(register.closing_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Diferença</p>
                <p className={cn(
                  "font-bold",
                  register.difference === 0 ? "text-accent" :
                  (register.difference || 0) > 0 ? "text-accent" : "text-destructive"
                )}>
                  {register.difference === 0 ? 'OK' : formatPrice(register.difference || 0)}
                </p>
              </div>
            </div>
          )}

          {register.notes && (
            <div className="text-sm text-muted-foreground border-t pt-3">
              <span className="font-medium">Observações:</span> {register.notes}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
