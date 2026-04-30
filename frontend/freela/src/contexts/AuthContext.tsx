"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureCsrfToken } from "@/lib/api";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
} from "@/lib/auth-service";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      try {
        return await getCurrentUser();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    void ensureCsrfToken();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.setQueryData(["auth", "user"], null);
      if (typeof window !== "undefined") {
         // Redirect to login only if not already on a public route
         const publicRoutes = ['/', '/login', '/register', '/signup'];
         if (!publicRoutes.includes(window.location.pathname)) {
            window.location.href = "/login?session_expired=true";
         }
      }
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, [queryClient]);

  const login = async (data: LoginPayload) => {
    await loginRequest(data);
    await refetch();
  };

  const register = async (data: RegisterPayload) => {
    await registerRequest(data);
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.removeQueries({ queryKey: ["auth", "user"] });
    }
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
