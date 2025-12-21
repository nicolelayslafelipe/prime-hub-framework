import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Edit, Trash2, GripVertical, Megaphone, Loader2 } from 'lucide-react';
import { useBanners, Banner } from '@/hooks/useBanners';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

export default function AdminMarketing() {
  const { banners, isLoading, error, refetch, createBanner, updateBanner, deleteBanner, toggleBanner } = useBanners();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', description: '', image_url: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, {
          title: form.title,
          description: form.description || null,
          image_url: form.image_url || null,
        });
      } else {
        await createBanner({
          title: form.title,
          description: form.description || null,
          image_url: form.image_url || null,
          is_active: true,
          sort_order: banners.length,
        });
      }
      closeModal();
    } catch (err) {
      // Error handled in hook
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este banner?')) {
      await deleteBanner(id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBanner(null);
    setForm({ title: '', description: '', image_url: '' });
  };

  const openNewBannerModal = () => {
    setEditingBanner(null);
    setForm({ title: '', description: '', image_url: '' });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Marketing" subtitle="Gerencie banners e promoções">
        <LoadingState message="Carregando banners..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Marketing" subtitle="Gerencie banners e promoções">
        <ErrorState message="Erro ao carregar banners" onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Marketing" subtitle="Gerencie banners e promoções">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground">
            {banners.filter(b => b.is_active).length} banners ativos
          </span>
        </div>
        <Button onClick={openNewBannerModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum banner cadastrado</p>
          <p className="text-sm">Clique em "Novo Banner" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map(banner => (
            <div
              key={banner.id}
              className={`card-premium p-4 flex items-center gap-4 ${!banner.is_active && 'opacity-60'}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
              <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Megaphone className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{banner.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {banner.description || 'Sem descrição'}
                </p>
              </div>
              <Switch
                checked={banner.is_active}
                onCheckedChange={() => toggleBanner(banner.id)}
              />
              <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDelete(banner.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ImageUpload
              value={form.image_url}
              onChange={url => setForm(f => ({ ...f, image_url: url }))}
              onRemove={() => setForm(f => ({ ...f, image_url: '' }))}
              aspectRatio="banner"
              bucket="branding"
              path="banners"
            />
            <Input
              placeholder="Título do banner"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.title.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
