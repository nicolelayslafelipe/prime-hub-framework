import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, Category } from '@/data/mockProducts';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  image: string;
  tag: string;
  isAvailable: boolean;
}

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

// Check if image is a real URL or just an emoji
const isRealImage = (image: string | undefined | null): boolean => {
  if (!image || typeof image !== 'string') return false;
  return image.startsWith('http') || image.startsWith('/') || image.startsWith('data:') || image.startsWith('blob:');
};

const defaultFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: '',
  tag: '',
  isAvailable: true,
};

export function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
  isSaving = false,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(defaultFormData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializa o formulário com dados do produto (se editando)
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        categoryId: product.categoryId || '',
        image: product.image || '',
        tag: product.tag || '',
        isAvailable: product.isAvailable ?? true,
      });
    } else {
      setForm(defaultFormData);
    }
    setIsInitialized(true);
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) return;
    await onSubmit(form);
  };

  const isValid = form.name && form.price && form.categoryId;

  // Aguarda inicialização para evitar flash de formulário vazio
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Image Upload */}
      <div>
        <label className="text-sm text-muted-foreground mb-2 block">Foto do Produto</label>
        <ImageUpload 
          value={isRealImage(form.image) ? form.image : undefined}
          onChange={(url) => setForm(f => ({ ...f, image: url }))}
          onRemove={() => setForm(f => ({ ...f, image: '' }))}
          aspectRatio="square"
          bucket="products"
          path={`product-${product?.id || 'new'}`}
          placeholder="Adicione uma foto do produto"
        />
        {!isRealImage(form.image) && form.image && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Emoji atual: {form.image}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm text-muted-foreground mb-1 block">
          Nome do produto <span className="text-destructive">*</span>
        </label>
        <Input 
          placeholder="Ex: X-Burger Especial" 
          value={form.name} 
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className={cn(!form.name && "border-destructive/50")}
        />
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
        <Textarea 
          placeholder="Descrição completa do produto" 
          value={form.description} 
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
          rows={3} 
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Preço <span className="text-destructive">*</span>
          </label>
          <Input 
            type="number" 
            placeholder="0.00" 
            value={form.price} 
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            className={cn(!form.price && "border-destructive/50")}
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Categoria <span className="text-destructive">*</span>
          </label>
          <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
            <SelectTrigger className={cn(!form.categoryId && "border-destructive/50")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">Tag (opcional)</label>
        <Select value={form.tag} onValueChange={v => setForm(f => ({ ...f, tag: v }))}>
          <SelectTrigger><SelectValue placeholder="Selecione uma tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sem tag</SelectItem>
            <SelectItem value="NOVO">NOVO</SelectItem>
            <SelectItem value="POPULAR">POPULAR</SelectItem>
            <SelectItem value="PROMOÇÃO">PROMOÇÃO</SelectItem>
            <SelectItem value="MAIS VENDIDO">MAIS VENDIDO</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div>
          <label className="text-sm font-medium">Produto ativo</label>
          <p className="text-xs text-muted-foreground">
            {form.isAvailable ? 'Visível no cardápio' : 'Oculto do cardápio'}
          </p>
        </div>
        <Switch 
          checked={form.isAvailable} 
          onCheckedChange={(checked) => setForm(f => ({ ...f, isAvailable: checked }))} 
        />
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={!isValid || isSaving}
        >
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
  );
}
