"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  last_login?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = authApi.getStoredUser();
    
    if (storedUser && authApi.isAuthenticated()) {
      // Set stored user first for immediate UI update
      setUser(storedUser);
      
      // Verify token is still valid and get fresh data (including is_admin)
      authApi.getCurrentUser()
        .then((currentUser) => {
          // Update user with fresh data from server
          setUser(currentUser);
          // Also update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(currentUser));
        })
        .catch((error) => {
          // Token invalid, clear storage
          authApi.logout();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await authApi.login(email, password);
    setUser(user);
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { user } = await authApi.signup(email, password, name);
    setUser(user);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
