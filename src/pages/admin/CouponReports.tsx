import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  Ticket, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar,
  Percent,
  Hash,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CouponUsageData {
  code: string;
  total_uses: number;
  total_discount: number;
  orders_count: number;
}

interface DailyUsageData {
  date: string;
  uses: number;
  discount: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CouponReports() {
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  
  const startDate = subDays(new Date(), parseInt(period));
  
  // Fetch orders with coupons
  const { data: ordersWithCoupons, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders-with-coupons', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, coupon_code, coupon_discount, total, created_at, status')
        .not('coupon_code', 'is', null)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch all coupons for reference
  const { data: allCoupons, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ['all-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate statistics
  const stats = {
    totalUses: ordersWithCoupons?.length || 0,
    totalDiscount: ordersWithCoupons?.reduce((sum, order) => sum + (order.coupon_discount || 0), 0) || 0,
    averageDiscount: ordersWithCoupons?.length 
      ? (ordersWithCoupons.reduce((sum, order) => sum + (order.coupon_discount || 0), 0) / ordersWithCoupons.length)
      : 0,
    uniqueCoupons: new Set(ordersWithCoupons?.map(o => o.coupon_code)).size,
  };

  // Group by coupon code for chart
  const couponUsageData: CouponUsageData[] = [];
  const couponMap = new Map<string, { uses: number; discount: number }>();
  
  ordersWithCoupons?.forEach(order => {
    if (order.coupon_code) {
      const existing = couponMap.get(order.coupon_code) || { uses: 0, discount: 0 };
      couponMap.set(order.coupon_code, {
        uses: existing.uses + 1,
        discount: existing.discount + (order.coupon_discount || 0),
      });
    }
  });

  couponMap.forEach((value, key) => {
    couponUsageData.push({
      code: key,
      total_uses: value.uses,
      total_discount: value.discount,
      orders_count: value.uses,
    });
  });

  // Sort by uses
  couponUsageData.sort((a, b) => b.total_uses - a.total_uses);

  // Daily usage for line chart
  const dailyData: DailyUsageData[] = [];
  const dailyMap = new Map<string, { uses: number; discount: number }>();
  
  ordersWithCoupons?.forEach(order => {
    const date = format(new Date(order.created_at), 'yyyy-MM-dd');
    const existing = dailyMap.get(date) || { uses: 0, discount: 0 };
    dailyMap.set(date, {
      uses: existing.uses + 1,
      discount: existing.discount + (order.coupon_discount || 0),
    });
  });

  // Fill in missing dates
  for (let i = parseInt(period) - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const data = dailyMap.get(date) || { uses: 0, discount: 0 };
    dailyData.push({
      date: format(new Date(date), 'dd/MM', { locale: ptBR }),
      uses: data.uses,
      discount: data.discount,
    });
  }

  const isLoading = isLoadingOrders || isLoadingCoupons;

  return (
    <AdminLayout title="Relatório de Cupons" subtitle="Análise de uso e descontos aplicados">
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="flex justify-end">
          <Select value={period} onValueChange={(v) => setPeriod(v as '7' | '30' | '90')}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUses}</div>
                  <p className="text-xs text-muted-foreground">
                    pedidos com cupom
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Descontos</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">
                    -R$ {stats.totalDiscount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    em descontos concedidos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Desconto Médio</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    R$ {stats.averageDiscount.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    por pedido
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cupons Únicos</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.uniqueCoupons}</div>
                  <p className="text-xs text-muted-foreground">
                    cupons diferentes utilizados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Usage Over Time */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Uso ao Longo do Tempo
              </CardTitle>
              <CardDescription>
                Quantidade de usos e valor de descontos por dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="left"
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      className="text-xs fill-muted-foreground"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'uses' ? value : `R$ ${value.toFixed(2)}`,
                        name === 'uses' ? 'Usos' : 'Desconto'
                      ]}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="uses" 
                      name="Usos"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="discount" 
                      name="Desconto (R$)"
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível para o período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage by Coupon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Uso por Cupom
              </CardTitle>
              <CardDescription>
                Quantidade de usos por código de cupom
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : couponUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={couponUsageData.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis 
                      type="category" 
                      dataKey="code" 
                      className="text-xs fill-muted-foreground"
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [value, 'Usos']}
                    />
                    <Bar dataKey="total_uses" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhum cupom utilizado no período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount by Coupon */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Desconto por Cupom
              </CardTitle>
              <CardDescription>
                Distribuição do valor de descontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : couponUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={couponUsageData.slice(0, 6)}
                      dataKey="total_discount"
                      nameKey="code"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ code, percent }) => 
                        `${code} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {couponUsageData.slice(0, 6).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Desconto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Nenhum desconto aplicado no período
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Cupons</CardTitle>
            <CardDescription>
              Estatísticas detalhadas de cada cupom cadastrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : allCoupons && allCoupons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Código</th>
                      <th className="text-left py-3 px-2 font-medium">Tipo</th>
                      <th className="text-right py-3 px-2 font-medium">Desconto</th>
                      <th className="text-right py-3 px-2 font-medium">Usos</th>
                      <th className="text-right py-3 px-2 font-medium">Limite</th>
                      <th className="text-center py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCoupons.map((coupon) => (
                      <tr key={coupon.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-mono font-medium">{coupon.code}</td>
                        <td className="py-3 px-2">
                          <Badge variant="secondary">
                            {coupon.discount_type === 'percentage' ? 'Percentual' : 'Fixo'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `R$ ${coupon.discount_value.toFixed(2)}`
                          }
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {coupon.usage_count || 0}
                        </td>
                        <td className="py-3 px-2 text-right text-muted-foreground">
                          {coupon.usage_limit || '∞'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                            {coupon.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cupom cadastrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
