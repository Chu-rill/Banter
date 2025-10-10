"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react";
import { authApi } from "@/lib/api";

function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Reset success message after 5 seconds
  useEffect(() => {
    if (resendSuccess) {
      const timer = setTimeout(() => {
        setResendSuccess(false);
        setTimeLeft(60);
        setCanResend(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [resendSuccess]);

  const handleResendEmail = async () => {
    if (!email || !canResend) return;

    try {
      setIsResending(true);
      setResendError("");

      await authApi.resendVerificationEmail(email);

      setResendSuccess(true);
      setResendError("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setResendError(
        err.response?.data?.message ||
          "Failed to resend email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Check your email
          </h1>

          {/* Description */}
          <div className="text-gray-600 dark:text-gray-300 mb-8 space-y-3">
            <p>We&apos;ve sent a verification link to:</p>
            {email && (
              <p className="font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                {email}
              </p>
            )}
            <p className="text-sm">
              Click the link in the email to verify your account and get started
              with Banter.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              What to do next:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 text-left">
              <li>• Check your inbox (and spam folder)</li>
              <li>• Click the verification link</li>
              <li>• You&apos;ll be automatically logged in</li>
            </ul>
          </div>

          {/* Resend Section */}
          <div className="space-y-4">
            {resendSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-700 dark:text-green-300">
                  Verification email sent successfully!
                </p>
              </div>
            )}

            {resendError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {resendError}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Didn&apos;t receive the email?
            </div>

            <button
              onClick={handleResendEmail}
              disabled={!canResend || isResending || !email}
              className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
              />
              <span>
                {isResending
                  ? "Sending..."
                  : canResend
                  ? "Resend verification email"
                  : `Resend in ${timeLeft}s`}
              </span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <Link
              href="/register"
              className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to registration</span>
            </Link>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Already verified?{" "}
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CheckEmailPage />
    </Suspense>
  );
}
