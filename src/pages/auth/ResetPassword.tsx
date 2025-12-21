import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useConfig } from '@/contexts/ConfigContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/shared/Logo';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
  },
};

const errorVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 }
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const { config } = useConfig();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // User should have a session after clicking the reset link
      if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    };

    checkSession();

    // Listen for auth state changes (in case user clicks the link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (error) {
      toast.error('Erro ao redefinir senha. Tente novamente.');
      console.error('Reset password error:', error);
      return;
    }

    setIsSuccess(true);
    toast.success('Senha redefinida com sucesso!');

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate('/auth', { replace: true });
    }, 3000);
  };

  // Dynamic background
  const backgroundImage = config.establishment.useBannerAsLoginBg !== false
    ? (config.establishment.banner || config.establishment.logo)
    : null;

  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
        {backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 dark:from-black/80 dark:via-black/60 dark:to-black/90 backdrop-blur-[2px]" />

        <header className="relative z-10 border-b border-border/40 bg-background/30 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="hover:bg-background/50">
                <Link to="/auth">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <Logo size="sm" />
            </div>
            <ThemeSwitcher />
          </div>
        </header>

        <div className="relative z-10 flex-1 flex items-center justify-center p-4">
          <motion.div 
            className="w-full max-w-md"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <div className="bg-background/90 dark:bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-6 md:p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
              <p className="text-muted-foreground text-sm mb-6">
                Este link de recuperação de senha expirou ou é inválido. Por favor, solicite um novo link.
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Voltar ao Login</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {backgroundImage && (
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 dark:from-black/80 dark:via-black/60 dark:to-black/90 backdrop-blur-[2px]" />

      <motion.header 
        className="relative z-10 border-b border-border/40 bg-background/30 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="hover:bg-background/50">
              <Link to="/auth">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
          <ThemeSwitcher />
        </div>
      </motion.header>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-md"
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <div className="bg-background/90 dark:bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-6 md:p-8">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Logo size="lg" />
            </motion.div>

            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <h1 className="text-2xl font-bold mb-2">Nova Senha</h1>
                    <p className="text-muted-foreground text-sm">Digite sua nova senha abaixo</p>
                  </motion.div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p 
                            className="text-xs text-destructive"
                            variants={errorVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          disabled={isLoading}
                        />
                      </div>
                      <AnimatePresence>
                        {errors.confirmPassword && (
                          <motion.p 
                            className="text-xs text-destructive"
                            variants={errorVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                          >
                            {errors.confirmPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Button type="submit" className="w-full h-12" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redefinindo...
                          </>
                        ) : (
                          'Redefinir Senha'
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  className="text-center py-4"
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div 
                    className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">Senha Redefinida!</h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes...
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/auth">Ir para Login</Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
