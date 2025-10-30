"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/ui/Loader";

function OAuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [userInfo, setUserInfo] = useState<{
    username?: string;
    email?: string;
  } | null>(null);
  const hasProcessed = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const processOAuth = async () => {
      // Prevent duplicate processing
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      // Get token from URL
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const status = searchParams.get("status");

      // Check for OAuth error from backend
      if (status === "error") {
        console.error("OAuth authentication failed");
        setStatus("error");
        setErrorMessage(
          "Authentication failed. Please try again or contact support if the issue persists."
        );
        return;
      }

      // Check if token exists
      if (!token) {
        setStatus("error");
        setErrorMessage("No authentication token received");
        return;
      }

      if (!refreshToken) {
        setStatus("error");
        setErrorMessage("No authentication refreshToken received");
        return;
      }

      try {
        setStatus("loading");

        // Process the OAuth callback
        const userData = await handleOAuthCallback(token, refreshToken);

        if (!userData) {
          throw new Error("No user data received");
        }

        setUserInfo(userData);
        setStatus("success");

        // Redirect after 500 milliseconds
        setTimeout(() => {
          router.push("/chat");
        }, 500);
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error("OAuth processing failed:", err);
        setStatus("error");
        setErrorMessage(
          error.message || "Authentication failed. Please try again."
        );
      }
    };

    processOAuth();
  }, [searchParams, handleOAuthCallback, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="flex justify-center mb-4">
              <Loader size={100} color="#9b6bff" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Completing sign in...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we authenticate your account
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to Banter!</h2>
            {userInfo && (
              <div className="mb-4 text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-white">
                  {userInfo.username || userInfo.email}
                </p>
              </div>
            )}
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting you to chat...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/login")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Back to Login
              </button>
              <button
                onClick={() => (window.location.href = "/api/v1/oauth/google")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Try Again with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader size={70} color="#9b6bff" />}>
      <OAuthCallbackPage />
    </Suspense>
  );
}
