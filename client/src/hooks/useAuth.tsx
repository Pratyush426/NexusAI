import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiLogin, apiRegister, apiGetMe } from '@/lib/api';

const TOKEN_KEY = 'jobtrack_token';
const USER_KEY  = 'jobtrack_user';

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On app mount — restore session from localStorage and verify token
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser  = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        // Verify the token is still valid against the server
        apiGetMe().then((data: any) => {
          if (data?.user) {
            setUser(data.user);
          } else {
            // Token expired/invalid — clear session
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
          setLoading(false);
        }).catch(() => {
          // Can't reach server — trust localStorage data for now
          setLoading(false);
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: Error | null }> => {
    const data = await apiRegister(fullName || '', email, password);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { error: null };
    }
    return { error: new Error(data.message || 'Registration failed') };
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    const data = await apiLogin(email, password);
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { error: null };
    }
    return { error: new Error(data.message || 'Login failed') };
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
