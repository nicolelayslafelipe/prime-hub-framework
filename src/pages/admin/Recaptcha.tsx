import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { ShieldAlert } from 'lucide-react';

export default function AdminRecaptcha() {
  const [isActive, setIsActive] = useState(false);
  const [siteKey, setSiteKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  return (
    <AdminLayout title="reCAPTCHA" subtitle="Configure a proteção contra bots">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10"><ShieldAlert className="h-6 w-6 text-primary" /></div>
            <div><h3 className="font-semibold">Google reCAPTCHA</h3><p className="text-sm text-muted-foreground">Proteção contra bots e spam</p></div>
          </div>
          <StatusToggle checked={isActive} onCheckedChange={setIsActive} label="Ativar reCAPTCHA" description="Adiciona verificação de segurança nos formulários" />
        </div>

        {isActive && (
          <div className="card-premium p-6 space-y-4">
            <h4 className="font-medium">Credenciais</h4>
            <div><label className="text-sm text-muted-foreground">Site Key (Pública)</label><Input value={siteKey} onChange={e => setSiteKey(e.target.value)} placeholder="6Lc..." /></div>
            <div><label className="text-sm text-muted-foreground">Secret Key (Privada)</label><Input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="6Lc..." /></div>
            <p className="text-sm text-muted-foreground">Obtenha suas chaves em <a href="https://www.google.com/recaptcha" target="_blank" className="text-primary hover:underline">google.com/recaptcha</a></p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
