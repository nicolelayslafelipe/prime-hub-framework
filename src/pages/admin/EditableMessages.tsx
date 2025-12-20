import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { mockMessageTemplates } from '@/data/mockData';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEditableMessages() {
  const [templates, setTemplates] = useState(mockMessageTemplates);

  const updateTemplate = (id: string, content: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, content } : t));
  };

  const handleSave = () => {
    toast.success('Mensagens salvas!');
  };

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
            <Textarea value={template.content} onChange={e => updateTemplate(template.id, e.target.value)} rows={3} />
            <div className="mt-2 flex flex-wrap gap-1">
              {template.variables.map(v => <span key={v} className="text-xs px-2 py-0.5 rounded bg-muted">{`{${v}}`}</span>)}
            </div>
          </div>
        ))}

        <Button onClick={handleSave} className="w-full">Salvar Mensagens</Button>
      </div>
    </AdminLayout>
  );
}
