"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type VerificationState = "loading" | "success" | "error" | "invalid";

export default function VerifyEmailPage() {
  const [verificationState, setVerificationState] =
    useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasVerified = useRef(false); // Track if we've already attempted verification

  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleEmailVerification } = useAuth();
  const token = searchParams.get("token");
  const refreshToken = searchParams.get("refreshToken");

  useEffect(() => {
    // Only run once and if we haven't already verified
    if (hasVerified.current) return;

    if (!token) {
      setVerificationState("invalid");
      setErrorMessage(
        "Invalid verification link. Please check your email and try again."
      );
      return;
    }

    // Mark as verified to prevent re-runs
    hasVerified.current = true;
    verifyEmail(token, refreshToken);
  }, [token, refreshToken]); // Remove handleEmailVerification from dependencies

  const verifyEmail = async (token: string, refreshToken: string | null) => {
    try {
      setVerificationState("loading");

      // If verification includes tokens (auto-login), handle it
      await handleEmailVerification(token, refreshToken || undefined);

      setVerificationState("success");

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        setIsRedirecting(true);
        router.push("/chat");
      }, 3000);
    } catch (error: any) {
      console.error("Email verification failed:", error);
      setVerificationState("error");

      if (error.response?.status === 400) {
        setErrorMessage("This verification link has expired or is invalid.");
      } else if (error.response?.status === 404) {
        setErrorMessage(
          "Verification token not found. Please check your email link."
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            "Verification failed. Please try again."
        );
      }
    }
  };

  const handleManualRedirect = () => {
    setIsRedirecting(true);
    router.push("/chat");
  };

  const renderContent = () => {
    switch (verificationState) {
      case "loading":
        return (
          <>
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verifying your email...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your email address.
            </p>
          </>
        );

      case "success":
        return (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Email verified successfully!
            </h1>
            <div className="text-gray-600 dark:text-gray-300 mb-8 space-y-3">
              <p>
                Welcome to Banter! Your account has been verified and you're now
                logged in.
              </p>
              <p className="text-sm">
                {isRedirecting
                  ? "Redirecting you to the chat..."
                  : "You'll be redirected to the chat in a few seconds."}
              </p>
            </div>

            {!isRedirecting && (
              <button
                onClick={handleManualRedirect}
                disabled={isRedirecting}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue to Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </>
        );

      case "error":
        return (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Verification failed
            </h1>
            <div className="text-gray-600 dark:text-gray-300 mb-8">
              <p className="mb-4">{errorMessage}</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  What you can do:
                </h3>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• Request a new verification email</li>
                  <li>• Check that you clicked the latest email link</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          </>
        );

      case "invalid":
        return (
          <>
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid verification link
            </h1>
            <div className="text-gray-600 dark:text-gray-300 mb-8">
              <p className="mb-4">{errorMessage}</p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {renderContent()}

          {/* Footer Actions - Show only for error/invalid states */}
          {(verificationState === "error" ||
            verificationState === "invalid") && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <div className="space-y-2">
                <Link
                  href="/register"
                  className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Request new verification email
                </Link>

                <Link
                  href="/login"
                  className="inline-block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to login
                </Link>
              </div>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Need help?{" "}
                <Link
                  href="/support"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Contact support
                </Link>
              </div>
            </div>
          )}

          {/* Loading state footer */}
          {verificationState === "loading" && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                This may take a few moments...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
