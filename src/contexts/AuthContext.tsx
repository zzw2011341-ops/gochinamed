"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "patient" | "admin" | "staff";
  preferredLanguage: string;
  avatarUrl?: string;
  phone?: string;
  points?: number;
  originCity?: string | null;
  destinationCity?: string | null;
  budget?: number | null;
  passportNumber?: string | null;
  passportCountry?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  preferredLanguage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Clear user state if not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout' && e.newValue === 'true') {
        // Clear user state when logout is triggered in another tab
        setUser(null);
        setLoading(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Login failed");
    }

    const data = await response.json();
    setUser(data.user);
    // Refresh user to ensure state is synced
    await refreshUser();
  };

  const register = async (data: RegisterData) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Registration failed");
    }

    const result = await response.json();
    setUser(result.user);
    // Refresh user to ensure state is synced
    await refreshUser();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Notify other tabs about logout
    localStorage.setItem('auth_logout', 'true');
    // Clear the flag after a short delay
    setTimeout(() => localStorage.removeItem('auth_logout'), 100);
    setUser(null);
    // Refresh user to ensure all components get the updated state
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
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
