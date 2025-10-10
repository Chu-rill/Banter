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
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

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
  handleOAuthCallback: (
    token: string,
    refreshToken?: string
  ) => Promise<User | null>;
  handleEmailVerification: (
    token: string,
    refreshToken?: string
  ) => Promise<void>;
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

  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },

  setRefreshToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refreshToken", token);
    }
  },

  removeToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
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
    const refreshToken = TokenStorage.getRefreshToken();

    // If no tokens at all, user is not authenticated
    if (!token && !refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to get current user - if access token is expired, interceptor will refresh it
      const response = await authApi.getCurrentUser();
      const userData = response.data as User;
      setUser(userData);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      // If getCurrentUser fails after refresh attempt, clear tokens
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
        // Store tokens
        TokenStorage.setToken(response.token);
        if (response.refreshToken) {
          TokenStorage.setRefreshToken(response.refreshToken);
        }
        // Then set user
        console.log("Login response data:", response.data);
        setUser(response.data);
        // Navigate after state is set
        router.push("/chat");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("Login failed:", err);
      throw new Error(err.response?.data?.message || "Login failed");
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
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      console.error("Registration failed:", err);
      throw new Error(err.response?.data?.message || "Registration failed");
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

  const updateUser = async (userData: Partial<User>) => {
    const response = await authApi.updateUser(userData);
    const user = response.data as User;
    setUser(user);
    // if (user) {
    //   setUser({ ...user, ...userData });
    // }
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

  const handleOAuthCallback = async (token: string, refreshToken?: string) => {
    try {
      setIsLoading(true);
      // Store the tokens
      TokenStorage.setToken(token);
      if (refreshToken) TokenStorage.setRefreshToken(refreshToken);

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

  const handleEmailVerification = useCallback(
    async (token: string, refreshToken?: string) => {
      try {
        setIsLoading(true);
        // Store the tokens
        TokenStorage.setToken(token);
        if (refreshToken) {
          TokenStorage.setRefreshToken(refreshToken);
        }

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
    },
    []
  );

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
          <LoadingSpinner size="xl" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
