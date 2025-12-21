import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';

interface RecaptchaConfig {
  isActive: boolean;
  siteKey: string;
  secretKey: string;
}

const defaultConfig: RecaptchaConfig = {
  isActive: false,
  siteKey: '',
  secretKey: ''
};

export default function AdminRecaptcha() {
  const { value: savedConfig, updateValue, isLoading, isSaving } = useAdminSettings<RecaptchaConfig>('recaptcha', defaultConfig);
  const [config, setConfig] = useState<RecaptchaConfig>(defaultConfig);

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const updateField = <K extends keyof RecaptchaConfig>(field: K, value: RecaptchaConfig[K]) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    updateValue(newConfig);
  };

  if (isLoading) {
    return (
      <AdminLayout title="reCAPTCHA" subtitle="Configure a proteção contra bots">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="reCAPTCHA" subtitle="Configure a proteção contra bots">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Google reCAPTCHA</h3>
              <p className="text-sm text-muted-foreground">Proteção contra bots e spam</p>
            </div>
          </div>
          <StatusToggle 
            checked={config.isActive} 
            onCheckedChange={v => updateField('isActive', v)} 
            label="Ativar reCAPTCHA" 
            description="Adiciona verificação de segurança nos formulários"
            disabled={isSaving}
          />
        </div>

        {config.isActive && (
          <div className="card-premium p-6 space-y-4">
            <h4 className="font-medium">Credenciais</h4>
            <div>
              <label className="text-sm text-muted-foreground">Site Key (Pública)</label>
              <Input 
                value={config.siteKey} 
                onChange={e => updateField('siteKey', e.target.value)} 
                placeholder="6Lc..."
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Secret Key (Privada)</label>
              <Input 
                type="password" 
                value={config.secretKey} 
                onChange={e => updateField('secretKey', e.target.value)} 
                placeholder="6Lc..."
                disabled={isSaving}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Obtenha suas chaves em{' '}
              <a href="https://www.google.com/recaptcha" target="_blank" className="text-primary hover:underline">
                google.com/recaptcha
              </a>
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
