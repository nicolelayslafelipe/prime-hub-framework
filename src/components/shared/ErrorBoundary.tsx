import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Função para limpar cache do Service Worker
const clearCacheAndReload = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    // Aguardar um pouco para o cache ser limpo
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } else {
    window.location.reload();
  }
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Algo deu errado</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Recarregar página
            </Button>
            <Button variant="ghost" onClick={clearCacheAndReload} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar cache
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 p-4 bg-muted rounded-lg text-left max-w-lg w-full">
              <summary className="cursor-pointer text-sm font-medium">
                Detalhes do erro (dev only)
              </summary>
              <pre className="mt-2 text-xs overflow-auto text-destructive">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Fallback simples para modais
export function ModalErrorFallback({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-3 rounded-full bg-destructive/10 mb-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="font-semibold mb-2">Erro ao carregar</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Não foi possível carregar este conteúdo.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={clearCacheAndReload}>
          <Trash2 className="h-4 w-4 mr-1" />
          Limpar cache
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
