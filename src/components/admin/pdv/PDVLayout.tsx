import { useState } from 'react';
import { PDVCategories } from './PDVCategories';
import { PDVProducts } from './PDVProducts';
import { PDVCart } from './PDVCart';
import { PDVCheckout } from './PDVCheckout';
import { CashRegisterOpen } from './CashRegisterOpen';
import { CashRegisterStatus } from './CashRegisterStatus';
import { useCashRegister } from '@/hooks/useCashRegister';
import { PDVProvider } from '@/contexts/PDVContext';
import { Skeleton } from '@/components/ui/skeleton';

export function PDVLayout() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const {
    currentRegister,
    isLoading,
    isOpen,
    openRegister,
    closeRegister,
    getCashSummary,
    addTransaction,
  } = useCashRegister();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex">
        <div className="w-48 border-r border-border p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
        <div className="w-80 border-l border-border p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <PDVProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Cash Register Status Bar */}
        {isOpen && currentRegister && (
          <CashRegisterStatus
            isOpen={isOpen}
            openingAmount={currentRegister.opening_amount}
            openedAt={currentRegister.opened_at}
            summary={getCashSummary()}
            onCloseRegister={closeRegister}
          />
        )}

        {/* Main PDV Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Column */}
          <div className="w-48 flex-shrink-0">
            <PDVCategories
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Products Column */}
          <div className="flex-1">
            <PDVProducts selectedCategory={selectedCategory} />
          </div>

          {/* Cart Column */}
          <div className="w-80 flex-shrink-0">
            <PDVCart 
              onCheckout={() => setShowCheckout(true)}
              disabled={!isOpen}
            />
          </div>
        </div>

        {/* Checkout Modal */}
        <PDVCheckout
          open={showCheckout}
          onClose={() => setShowCheckout(false)}
          currentRegister={currentRegister}
          addTransaction={addTransaction}
        />

        {/* Open Register Modal */}
        <CashRegisterOpen
          open={!isOpen}
          onOpenRegister={openRegister}
        />
      </div>
    </PDVProvider>
  );
}
