import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Plus } from 'lucide-react';

export default function ClientAddresses() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 h-16">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Meus Endereços</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Nenhum endereço salvo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione um endereço para facilitar suas entregas
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Endereço
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
