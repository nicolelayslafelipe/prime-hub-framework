import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Tag, 
  Percent, 
  DollarSign,
  Calendar,
  Users,
  Loader2
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

const initialCoupon: Partial<Coupon> = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_value: 0,
  max_discount: null,
  usage_limit: null,
  is_active: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon>>(initialCoupon);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    if (!editingCoupon.code?.trim()) {
      toast.error('Código do cupom é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCoupon.id) {
        // Update
        const { error } = await supabase
          .from('coupons')
          .update({
            code: editingCoupon.code.toUpperCase(),
            description: editingCoupon.description,
            discount_type: editingCoupon.discount_type,
            discount_value: editingCoupon.discount_value,
            min_order_value: editingCoupon.min_order_value || 0,
            max_discount: editingCoupon.max_discount,
            usage_limit: editingCoupon.usage_limit,
            valid_until: editingCoupon.valid_until,
            is_active: editingCoupon.is_active,
          })
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Cupom atualizado!');
      } else {
        // Create
        const { error } = await supabase
          .from('coupons')
          .insert({
            code: editingCoupon.code.toUpperCase(),
            description: editingCoupon.description,
            discount_type: editingCoupon.discount_type,
            discount_value: editingCoupon.discount_value,
            min_order_value: editingCoupon.min_order_value || 0,
            max_discount: editingCoupon.max_discount,
            usage_limit: editingCoupon.usage_limit,
            valid_until: editingCoupon.valid_until,
            is_active: editingCoupon.is_active ?? true,
          });

        if (error) throw error;
        toast.success('Cupom criado!');
      }

      setIsDialogOpen(false);
      setEditingCoupon(initialCoupon);
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      if (error.code === '23505') {
        toast.error('Já existe um cupom com este código');
      } else {
        toast.error('Erro ao salvar cupom');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cupom excluído!');
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error('Erro ao atualizar cupom');
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setEditingCoupon(initialCoupon);
    setIsDialogOpen(true);
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isLimitReached = (coupon: Coupon) => {
    if (!coupon.usage_limit) return false;
    return coupon.usage_count >= coupon.usage_limit;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Cupons" subtitle="Gerencie cupons de desconto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Cupons" subtitle="Gerencie cupons de desconto">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-5 w-5" />
            <span>{coupons.length} cupons cadastrados</span>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Código do Cupom</Label>
                  <Input
                    placeholder="EX: DESCONTO10"
                    value={editingCoupon.code || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Desconto para novos clientes"
                    value={editingCoupon.description || ''}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={editingCoupon.discount_type}
                      onValueChange={(v) => setEditingCoupon({ ...editingCoupon, discount_type: v as 'percentage' | 'fixed' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor do Desconto</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editingCoupon.discount_value || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_value: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pedido Mínimo (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editingCoupon.min_order_value || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, min_order_value: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto Máximo (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Sem limite"
                      value={editingCoupon.max_discount || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, max_discount: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Limite de Uso</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Ilimitado"
                      value={editingCoupon.usage_limit || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, usage_limit: e.target.value ? Number(e.target.value) : null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Válido Até</Label>
                    <Input
                      type="date"
                      value={editingCoupon.valid_until?.split('T')[0] || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, valid_until: e.target.value || null })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label>Cupom Ativo</Label>
                  <Switch
                    checked={editingCoupon.is_active ?? true}
                    onCheckedChange={(v) => setEditingCoupon({ ...editingCoupon, is_active: v })}
                  />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingCoupon.id ? 'Salvar Alterações' : 'Criar Cupom'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {coupons.length === 0 ? (
          <Card className="p-12 text-center glass">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Nenhum cupom cadastrado</h3>
            <p className="text-muted-foreground mb-4">Crie cupons de desconto para seus clientes</p>
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Cupom
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className={`p-4 glass ${!coupon.is_active && 'opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {coupon.discount_type === 'percentage' ? (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Percent className="h-5 w-5 text-primary" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-accent" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg">{coupon.code}</p>
                      <p className="text-2xl font-bold text-primary">{formatDiscount(coupon)}</p>
                    </div>
                  </div>
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={(v) => toggleActive(coupon.id, v)}
                  />
                </div>

                {coupon.description && (
                  <p className="text-sm text-muted-foreground mb-3">{coupon.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {coupon.min_order_value > 0 && (
                    <Badge variant="secondary">
                      Mín. R$ {coupon.min_order_value.toFixed(2)}
                    </Badge>
                  )}
                  {coupon.max_discount && (
                    <Badge variant="secondary">
                      Máx. R$ {coupon.max_discount.toFixed(2)}
                    </Badge>
                  )}
                  {isExpired(coupon) && (
                    <Badge variant="destructive">Expirado</Badge>
                  )}
                  {isLimitReached(coupon) && (
                    <Badge variant="destructive">Limite atingido</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {coupon.usage_count} usos {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                  </div>
                  {coupon.valid_until && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Até {new Date(coupon.valid_until).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(coupon)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
