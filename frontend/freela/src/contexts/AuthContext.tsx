"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LoginInput, RegisterInput } from "@/lib/validations/auth";
import type { UserRole } from "@/types/nav";

// We'll define a simple User type for frontend consumption
export interface User {
  id: string;
  email: string;
  role: UserRole;
  // Complete it later when expanding the Profiles
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load the currently authenticated user
  const fetchUser = async () => {
    try {
      // Create a /me/ endpoint or similar in the backend to return user data based on cookie token
      const response = await api.get("/auth/me/");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // Listen for unauthorized events to clear user
    const handleUnauthorized = () => setUser(null);
    window.addEventListener("unauthorized", handleUnauthorized);
    
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  const login = async (data: LoginInput) => {
    // Django will return the tokens via HttpOnly cookies
    await api.post("/auth/login/", data);
    await fetchUser();
  };

  const register = async (data: RegisterInput) => {
    await api.post("/auth/register/", data);
    // You might auto-login or ask the user to verify email/login depending on your flow
  };

  const logout = async () => {
    await api.post("/auth/logout/");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
