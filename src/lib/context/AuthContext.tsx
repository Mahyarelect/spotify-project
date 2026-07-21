import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AUTH_EXPIRED_EVENT } from "@/lib/api/httpClient";
import { clearTokens, hasSessionTokens } from "@/lib/api/tokenStore";
import type { Gender, Role, User } from "@/types/user";
import * as authService from "@/lib/services/authService";
import * as userService from "@/lib/services/userService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: Role }>;
  registerListener: (data: authService.ListenerRegistrationInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      if (!hasSessionTokens()) {
        setUser(null);
        return;
      }
      setUser(await userService.getCurrentUser());
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expire);
  }, []);

  const login = async (email: string, password: string) => {
    const { user: nextUser, role } = await authService.login(email, password);
    setUser(nextUser);
    return { role };
  };

  const registerListener = async (data: {
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
    birthDate: string;
    gender: Gender;
    acceptPolicy: boolean;
  }) => {
    setUser(await authService.registerListener(data));
  };

  const logout = () => {
    setUser(null);
    void authService.logout();
  };

  const refreshUser = async () => {
    setUser(await userService.getCurrentUser());
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, registerListener, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
