import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatusToggle } from '@/components/admin/StatusToggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function AdminMercadoPago() {
  const [isActive, setIsActive] = useState(false);
  const [environment, setEnvironment] = useState<'test' | 'production'>('test');
  const [publicKey, setPublicKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  const testConnection = () => {
    if (publicKey && accessToken) {
      setStatus('connected');
    } else {
      setStatus('error');
    }
  };

  return (
    <AdminLayout title="Mercado Pago" subtitle="Configure a integração com Mercado Pago">
      <div className="max-w-2xl space-y-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-[#009ee3]/10">
              <Wallet className="h-6 w-6 text-[#009ee3]" />
            </div>
            <div>
              <h3 className="font-semibold">Mercado Pago</h3>
              <p className="text-sm text-muted-foreground">Receba pagamentos via PIX, cartão e boleto</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {status === 'connected' && <><CheckCircle className="h-5 w-5 text-accent" /><span className="text-sm text-accent">Conectado</span></>}
              {status === 'error' && <><XCircle className="h-5 w-5 text-destructive" /><span className="text-sm text-destructive">Erro</span></>}
              {status === 'disconnected' && <span className="text-sm text-muted-foreground">Desconectado</span>}
            </div>
          </div>

          <StatusToggle checked={isActive} onCheckedChange={setIsActive} label="Ativar Mercado Pago" description="Habilite para aceitar pagamentos via Mercado Pago" />
        </div>

        {isActive && (
          <>
            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Ambiente</h4>
              <div className="flex gap-4">
                <Button variant={environment === 'test' ? 'default' : 'outline'} onClick={() => setEnvironment('test')} className="flex-1">🧪 Teste (Sandbox)</Button>
                <Button variant={environment === 'production' ? 'default' : 'outline'} onClick={() => setEnvironment('production')} className="flex-1">🚀 Produção</Button>
              </div>
              {environment === 'test' && <p className="text-sm text-yellow-500">⚠️ Modo teste: pagamentos não serão processados de verdade</p>}
            </div>

            <div className="card-premium p-6 space-y-4">
              <h4 className="font-medium">Credenciais</h4>
              <div className="space-y-4">
                <div><label className="text-sm text-muted-foreground">Public Key</label><Input placeholder="APP_USR-..." value={publicKey} onChange={e => setPublicKey(e.target.value)} /></div>
                <div><label className="text-sm text-muted-foreground">Access Token</label><Input type="password" placeholder="APP_USR-..." value={accessToken} onChange={e => setAccessToken(e.target.value)} /></div>
              </div>
              <Button onClick={testConnection} variant="outline" className="w-full gap-2"><RefreshCw className="h-4 w-4" />Testar Conexão</Button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
