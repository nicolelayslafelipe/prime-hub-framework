import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Logo } from '@/components/shared/Logo';
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
  },
  exit: { 
    opacity: 0, 
    y: -10,
  }
};

const tabContentVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
  },
  exit: { 
    opacity: 0, 
    x: 10,
  }
};

const errorVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 }
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
  }
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();
  const { config } = useConfig();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'login');
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Forgot password
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Dynamic background image - Priority: Banner > Logo > null
  const backgroundImage = useMemo(() => {
    if (config.establishment.useBannerAsLoginBg !== false) {
      if (config.establishment.banner) {
        return config.establishment.banner;
      }
      if (config.establishment.logo) {
        return config.establishment.logo;
      }
    }
    return null;
  }, [config.establishment.banner, config.establishment.logo, config.establishment.useBannerAsLoginBg]);

  const redirectByRole = (userRole: string) => {
    const pendingCheckout = localStorage.getItem('pendingCheckout');

    if (userRole === 'client' && pendingCheckout) {
      localStorage.removeItem('pendingCheckout');
      navigate('/', { replace: true });
      return;
    }

    switch (userRole) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'kitchen':
        navigate('/kitchen', { replace: true });
        break;
      case 'motoboy':
        navigate('/motoboy', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    if (!authLoading && user && role) {
      redirectByRole(role);
    }
  }, [user, role, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});

    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setLoginErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success('Login realizado com sucesso!');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    const result = signupSchema.safeParse({
      name: signupName,
      email: signupEmail,
      phone: signupPhone,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setSignupErrors(errors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupPhone);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este email já está cadastrado');
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success('Conta criada com sucesso!');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailError('');

    const result = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!result.success) {
      setForgotEmailError(result.error.errors[0]?.message || 'Email inválido');
      return;
    }

    setIsResetting(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setIsResetting(false);

    if (error) {
      console.error('Password reset error:', error);
    }

    // Always show success message for security (don't reveal if email exists)
    setResetEmailSent(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotEmailError('');
    setResetEmailSent(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Dynamic Background Image */}
      {backgroundImage && (
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${backgroundImage})` }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      )}
      
      {/* Overlay with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 dark:from-black/80 dark:via-black/60 dark:to-black/90 backdrop-blur-[2px]" />

      {/* Header */}
      <motion.header 
        className="relative z-10 border-b border-border/40 bg-background/30 backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between px-4 md:px-6 h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="hover:bg-background/50">
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Logo size="sm" />
          </div>
          <ThemeSwitcher />
        </div>
      </motion.header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-md"
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          {/* Modern Card with Glass Effect */}
          <div className="bg-background/90 dark:bg-background/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-6 md:p-8">
            {/* Logo inside card */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Logo size="lg" />
            </motion.div>
            
            <motion.div 
              className="text-center mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold mb-2">Bem-vindo</h1>
              <p className="text-muted-foreground text-sm">Entre ou crie sua conta para continuar</p>
            </motion.div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" key="login" asChild>
                  <motion.div
                    variants={tabContentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {loginErrors.email && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {loginErrors.email}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {loginErrors.password && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {loginErrors.password}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Forgot password link */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      </div>

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <Button type="submit" className="w-full h-12" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Entrando...
                            </>
                          ) : (
                            'Entrar'
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" key="signup" asChild>
                  <motion.div
                    variants={tabContentVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nome</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Seu nome"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {signupErrors.name && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {signupErrors.name}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {signupErrors.email && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {signupErrors.email}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-phone">Telefone (opcional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-phone"
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {signupErrors.password && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {signupErrors.password}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm"
                            type="password"
                            placeholder="••••••••"
                            value={signupConfirmPassword}
                            onChange={(e) => setSignupConfirmPassword(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            disabled={isLoading}
                          />
                        </div>
                        <AnimatePresence>
                          {signupErrors.confirmPassword && (
                            <motion.p 
                              className="text-xs text-destructive"
                              variants={errorVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                            >
                              {signupErrors.confirmPassword}
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
                              Criando conta...
                            </>
                          ) : (
                            'Criar Conta'
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={closeForgotPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <DialogHeader>
              <DialogTitle>Recuperar Senha</DialogTitle>
              <DialogDescription>
                {resetEmailSent 
                  ? 'Verifique seu email para redefinir sua senha.'
                  : 'Digite seu email para receber um link de recuperação de senha.'
                }
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {!resetEmailSent ? (
                <motion.form 
                  onSubmit={handleForgotPassword} 
                  className="space-y-4 mt-4"
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="pl-10"
                        disabled={isResetting}
                        autoFocus
                      />
                    </div>
                    <AnimatePresence>
                      {forgotEmailError && (
                        <motion.p 
                          className="text-xs text-destructive"
                          variants={errorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          {forgotEmailError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={closeForgotPasswordModal}
                      className="flex-1"
                      disabled={isResetting}
                    >
                      Cancelar
                    </Button>
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" className="w-full" disabled={isResetting}>
                        {isResetting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          'Enviar Link'
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  className="space-y-4 mt-4 text-center"
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Mail className="w-8 h-8 text-primary" />
                  </motion.div>
                  <div>
                    <p className="font-medium">Email enviado!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Se o email estiver cadastrado, você receberá um link para redefinir sua senha.
                    </p>
                  </div>
                  <Button onClick={closeForgotPasswordModal} className="w-full">
                    Voltar ao Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
