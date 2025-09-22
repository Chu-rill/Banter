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
  Star,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
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
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold gradient-text">Banter</span>
                <span className="block text-xs text-muted-foreground -mt-1">
                  Connect & Chat
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors border border-border/30"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground" />
                )}
              </button>

              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className={`pt-32 pb-20 px-4 transition-all duration-1000 relative overflow-hidden ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-secondary/50 border border-border/30 rounded-full mb-8">
              <Star className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-foreground">
                Trusted by 1M+ users worldwide
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 text-foreground">
              Connect, Chat, and
              <span className="gradient-text block mt-2 relative">
                Call with Ease
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-muted-foreground leading-relaxed">
              Experience the future of communication with Banter. High-quality
              video calls, real-time messaging, and seamless collaboration all
              in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/register"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02]"
              >
                Start Chatting Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#features"
                className="px-8 py-4 bg-secondary/50 backdrop-blur-sm border border-border/30 text-foreground rounded-xl text-lg font-semibold hover:bg-secondary/70 transition-all duration-300 flex items-center justify-center"
              >
                Learn More
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Free forever
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                No credit card
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                2-min setup
              </div>
            </div>
          </div>

          {/* Hero Demo */}
          <div className="mt-20 relative">
            <div className="bg-secondary/30 backdrop-blur-sm border border-border/30 rounded-3xl p-8 max-w-5xl mx-auto shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Video Call Preview */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-8 min-h-[280px] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl"></div>
                    <div className="relative z-10">
                      <Video className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                      <div className="text-center mb-[30px]">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center shadow-lg">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          HD Video Call
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Crystal clear quality
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Call controls overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-4 h-4 bg-white rounded-sm"></div>
                    </div>
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="message-bubble-own max-w-xs">
                      Hey! Ready for our video call? 📞
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="message-bubble max-w-xs">
                      Absolutely! Banter makes it so easy 🚀
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="message-bubble max-w-xs">
                      The video quality is amazing! 😍
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground px-4">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                    <span>Sarah is typing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-secondary/20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-600/10 border border-purple-500/20 rounded-full mb-6">
              <Zap className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-600">
                Powerful Features
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Everything You Need to
              <span className="gradient-text block mt-2">Stay Connected</span>
            </h2>

            <p className="text-xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
              Banter combines the best of modern communication technology to
              give you an unparalleled messaging and calling experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-background/50 backdrop-blur-sm border border-border/30 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-3 hover:scale-[1.02]"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold mb-4 text-foreground group-hover:text-purple-600 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-background relative">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              {
                number: "1M+",
                label: "Active Users",
                icon: <Users className="w-6 h-6" />,
              },
              {
                number: "99.9%",
                label: "Uptime",
                icon: <Zap className="w-6 h-6" />,
              },
              {
                number: "<100ms",
                label: "Latency",
                icon: <MessageCircle className="w-6 h-6" />,
              },
              {
                number: "24/7",
                label: "Support",
                icon: <Shield className="w-6 h-6" />,
              },
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="w-16 h-16 bg-secondary/50 border border-border/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
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
