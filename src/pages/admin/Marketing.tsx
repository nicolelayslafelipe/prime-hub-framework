import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { mockBanners } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Edit, Trash2, GripVertical, Megaphone } from 'lucide-react';
import { Banner } from '@/types';

export default function AdminMarketing() {
  const [banners, setBanners] = useState(mockBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '' });

  const toggleBanner = (id: string) => setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  const deleteBanner = (id: string) => setBanners(prev => prev.filter(b => b.id !== id));

  const handleSubmit = () => {
    if (editingBanner) {
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? { ...b, ...form } : b));
    } else {
      setBanners(prev => [...prev, { id: `bn_${Date.now()}`, ...form, isActive: true, order: prev.length + 1, createdAt: new Date() }]);
    }
    setIsModalOpen(false);
    setEditingBanner(null);
    setForm({ title: '', description: '', imageUrl: '' });
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({ title: banner.title, description: banner.description || '', imageUrl: banner.imageUrl });
    setIsModalOpen(true);
  };

  return (
    <AdminLayout title="Marketing" subtitle="Gerencie banners e promoções">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3"><Megaphone className="h-5 w-5 text-primary" /><span className="text-muted-foreground">{banners.filter(b => b.isActive).length} banners ativos</span></div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Banner</Button>
      </div>

      <div className="space-y-4">
        {banners.map(banner => (
          <div key={banner.id} className={`card-premium p-4 flex items-center gap-4 ${!banner.isActive && 'opacity-60'}`}>
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {banner.imageUrl ? <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" /> : <Megaphone className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{banner.title}</p>
              <p className="text-sm text-muted-foreground truncate">{banner.description}</p>
            </div>
            <Switch checked={banner.isActive} onCheckedChange={() => toggleBanner(banner.id)} />
            <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}><Edit className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteBanner(banner.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <ImageUpload value={form.imageUrl} onChange={url => setForm(f => ({ ...f, imageUrl: url }))} onRemove={() => setForm(f => ({ ...f, imageUrl: '' }))} aspectRatio="banner" />
            <Input placeholder="Título do banner" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="Descrição (opcional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSubmit}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
