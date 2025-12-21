import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { Loader2, CheckCircle2, XCircle, Copy, ExternalLink, QrCode, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber?: number;
  amount?: number;
  paymentType: 'pix' | 'card';
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  checkoutUrl?: string | null;
  onPaymentApproved?: () => void;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  paymentType,
  qrCode,
  qrCodeBase64,
  checkoutUrl,
  onPaymentApproved,
  isLoading = false,
  hasError = false,
  errorMessage,
  onRetry,
}: PaymentModalProps) {
  const { paymentData, isApproved, isRejected } = usePaymentStatus(orderId);
  const [countdown, setCountdown] = useState(5 * 60);
  const [isExpired, setIsExpired] = useState(false);

  // Handle payment approval
  useEffect(() => {
    if (isApproved && onPaymentApproved) {
      onPaymentApproved();
    }
  }, [isApproved, onPaymentApproved]);

  // Handle PIX expiration
  useEffect(() => {
    if (countdown === 0 && paymentType === 'pix' && !isApproved && !isRejected && !isExpired && !isLoading) {
      setIsExpired(true);
      toast.error('PIX expirado', { 
        description: 'O tempo para pagamento acabou. Faça um novo pedido.' 
      });
    }
  }, [countdown, paymentType, isApproved, isRejected, isExpired, isLoading]);

  // Countdown timer for PIX - só inicia quando QR code estiver pronto
  useEffect(() => {
    if (!isOpen || paymentType !== 'pix' || isApproved || isRejected || isLoading || !qrCodeBase64) return;

    setCountdown(5 * 60);
    setIsExpired(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paymentType, isApproved, isRejected, isLoading, qrCodeBase64]);

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCopyPixCode = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode);
      toast.success('Código PIX copiado!');
    }
  };

  const handleOpenCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  // Estado de aprovado
  if (isApproved) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-accent" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Pagamento Aprovado!
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              Seu pedido #{orderNumber} foi confirmado e já está sendo preparado.
            </p>
            <Button onClick={onClose} className="w-full" size="lg">
              Acompanhar Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Estado de erro ou rejeitado
  if (isRejected || isExpired || hasError) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              {isExpired ? 'PIX Expirado' : hasError ? 'Erro no Pagamento' : 'Pagamento Recusado'}
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              {isExpired 
                ? 'O tempo para pagamento expirou. Por favor, faça um novo pedido.' 
                : hasError
                  ? errorMessage || 'Houve um problema ao gerar o pagamento. Tente novamente.'
                  : 'Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.'}
            </p>
            <div className="flex gap-2 w-full">
              {onRetry && hasError && (
                <Button onClick={onRetry} className="flex-1 gap-2" size="lg">
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className={cn("w-full", onRetry && hasError && "flex-1")} size="lg">
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {paymentType === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão'}
          </DialogTitle>
        </DialogHeader>

        {paymentType === 'pix' ? (
          <div className="space-y-5">
            {/* Order Info */}
            <div className="text-center space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Pedido #{orderNumber || '...'}
              </p>
              {isLoading ? (
                <Skeleton className="h-12 w-32 mx-auto" />
              ) : (
                <p className="text-4xl font-bold text-primary animate-pulse">
                  R$ {amount?.toFixed(2)}
                </p>
              )}
            </div>

            {/* QR Code ou Loading */}
            <div className="flex justify-center">
              {isLoading ? (
                <div className="space-y-4 flex flex-col items-center">
                  <Skeleton className="w-52 h-52 rounded-xl" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Gerando código PIX...</span>
                  </div>
                </div>
              ) : qrCodeBase64 ? (
                <div className="p-3 bg-white rounded-xl shadow-lg animate-in fade-in zoom-in duration-300">
                  <img 
                    src={`data:image/png;base64,${qrCodeBase64}`} 
                    alt="QR Code PIX" 
                    className="w-52 h-52"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 border-2 border-dashed rounded-xl bg-muted flex flex-col items-center justify-center gap-2">
                  <QrCode className="h-16 w-16 text-muted-foreground animate-pulse" />
                  <span className="text-sm text-muted-foreground">Gerando QR Code...</span>
                </div>
              )}
            </div>

            {/* Countdown - só mostra quando QR Code está pronto */}
            {!isLoading && qrCodeBase64 && (
              <div className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-lg transition-colors animate-in fade-in duration-300",
                countdown < 300 ? "bg-destructive/10 text-destructive" : "bg-muted"
              )}>
                <Clock className="h-5 w-5" />
                <span className="font-medium">
                  Expira em: <strong className="font-mono text-lg">{formatCountdown()}</strong>
                </span>
              </div>
            )}

            {/* Copy code button */}
            {!isLoading && qrCode && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <p className="text-xs text-muted-foreground text-center font-medium">
                  Ou copie o código PIX Copia e Cola:
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg text-xs break-all max-h-20 overflow-y-auto font-mono">
                    {qrCode}
                  </code>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={handleCopyPixCode}
                    className="shrink-0 h-auto"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Waiting message */}
            <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium text-primary">
                {isLoading ? 'Preparando pagamento...' : 'Aguardando pagamento...'}
              </span>
            </div>

            {!isLoading && (
              <div className="space-y-2 text-center animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">1.</span> Abra o app do seu banco
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">2.</span> Escaneie o QR Code ou cole o código PIX
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">3.</span> Confirme o pagamento
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Order Info */}
            <div className="text-center space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Pedido #{orderNumber || '...'}
              </p>
              {isLoading ? (
                <Skeleton className="h-12 w-32 mx-auto" />
              ) : (
                <p className="text-4xl font-bold text-primary">
                  R$ {amount?.toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-12 w-12 text-primary" />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                <p className="text-center text-muted-foreground">
                  Clique no botão abaixo para finalizar seu pagamento no checkout seguro do Mercado Pago.
                </p>

                <Button 
                  onClick={handleOpenCheckout} 
                  className="w-full gap-2"
                  size="lg"
                  disabled={!checkoutUrl}
                >
                  <ExternalLink className="h-5 w-5" />
                  Ir para o Checkout
                </Button>
              </>
            )}

            {/* Waiting message */}
            <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium text-primary">
                {isLoading ? 'Preparando checkout...' : 'Aguardando confirmação...'}
              </span>
            </div>

            {!isLoading && (
              <p className="text-xs text-muted-foreground text-center animate-in fade-in duration-300">
                Após o pagamento, esta tela será atualizada automaticamente.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
