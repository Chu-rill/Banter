"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie";

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
        return;
      }

      if (token) {
        try {
          await handleOAuthCallback(token);
          
          setStatus("success");
          setMessage("Authentication successful! Redirecting...");
        } catch (error) {
          console.error("Failed to process auth callback:", error);
          setStatus("error");
          setMessage("Failed to complete authentication. Please try again.");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      } else {
        setStatus("error");
        setMessage("No authentication token received. Please try again.");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, handleOAuthCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Completing Authentication
              </h2>
              <p className="text-muted-foreground">Please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Success!
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Authentication Failed
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}