import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import "./globals.css";
import "./accessibility.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Banter - Modern Chat & Video Calling",
  description:
    "Connect with friends through high-quality video calls and real-time messaging. Built with modern web technologies for the best user experience.",
  keywords: "chat, video call, messaging, communication, real-time",
  authors: [{ name: "Banter Team" }],
  openGraph: {
    title: "Banter - Modern Chat & Video Calling",
    description:
      "Connect with friends through high-quality video calls and real-time messaging.",
    url: "https://banter.app",
    siteName: "Banter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Banter App",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Banter - Modern Chat & Video Calling",
    description:
      "Connect with friends through high-quality video calls and real-time messaging.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <AuthProvider>{children}</AuthProvider>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
