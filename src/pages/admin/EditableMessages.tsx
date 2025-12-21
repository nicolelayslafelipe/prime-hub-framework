import { AdminLayout } from '@/components/admin/AdminLayout';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useMessageTemplates } from '@/hooks/useMessageTemplates';

export default function AdminEditableMessages() {
  const { templates, isLoading, isSaving, updateTemplate } = useMessageTemplates();

  if (isLoading) {
    return (
      <AdminLayout title="Mensagens Editáveis" subtitle="Personalize as mensagens automáticas">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Mensagens Editáveis" subtitle="Personalize as mensagens automáticas">
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="text-muted-foreground">Configure as mensagens enviadas aos clientes</span>
        </div>

        {templates.map(template => (
          <div key={template.id} className="card-premium p-4">
            <h4 className="font-medium mb-2">{template.name}</h4>
            <Textarea 
              value={template.content} 
              onChange={e => updateTemplate(template.id, e.target.value)} 
              rows={3}
              disabled={isSaving}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {template.variables.map(v => (
                <span key={v} className="text-xs px-2 py-0.5 rounded bg-muted">{`{${v}}`}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
