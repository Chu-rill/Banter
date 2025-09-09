"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  MessageCircle,
  Video,
  Users,
  Shield,
  Zap,
  Moon,
  Sun,
  Star,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsVisible(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Real-time Messaging",
      description:
        "Instant messaging with typing indicators, read receipts, and emoji support.",
    },
    {
      icon: <Video className="w-6 h-6" />,
      title: "HD Video Calls",
      description:
        "Crystal clear video calls with screen sharing and recording capabilities.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Group Chats",
      description:
        "Create and manage group conversations with up to 100 participants.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "End-to-End Security",
      description:
        "Your conversations are protected with military-grade encryption.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description:
        "Optimized for speed with real-time synchronization across devices.",
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Premium Experience",
      description:
        "Ad-free experience with priority support and advanced features.",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 glass border-b"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Banter</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                }}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Sign In
              </Link>

              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`pt-32 pb-20 px-4 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Connect, Chat, and
              <span className="gradient-text block mt-2">Call with Ease</span>
            </h1>

            <p
              className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Experience the future of communication with Banter. High-quality
              video calls, real-time messaging, and seamless collaboration all
              in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center"
              >
                Start Chatting
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#features"
                className="px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
                style={{
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  backgroundColor: "transparent",
                }}
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-20 relative">
            <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 flex items-center justify-center min-h-[200px]">
                  <Video className="w-16 h-16 text-purple-600" />
                </div>
                <div className="space-y-4">
                  <div className="message-bubble-own ml-auto">
                    Hey! Ready for our video call?
                  </div>
                  <div className="message-bubble">
                    Absolutely! Banter makes it so easy 🚀
                  </div>
                  <div
                    className="flex items-center space-x-2 text-sm"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                    <span>typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4"
        style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
              style={{ color: "hsl(var(--foreground))" }}
            >
              Everything You Need to
              <span className="gradient-text block mt-2">Stay Connected</span>
            </h2>

            <p
              className="text-xl max-w-3xl mx-auto"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Banter combines the best of modern communication technology to
              give you an unparalleled messaging and calling experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white mb-6">
                  {feature.icon}
                </div>

                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {feature.title}
                </h3>

                <p style={{ color: "hsl(var(--muted-foreground))" }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        className="py-20 px-4"
        style={{ backgroundColor: "hsl(var(--background))" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "1M+", label: "Active Users" },
              { number: "99.9%", label: "Uptime" },
              { number: "<100ms", label: "Latency" },
              { number: "24/7", label: "Support" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl font-bold gradient-text mb-2">
                  {stat.number}
                </div>
                <div style={{ color: "hsl(var(--muted-foreground))" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 px-4"
        style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
            style={{ color: "hsl(var(--foreground))" }}
          >
            Ready to Start
            <span className="gradient-text block mt-2">
              Your Banter Journey?
            </span>
          </h2>

          <p
            className="text-xl mb-12"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Join millions of users who trust Banter for their daily
            communication needs. Sign up today and experience the difference.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/login"
              className="px-8 py-4 rounded-xl text-lg font-semibold transition-colors"
              style={{
                border: "1px solid hsl(var(--border))",
                color: "hsl(var(--foreground))",
                backgroundColor: "transparent",
              }}
            >
              Sign In
            </Link>
          </div>

          <div
            className="flex items-center justify-center mt-8 space-x-6 text-sm"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              Free forever plan
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              Setup in 2 minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 px-4"
        style={{ borderTop: "1px solid hsl(var(--border))" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Banter</span>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <Link
                href="/privacy"
                className="transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Support
              </Link>
              <Link
                href="/docs"
                className="transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Docs
              </Link>
            </div>
          </div>

          <div
            className="mt-8 pt-8 text-center text-sm"
            style={{
              borderTop: "1px solid hsl(var(--border))",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            © 2024 Banter. All rights reserved. Built with ❤️ for better
            communication.
          </div>
        </div>
      </footer>
    </div>
  );
}
