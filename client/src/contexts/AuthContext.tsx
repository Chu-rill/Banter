"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { socketService } from "@/lib/socket";
import { AuthResponse, User } from "@/types/index";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  handleOAuthCallback: (token: string) => Promise<User | null>;
  handleEmailVerification: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Centralized token storage utilities
const TokenStorage = {
  getToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("authToken", token);
    }
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
    }
  },
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = TokenStorage.getToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      const userData = response.data as User;
      setUser(userData);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      // Clear invalid token
      TokenStorage.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  // Connect sockets when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const wsToken = TokenStorage.getToken();
      if (!wsToken) return;
      // Connect to socket services
      socketService.connectRoomMessages(wsToken);
      socketService.connectDirectMessages(wsToken);
      socketService.connectCall(wsToken);
    } else {
      // Disconnect sockets when not authenticated
      socketService.disconnect();
    }
  }, [isAuthenticated, user]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(email, password);

      if (response.data && response.token) {
        // Store token first
        TokenStorage.setToken(response.token);
        // Then set user
        console.log("Login response data:", response.data);
        setUser(response.data);
        // Navigate after state is set
        router.push("/chat");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(username, email, password);

      // After successful registration, redirect to check-email page
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error("Registration failed:", error);
      throw new Error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and redirect
      TokenStorage.removeToken();
      setUser(null);
      socketService.disconnect();
      router.push("/");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const refreshUser = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await authApi.getCurrentUser();
      const userData = response.data as User;
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // If refresh fails, user might need to login again
      await logout();
    }
  };

  const handleOAuthCallback = async (token: string) => {
    try {
      setIsLoading(true);
      // Store the token
      TokenStorage.setToken(token);

      // Get user data
      const { data } = await authApi.getCurrentUser();
      const userData = data as User;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("OAuth callback failed:", error);
      // Clear invalid token
      TokenStorage.removeToken();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerification = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      // Store the token
      TokenStorage.setToken(token);

      // Get user data
      const { data } = await authApi.getCurrentUser();
      const userData = data as User;
      setUser(userData);

      // Don't navigate here - let the verify page handle it
      // router.push("/chat");
    } catch (error) {
      console.error("Email verification failed:", error);
      // Clear invalid token
      TokenStorage.removeToken();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    handleOAuthCallback,
    handleEmailVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/login");
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
