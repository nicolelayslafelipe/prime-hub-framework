import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { CashRegisterDetails } from '@/components/admin/pdv/CashRegisterDetails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  DollarSign, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Eye,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashRegisterRecord {
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
}

interface TransactionSummary {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalPix: number;
  count: number;
}

interface CashRegisterWithUser extends CashRegisterRecord {
  userName?: string;
  transactionSummary?: TransactionSummary;
}

export default function PDVHistory() {
  const [registers, setRegisters] = useState<CashRegisterWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegister, setSelectedRegister] = useState<CashRegisterWithUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashRegisterWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .order('opened_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const registerData = data || [];
      
      // Fetch user names
      const userIds = [...new Set(registerData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

      // Fetch transaction summaries for each register
      const registerIds = registerData.map(r => r.id);
      const { data: transactions } = await supabase
        .from('cash_transactions')
        .select('cash_register_id, type, payment_method, amount')
        .in('cash_register_id', registerIds)
        .eq('type', 'sale');

      // Group transactions by register
      const summaryMap = new Map<string, TransactionSummary>();
      (transactions || []).forEach(t => {
        const existing = summaryMap.get(t.cash_register_id) || {
          totalSales: 0,
          totalCash: 0,
          totalCard: 0,
          totalPix: 0,
          count: 0,
        };
        
        existing.totalSales += t.amount;
        existing.count += 1;
        
        const method = t.payment_method.toLowerCase();
        if (method === 'cash' || method === 'dinheiro') {
          existing.totalCash += t.amount;
        } else if (method === 'pix') {
          existing.totalPix += t.amount;
        } else {
          existing.totalCard += t.amount;
        }
        
        summaryMap.set(t.cash_register_id, existing);
      });

      setRegisters(registerData.map(r => ({
        ...r,
        userName: profileMap.get(r.user_id) || 'Usuário',
        transactionSummary: summaryMap.get(r.id),
      })) as CashRegisterWithUser[]);
    } catch (err) {
      console.error('Error fetching cash register history:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      // Delete transactions first
      await supabase
        .from('cash_transactions')
        .delete()
        .eq('cash_register_id', deleteTarget.id);

      // Delete the register
      const { error } = await supabase
        .from('cash_registers')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setRegisters(prev => prev.filter(r => r.id !== deleteTarget.id));
      toast.success('Caixa excluído com sucesso');
    } catch (err) {
      console.error('Error deleting cash register:', err);
      toast.error('Erro ao excluir caixa');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  const getDuration = (opened: string, closed: string | null) => {
    if (!closed) return 'Em aberto';
    const start = new Date(opened);
    const end = new Date(closed);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  return (
    <AdminLayout
      title="Histórico de Caixas"
      subtitle="Consulte os caixas anteriores com detalhes de vendas"
    >
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : registers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum histórico de caixa encontrado</p>
            </CardContent>
          </Card>
        ) : (
          registers.map((register) => (
            <Card 
              key={register.id} 
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                register.status === 'open' && 'border-accent ring-1 ring-accent/30'
              )}
              onClick={() => setSelectedRegister(register)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      {formatDate(register.opened_at)}
                    </CardTitle>
                    <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
                      {register.status === 'open' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {register.difference !== null && (
                      <Badge 
                        variant="outline"
                        className={cn(
                          register.difference === 0 
                            ? 'bg-accent/10 text-accent border-accent/30' 
                            : register.difference > 0
                            ? 'bg-accent/10 text-accent border-accent/30'
                            : 'bg-destructive/10 text-destructive border-destructive/30'
                        )}
                      >
                        {register.difference === 0 ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Conferido</>
                        ) : register.difference > 0 ? (
                          <>Sobra: {formatPrice(register.difference)}</>
                        ) : (
                          <><AlertTriangle className="h-3 w-3 mr-1" /> Falta: {formatPrice(Math.abs(register.difference))}</>
                        )}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegister(register);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {register.status === 'closed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(register);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Operador</p>
                      <p className="font-medium">{register.userName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duração</p>
                      <p className="font-medium">{getDuration(register.opened_at, register.closed_at)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Inicial</p>
                    <p className="font-medium">{formatPrice(register.opening_amount)}</p>
                  </div>
                  {register.closing_amount !== null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="font-medium text-primary">{formatPrice(register.closing_amount)}</p>
                    </div>
                  )}
                </div>

                {/* Sales Summary */}
                {register.transactionSummary && register.transactionSummary.count > 0 && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Resumo de Vendas</span>
                      <Badge variant="secondary" className="ml-auto">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        {register.transactionSummary.count} vendas
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total Vendas</p>
                        <p className="font-bold text-primary">
                          {formatPrice(register.transactionSummary.totalSales)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Banknote className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Dinheiro</p>
                        </div>
                        <p className="font-medium">
                          {formatPrice(register.transactionSummary.totalCash)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Cartão</p>
                        </div>
                        <p className="font-medium">
                          {formatPrice(register.transactionSummary.totalCard)}
                        </p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">PIX</p>
                        </div>
                        <p className="font-medium">
                          {formatPrice(register.transactionSummary.totalPix)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {register.notes && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Obs:</span> {register.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Details Modal */}
      <CashRegisterDetails
        open={!!selectedRegister}
        onClose={() => setSelectedRegister(null)}
        register={selectedRegister}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Excluir Caixa"
        description={`Deseja excluir o registro de caixa de ${deleteTarget ? formatDateTime(deleteTarget.opened_at) : ''}? Esta ação é irreversível e todas as transações associadas serão excluídas.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </AdminLayout>
  );
}
