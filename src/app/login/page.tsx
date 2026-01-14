"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      // Handle FastAPI validation errors (422) - they come as an array
      let errorMessage = "Login failed";
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // FastAPI validation errors come as an array of objects
        if (Array.isArray(data.detail)) {
          // Extract the first validation error message
          const firstError = data.detail[0];
          errorMessage = firstError?.msg || firstError?.message || "Please check your input and try again";
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
      {/* Dialed Moods Branding Header */}
      <div className="absolute top-6 left-6 flex items-center gap-4">
        <Image
          src="/logo/muha-meds-logo.png"
          alt="Muha Meds"
          width={60}
          height={60}
          className="object-contain"
        />
        <Image
          src="/logo/logo.webp"
          alt="Dialed Moods"
          width={100}
          height={100}
          className="object-contain"
        />
      </div>

      <Card className="max-w-md w-full bg-white dark:bg-[#0a0a0a] border-2 border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-black dark:text-[#c5b26f] mb-2 text-center">
            Dialed Moods
          </h1>
          <p className="text-sm text-black/70 dark:text-[#c5b26f]/70 mb-6 text-center">
            Lead Generation Platform
          </p>
          <h2 className="text-xl font-semibold text-black dark:text-[#c5b26f] mb-6 text-center">
            Login
          </h2>

          {error && <ErrorAlert message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-1">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-black/70 dark:text-[#c5b26f]/70">
              Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 dark:text-[#c5b26f] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
