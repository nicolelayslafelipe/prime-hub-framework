import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'client' | 'admin' | 'kitchen' | 'motoboy';

interface Profile {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_active?: boolean;
}

interface ProfileUpdate {
  name?: string;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<{ error: Error | null }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch role using the database function
    const { data: roleData } = await supabase
      .rpc('get_user_role', { _user_id: userId });

    if (roleData) {
      setRole(roleData as AppRole);
    } else {
      setRole('client');
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === 'SIGNED_OUT') {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: new Error(error.message) };
    }

    // Check if user is active
    if (data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData && profileData.is_active === false) {
        // Sign out the inactive user
        await supabase.auth.signOut();
        return { error: new Error('Sua conta está desativada. Entre em contato com o administrador.') };
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          phone,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const updateProfile = async (data: ProfileUpdate) => {
    if (!user) return { error: new Error('Usuário não autenticado') };
    
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);
    
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) return { error: new Error('Usuário não autenticado') };
    
    // First verify current password by trying to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    
    if (signInError) {
      return { error: new Error('Senha atual incorreta') };
    }
    
    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    return { error: error ? new Error(error.message) : null };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: new Error('Usuário não autenticado') };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;
    
    // Delete old avatar if exists
    await supabase.storage
      .from('avatars')
      .remove([fileName]);
    
    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
    
    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    return { url: publicUrl, error: null };
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserData(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        updatePassword,
        uploadAvatar,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
