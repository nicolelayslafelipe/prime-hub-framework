import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CashRegister {
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

interface CashTransaction {
  id: string;
  cash_register_id: string;
  order_id: string | null;
  type: 'sale' | 'withdrawal' | 'deposit' | 'opening';
  payment_method: string;
  amount: number;
  notes: string | null;
  created_at: string;
}

interface CashSummary {
  totalSales: number;
  totalPix: number;
  totalCard: number;
  totalCash: number;
  transactionCount: number;
}

export function useCashRegister() {
  const { user } = useAuth();
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to access latest transactions in closeRegister without adding as dependency
  const transactionsRef = useRef<CashTransaction[]>([]);
  transactionsRef.current = transactions;

  const fetchCurrentRegister = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentRegister(data as CashRegister | null);
    } catch (err) {
      console.error('Error fetching cash register:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!currentRegister) {
      setTransactions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('cash_register_id', currentRegister.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as CashTransaction[]) || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [currentRegister]);

  useEffect(() => {
    fetchCurrentRegister();
  }, [fetchCurrentRegister]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const openRegister = useCallback(async (openingAmount: number) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          user_id: user.id,
          opening_amount: openingAmount,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      // Add opening transaction
      await supabase.from('cash_transactions').insert({
        cash_register_id: data.id,
        type: 'opening',
        payment_method: 'cash',
        amount: openingAmount,
        notes: 'Abertura de caixa',
      });

      setCurrentRegister(data as CashRegister);
      toast.success('Caixa aberto com sucesso!');
      return true;
    } catch (err) {
      console.error('Error opening register:', err);
      toast.error('Erro ao abrir caixa');
      return false;
    }
  }, [user]);

  const closeRegister = useCallback(async (closingAmount: number, notes?: string) => {
    if (!currentRegister) {
      toast.error('Nenhum caixa aberto');
      return false;
    }

    try {
      // Use ref to get latest transactions
      const currentTransactions = transactionsRef.current;
      const sales = currentTransactions.filter(t => t.type === 'sale');
      const totalCash = sales
        .filter(t => t.payment_method === 'cash' || t.payment_method === 'dinheiro')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const expectedAmount = currentRegister.opening_amount + totalCash;
      const difference = closingAmount - expectedAmount;

      const { error } = await supabase
        .from('cash_registers')
        .update({
          status: 'closed',
          closing_amount: closingAmount,
          expected_amount: expectedAmount,
          difference: difference,
          notes: notes || null,
          closed_at: new Date().toISOString(),
        })
        .eq('id', currentRegister.id);

      if (error) throw error;

      setCurrentRegister(null);
      setTransactions([]);
      toast.success('Caixa fechado com sucesso!');
      return true;
    } catch (err) {
      console.error('Error closing register:', err);
      toast.error('Erro ao fechar caixa');
      return false;
    }
  }, [currentRegister]);

  const addTransaction = useCallback(async (
    orderId: string,
    paymentMethod: string,
    amount: number
  ) => {
    if (!currentRegister) return false;

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          cash_register_id: currentRegister.id,
          order_id: orderId,
          type: 'sale',
          payment_method: paymentMethod,
          amount: amount,
        });

      if (error) throw error;
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('Error adding transaction:', err);
      return false;
    }
  }, [currentRegister, fetchTransactions]);

  const getCashSummary = useCallback((): CashSummary => {
    const sales = transactions.filter(t => t.type === 'sale');
    
    return {
      totalSales: sales.reduce((acc, t) => acc + t.amount, 0),
      totalPix: sales.filter(t => t.payment_method === 'pix').reduce((acc, t) => acc + t.amount, 0),
      totalCard: sales.filter(t => 
        t.payment_method.includes('card') || 
        t.payment_method === 'cartao' || 
        t.payment_method === 'cartão' ||
        t.payment_method === 'credit' ||
        t.payment_method === 'debit'
      ).reduce((acc, t) => acc + t.amount, 0),
      totalCash: sales.filter(t => 
        t.payment_method === 'cash' || 
        t.payment_method === 'dinheiro'
      ).reduce((acc, t) => acc + t.amount, 0),
      transactionCount: sales.length,
    };
  }, [transactions]);

  const getRegisterHistory = useCallback(async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as CashRegister[]) || [];
    } catch (err) {
      console.error('Error fetching register history:', err);
      return [];
    }
  }, []);

  return {
    currentRegister,
    transactions,
    isLoading,
    isOpen: !!currentRegister,
    openRegister,
    closeRegister,
    addTransaction,
    getCashSummary,
    getRegisterHistory,
    refetch: fetchCurrentRegister,
  };
}
