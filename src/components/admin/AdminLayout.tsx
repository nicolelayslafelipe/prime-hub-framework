import { ReactNode, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { NotificationDropdown } from './NotificationDropdown';
import { useSound } from '@/contexts/SoundContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
}

export function AdminLayout({ children, title, subtitle, headerRight }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();
  const { initializeAudio, isAudioInitialized } = useSound();

  // Initialize audio on first user interaction
  useEffect(() => {
    if (isAudioInitialized) return;

    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio, isAudioInitialized]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      <main
        className={cn(
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'ml-[72px]' : 'ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {headerRight}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="w-64 pl-9 bg-secondary border-border focus:border-primary/50"
                />
              </div>
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
