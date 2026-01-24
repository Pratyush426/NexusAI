import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loginLocal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loginLocal = (userData?: any) => {
    const userObj = userData || { email: 'user@example.com', name: 'User' };
    localStorage.setItem('nexusai_user', JSON.stringify(userObj));
    setUser({ id: 'local-user', ...userObj } as any); // Cast to any for now, or define a proper LocalUser type
  };

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('nexusai_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ id: 'local-user', ...parsedUser } as any); // Cast to any
        setLoading(false);
        return; // If local user found, don't proceed with Supabase check immediately
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('nexusai_user');
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,

    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem('nexusai_auth');
    localStorage.removeItem('nexusai_user');
    localStorage.removeItem('nexusai_gmail_connected');
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, loginLocal }}>
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
