import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MessageTemplate {
  id: string;
  type: string;
  name: string;
  content: string;
  variables: string[];
}

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching message templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (id: string, content: string): Promise<boolean> => {
    const previousTemplates = [...templates];
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, content } : t));
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('message_templates')
        .update({ content })
        .eq('id', id);

      if (error) throw error;

      toast.success('Mensagem atualizada!');
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      setTemplates(previousTemplates);
      toast.error('Erro ao salvar mensagem');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [templates]);

  const getTemplateByType = useCallback((type: string): MessageTemplate | undefined => {
    return templates.find(t => t.type === type);
  }, [templates]);

  return {
    templates,
    isLoading,
    isSaving,
    updateTemplate,
    getTemplateByType,
    refetch: fetchTemplates
  };
}
