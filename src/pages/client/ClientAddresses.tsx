import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Home, 
  Building2, 
  Briefcase,
  Star,
  Loader2,
  Search,
  CheckCircle2
} from 'lucide-react';
import { fetchAddressByCep, formatCepForDisplay, isValidCep, formatCep } from '@/lib/cep';

const addressSchema = z.object({
  label: z.string().min(1, 'Informe um nome para o endereço'),
  street: z.string().min(3, 'Informe a rua'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Informe o bairro'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Informe o estado'),
  zip_code: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
  reference: z.string().optional(),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface Address extends AddressFormData {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const labelIcons: Record<string, React.ReactNode> = {
  'Casa': <Home className="h-4 w-4" />,
  'Apartamento': <Building2 className="h-4 w-4" />,
  'Trabalho': <Briefcase className="h-4 w-4" />,
};

const labelOptions = ['Casa', 'Apartamento', 'Trabalho', 'Outro'];

export default function ClientAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFound, setCepFound] = useState(false);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Casa',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      zip_code: '',
      reference: '',
      is_default: false,
    },
  });

  const watchedCep = form.watch('zip_code');

  // Auto-search CEP when valid
  const handleCepSearch = useCallback(async (cep: string) => {
    if (!isValidCep(cep)) {
      setCepFound(false);
      return;
    }

    setIsSearchingCep(true);
    setCepFound(false);

    try {
      const addressData = await fetchAddressByCep(cep);
      
      if (addressData) {
        // Update fields with whatever data we received (keep existing values for partial CEPs)
        if (addressData.street) {
          form.setValue('street', addressData.street, { shouldValidate: true });
        }
        if (addressData.neighborhood) {
          form.setValue('neighborhood', addressData.neighborhood, { shouldValidate: true });
        }
        form.setValue('city', addressData.city, { shouldValidate: true });
        form.setValue('state', addressData.state, { shouldValidate: true });
        setCepFound(true);
        
        if (addressData.isPartial) {
          // Generic city CEP - user needs to fill street and neighborhood
          toast.info('CEP de cidade encontrado', {
            description: 'Preencha a rua e o bairro manualmente',
          });
          // Focus on street field for partial CEPs
          setTimeout(() => {
            document.getElementById('street')?.focus();
          }, 100);
        } else {
          toast.success('Endereço encontrado!');
          // Focus on number field for complete CEPs
          setTimeout(() => {
            document.getElementById('number')?.focus();
          }, 100);
        }
      } else {
        toast.error('CEP não encontrado', {
          description: 'Verifique o CEP digitado',
        });
      }
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsSearchingCep(false);
    }
  }, [form]);

  // Debounced CEP search
  useEffect(() => {
    const cleanCep = formatCep(watchedCep || '');
    if (cleanCep.length === 8) {
      const timer = setTimeout(() => {
        handleCepSearch(cleanCep);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCepFound(false);
    }
  }, [watchedCep, handleCepSearch]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Erro ao carregar endereços');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (address?: Address) => {
    setCepFound(false);
    if (address) {
      setEditingAddress(address);
      form.reset({
        label: address.label,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        reference: address.reference || '',
        is_default: address.is_default,
      });
    } else {
      setEditingAddress(null);
      form.reset({
        label: 'Casa',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: 'SP',
        zip_code: '',
        reference: '',
        is_default: addresses.length === 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setCepFound(false);
    form.reset();
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatCepForDisplay(value);
    form.setValue('zip_code', formatted);
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // If setting as default, unset other defaults first
      if (data.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update({
            label: data.label,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            reference: data.reference || null,
            is_default: data.is_default,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Endereço atualizado!');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            label: data.label,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            reference: data.reference || null,
            is_default: data.is_default,
          });

        if (error) throw error;
        toast.success('Endereço adicionado!');
      }

      handleCloseDialog();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Erro ao salvar endereço');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (addressId: string) => {
    setDeletingAddressId(addressId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAddressId) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', deletingAddressId);

      if (error) throw error;
      toast.success('Endereço excluído!');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Erro ao excluir endereço');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingAddressId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      // Unset all defaults
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (error) throw error;
      toast.success('Endereço padrão atualizado!');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Erro ao definir endereço padrão');
    }
  };

  const formatAddress = (addr: Address) => {
    let formatted = `${addr.street}, ${addr.number}`;
    if (addr.complement) formatted += ` - ${addr.complement}`;
    formatted += ` - ${addr.neighborhood}, ${addr.city} - ${addr.state}`;
    return formatted;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">Meus Endereços</h1>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">Nenhum endereço salvo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione um endereço para facilitar suas entregas
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Endereço
              </Button>
            </CardContent>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {labelIcons[address.label] || <MapPin className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{address.label}</p>
                        {address.is_default && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {formatAddress(address)}
                      </p>
                      {address.reference && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ref: {address.reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => handleSetDefault(address.id)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Definir como padrão
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de endereço</Label>
              <div className="flex flex-wrap gap-2">
                {labelOptions.map((label) => (
                  <Button
                    key={label}
                    type="button"
                    variant={form.watch('label') === label ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => form.setValue('label', label)}
                  >
                    {labelIcons[label]}
                    <span className="ml-1">{label}</span>
                  </Button>
                ))}
              </div>
              {form.formState.errors.label && (
                <p className="text-sm text-destructive">{form.formState.errors.label.message}</p>
              )}
            </div>

            {/* CEP field with auto-search */}
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <div className="relative">
                <Input
                  id="zip_code"
                  placeholder="00000-000"
                  value={form.watch('zip_code')}
                  onChange={handleCepChange}
                  className="pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearchingCep ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : cepFound ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o CEP para preencher automaticamente
              </p>
              {form.formState.errors.zip_code && (
                <p className="text-sm text-destructive">{form.formState.errors.zip_code.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  placeholder="Nome da rua"
                  {...form.register('street')}
                />
                {form.formState.errors.street && (
                  <p className="text-sm text-destructive">{form.formState.errors.street.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  placeholder="Nº"
                  {...form.register('number')}
                />
                {form.formState.errors.number && (
                  <p className="text-sm text-destructive">{form.formState.errors.number.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complement">Complemento (opcional)</Label>
              <Input
                id="complement"
                placeholder="Apto, bloco, etc."
                {...form.register('complement')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                placeholder="Bairro"
                {...form.register('neighborhood')}
              />
              {form.formState.errors.neighborhood && (
                <p className="text-sm text-destructive">{form.formState.errors.neighborhood.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Cidade"
                  {...form.register('city')}
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="UF"
                  maxLength={2}
                  {...form.register('state')}
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Ponto de referência (opcional)</Label>
              <Input
                id="reference"
                placeholder="Próximo ao mercado, etc."
                {...form.register('reference')}
              />
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_default" className="cursor-pointer">Endereço padrão</Label>
                <p className="text-xs text-muted-foreground">
                  Usar este endereço como padrão para entregas
                </p>
              </div>
              <Switch
                id="is_default"
                checked={form.watch('is_default')}
                onCheckedChange={(checked) => form.setValue('is_default', checked)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O endereço será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
