import { useNavigate } from 'react-router-dom';
import { ProfileEditor } from '@/components/shared/ProfileEditor';
import { Button } from '@/components/ui/button';

import { ArrowLeft } from 'lucide-react';

export default function ClientProfile() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 gradient-radial-subtle" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold">Meu Perfil</h1>
            </div>
            
          </div>
        </header>

        {/* Content */}
        <main className="px-4 md:px-6 py-8 max-w-2xl mx-auto">
          <ProfileEditor variant="client" showPhone={true} />
        </main>
      </div>
    </div>
  );
}
