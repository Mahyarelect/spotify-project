import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/types/user";
import * as authService from "@/lib/services/authService";
import * as userService from "@/lib/services/userService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  registerListener: (data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: "male" | "female" | "other" | "unspecified";
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const u = await userService.getCurrentUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { user: u, role } = await authService.login(email, password);
    setUser(u);
    return { role };
  };

  const registerListener = async (data: {
    displayName: string;
    email: string;
    password: string;
    birthDate: string;
    gender: "male" | "female" | "other" | "unspecified";
  }) => {
    const u = await authService.registerListener(data);
    setUser(u);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await userService.getCurrentUser();
    setUser(u);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, registerListener, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
