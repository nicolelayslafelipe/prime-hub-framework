import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { Loader2, CheckCircle2, XCircle, Copy, ExternalLink, QrCode, Clock, CreditCard } from 'lucide-react';
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
}: PaymentModalProps) {
  const { paymentData, isApproved, isRejected } = usePaymentStatus(orderId);
  const [countdown, setCountdown] = useState(30 * 60); // 30 minutes in seconds

  // Handle payment approval
  useEffect(() => {
    if (isApproved && onPaymentApproved) {
      onPaymentApproved();
    }
  }, [isApproved, onPaymentApproved]);

  // Countdown timer for PIX
  useEffect(() => {
    if (!isOpen || paymentType !== 'pix' || isApproved || isRejected) return;

    // Reset countdown when modal opens
    setCountdown(30 * 60);

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
  }, [isOpen, paymentType, isApproved, isRejected]);

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

  if (isRejected) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center">
              Pagamento Recusado
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full" size="lg">
              Tentar Novamente
            </Button>
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
                Pedido #{orderNumber}
              </p>
              <p className="text-4xl font-bold text-primary animate-pulse">
                R$ {amount?.toFixed(2)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeBase64 ? (
                <div className="p-3 bg-white rounded-xl shadow-lg">
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

            {/* Countdown */}
            <div className={cn(
              "flex items-center justify-center gap-2 p-3 rounded-lg transition-colors",
              countdown < 300 ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}>
              <Clock className="h-5 w-5" />
              <span className="font-medium">
                Expira em: <strong className="font-mono text-lg">{formatCountdown()}</strong>
              </span>
            </div>

            {/* Copy code button */}
            {qrCode && (
              <div className="space-y-2">
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
              <span className="font-medium text-primary">Aguardando pagamento...</span>
            </div>

            <div className="space-y-2 text-center">
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
          </div>
        ) : (
          <div className="space-y-5">
            {/* Order Info */}
            <div className="text-center space-y-1 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-sm text-muted-foreground">
                Pedido #{orderNumber}
              </p>
              <p className="text-4xl font-bold text-primary">
                R$ {amount?.toFixed(2)}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-12 w-12 text-primary" />
              </div>
            </div>

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

            {/* Waiting message */}
            <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium text-primary">Aguardando confirmação...</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Após o pagamento, esta tela será atualizada automaticamente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
