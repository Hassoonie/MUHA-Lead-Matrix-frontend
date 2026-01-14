import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Layout from "@/components/layout/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dialed Moods - Lead Generation Platform",
  description: "AI-powered lead generation platform by Dialed Moods",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Layout>{children}</Layout>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
