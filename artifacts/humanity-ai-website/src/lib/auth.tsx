import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type AuthUser = {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  bio?: string | null;
  title?: string | null;
  organization?: string | null;
  avatarUrl?: string | null;
  role: "author" | "admin" | string;
  createdAt: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { username: string; password: string }) => Promise<void>;
  register: (input: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    displayName: string;
    bio?: string;
    title?: string;
    organization?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: user, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: async (input: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", input);
      return (await res.json()) as AuthUser;
    },
    onSuccess: async (u) => {
      queryClient.setQueryData(["/api/auth/me"], u);
      await refetch();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: any) => {
      const res = await apiRequest("POST", "/api/auth/register", input);
      return (await res.json()) as AuthUser;
    },
    onSuccess: async (u) => {
      queryClient.setQueryData(["/api/auth/me"], u);
      await refetch();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/me/posts"] });
      toast({ title: "Signed out" });
    },
  });

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: async (input) => {
      await loginMutation.mutateAsync(input);
    },
    register: async (input) => {
      await registerMutation.mutateAsync(input);
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    refresh: async () => {
      await refetch();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
