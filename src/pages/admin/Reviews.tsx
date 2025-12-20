import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { mockReviews } from '@/data/mockData';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Star, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { Review } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminReviews() {
  const [reviews, setReviews] = useState(mockReviews);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [respondingTo, setRespondingTo] = useState<Review | null>(null);
  const [response, setResponse] = useState('');

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  const filteredReviews = showPublicOnly ? reviews.filter(r => r.isPublic) : reviews;

  const togglePublic = (id: string) => setReviews(prev => prev.map(r => r.id === id ? { ...r, isPublic: !r.isPublic } : r));

  const submitResponse = () => {
    if (respondingTo) {
      setReviews(prev => prev.map(r => r.id === respondingTo.id ? { ...r, response } : r));
      setRespondingTo(null);
      setResponse('');
    }
  };

  const openResponse = (review: Review) => {
    setRespondingTo(review);
    setResponse(review.response || '');
  };

  return (
    <AdminLayout title="Avaliações" subtitle="Gerencie as avaliações dos clientes">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Star className="h-6 w-6 text-yellow-500 fill-yellow-500" /><span className="text-2xl font-bold">{avgRating}</span><span className="text-muted-foreground">({reviews.length} avaliações)</span></div>
        </div>
        <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Apenas públicas</span><Switch checked={showPublicOnly} onCheckedChange={setShowPublicOnly} /></div>
      </div>

      <div className="space-y-4">
        {filteredReviews.map(review => (
          <div key={review.id} className="card-premium p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{review.clientName}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(review.createdAt), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />)}</div>
                <Button variant="ghost" size="icon" onClick={() => togglePublic(review.id)}>{review.isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</Button>
              </div>
            </div>
            {review.comment && <p className="text-sm mb-3">{review.comment}</p>}
            {review.response && <div className="p-3 rounded-lg bg-muted/30 text-sm"><span className="font-medium">Resposta:</span> {review.response}</div>}
            <div className="mt-3 pt-3 border-t border-border flex justify-end">
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => openResponse(review)}><MessageCircle className="h-4 w-4" />{review.response ? 'Editar Resposta' : 'Responder'}</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!respondingTo} onOpenChange={() => setRespondingTo(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Responder Avaliação</DialogTitle></DialogHeader>
          <div className="py-4"><p className="text-sm text-muted-foreground mb-2">"{respondingTo?.comment}"</p><Textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Digite sua resposta..." rows={4} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setRespondingTo(null)}>Cancelar</Button><Button onClick={submitResponse}>Enviar Resposta</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
