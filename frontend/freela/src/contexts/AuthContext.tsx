"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: user = null, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        const response = await api.get("/auth/me/");
        return response.data;
      } catch (error) {
        return null; // Ensure we return null if failed
      }
    },
    // Prevent frequent unneeded retries for unauthorized state
    retry: false, 
  });

  useEffect(() => {
    // Listen for unauthorized events to clear user cache
    const handleUnauthorized = () => {
      queryClient.setQueryData(["auth", "user"], null);
    };
    window.addEventListener("unauthorized", handleUnauthorized);
    
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [queryClient]);

  const login = async (data: LoginInput) => {
    // Django will return the tokens via HttpOnly cookies
    await api.post("/auth/login/", data);
    // Refresh user data from server to populate context
    await refetch();
  };

  const register = async (data: RegisterInput) => {
    await api.post("/auth/register/", data);
    // You might auto-login or ask the user to verify email/login depending on your flow
  };

  const logout = async () => {
    await api.post("/auth/logout/");
    // Clear user locally without needing an extra fetch
    queryClient.setQueryData(["auth", "user"], null);
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
