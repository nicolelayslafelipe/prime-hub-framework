import { AdminLayout } from '@/components/admin/AdminLayout';
import { Textarea } from '@/components/ui/textarea';
import { QrCode, Loader2 } from 'lucide-react';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

export default function AdminPixMessages() {
  const { templates, isLoading, isSaving, updateTemplate, getTemplateByType } = useMessageTemplates();
  
  const pixTemplate = getTemplateByType('pix_payment');

  if (isLoading) {
    return (
      <AdminLayout title="Mensagens PIX" subtitle="Configure a mensagem após pagamento PIX">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const message = pixTemplate?.content || 'Pagamento PIX de R$ {valor} confirmado para o pedido #{numero}. Obrigado {nome}! ✅';
  const variables = pixTemplate?.variables || ['nome', 'numero', 'valor'];

  const handleUpdate = (content: string) => {
    if (pixTemplate) {
      updateTemplate(pixTemplate.id, content);
    }
  };

  return (
    <AdminLayout title="Mensagens PIX" subtitle="Configure a mensagem após pagamento PIX">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-accent/10">
              <QrCode className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Mensagem de Confirmação PIX</h3>
              <p className="text-sm text-muted-foreground">Enviada após o pagamento ser confirmado</p>
            </div>
          </div>
          <Textarea 
            value={message} 
            onChange={e => handleUpdate(e.target.value)} 
            rows={4} 
            placeholder="Digite a mensagem..."
            disabled={isSaving}
          />
          <div className="mt-4 p-3 rounded-lg bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-2">Variáveis disponíveis:</p>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <span key={v} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{`{${v}}`}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="card-premium p-6">
          <h4 className="font-medium mb-3">Preview</h4>
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-sm">
              {message
                .replace('{nome}', 'João')
                .replace('{numero}', '1234')
                .replace('{valor}', '45,90')
                .replace('{cliente}', 'João')
                .replace('{chave_pix}', 'email@exemplo.com')}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
