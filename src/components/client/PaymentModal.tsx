import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { Loader2, CheckCircle2, XCircle, Copy, ExternalLink, QrCode, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
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
            <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-accent" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              Pagamento Aprovado!
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              Seu pedido foi confirmado e já está sendo preparado.
            </p>
            <Button onClick={onClose} className="w-full">
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
            <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">
              Pagamento Recusado
            </DialogTitle>
            <p className="text-muted-foreground text-center">
              Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.
            </p>
            <Button onClick={onClose} variant="outline" className="w-full">
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
          <DialogTitle className="text-center">
            {paymentType === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão'}
          </DialogTitle>
        </DialogHeader>

        {paymentType === 'pix' ? (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="flex justify-center">
              {qrCodeBase64 ? (
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="QR Code PIX" 
                  className="w-48 h-48 border rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 border rounded-lg bg-muted flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Expira em: <strong className="text-foreground">{formatCountdown()}</strong></span>
            </div>

            {/* Copy code button */}
            {qrCode && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  Ou copie o código PIX:
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs break-all max-h-20 overflow-y-auto">
                    {qrCode}
                  </code>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={handleCopyPixCode}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Waiting message */}
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Aguardando pagamento...</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Abra o app do seu banco, escaneie o QR Code ou cole o código PIX para pagar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Clique no botão abaixo para finalizar seu pagamento no checkout seguro do Mercado Pago.
            </p>

            <Button 
              onClick={handleOpenCheckout} 
              className="w-full gap-2"
              disabled={!checkoutUrl}
            >
              <ExternalLink className="h-4 w-4" />
              Ir para o Checkout
            </Button>

            {/* Waiting message */}
            <div className="flex items-center justify-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">Aguardando confirmação...</span>
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
