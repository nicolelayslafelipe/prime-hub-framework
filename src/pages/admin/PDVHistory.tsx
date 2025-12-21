import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useCashRegister } from '@/hooks/useCashRegister';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

interface CashRegisterWithUser extends CashRegisterRecord {
  userName?: string;
}

export default function PDVHistory() {
  const [registers, setRegisters] = useState<CashRegisterWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from('cash_registers')
          .select('*')
          .order('opened_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        // Fetch user names
        const userIds = [...new Set((data || []).map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

        setRegisters((data || []).map(r => ({
          ...r,
          userName: profileMap.get(r.user_id) || 'Usuário',
        })) as CashRegisterWithUser[]);
      } catch (err) {
        console.error('Error fetching cash register history:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
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
      subtitle="Consulte os caixas anteriores"
    >
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
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
            <Card key={register.id} className={cn(
              register.status === 'open' && 'border-accent'
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {formatDateTime(register.opened_at)}
                    </CardTitle>
                    <Badge variant={register.status === 'open' ? 'default' : 'secondary'}>
                      {register.status === 'open' ? 'Aberto' : 'Fechado'}
                    </Badge>
                  </div>
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
                </div>
              </CardHeader>
              <CardContent>
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
                {register.notes && (
                  <div className="mt-3 pt-3 border-t border-border">
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
    </AdminLayout>
  );
}
