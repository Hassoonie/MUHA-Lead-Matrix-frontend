"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import PasswordRequirements from "@/components/ui/PasswordRequirements";
import ErrorAlert from "@/components/ui/ErrorAlert";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Validate password requirements (matches backend validation)
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) {
      errors.push("special character");
    }
    
    return errors;
  };

  // Update password errors in real-time
  useEffect(() => {
    if (password) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password requirements
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      if (passwordValidationErrors.length === 1) {
        setError(`Password must contain at least one ${passwordValidationErrors[0]}.`);
      } else {
        const requirementsStr = passwordValidationErrors.slice(0, -1).join(", ") + `, and ${passwordValidationErrors[passwordValidationErrors.length - 1]}`;
        setError(`Password must include: ${requirementsStr}.`);
      }
      setPasswordFocused(true); // Show requirements when there are errors
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, name || undefined);
      router.push("/dashboard");
    } catch (err: any) {
      // Handle FastAPI validation errors (422) - they come as an array
      let errorMessage = "Signup failed";
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Check for password requirements error with missing_requirements array
        if (data.error && data.missing_requirements && Array.isArray(data.missing_requirements)) {
          // Use the error message from backend (already formatted)
          errorMessage = data.error;
          // Update password errors to show requirements
          setPasswordErrors(data.missing_requirements);
          setPasswordFocused(true); // Show requirements when there are errors
        }
        // FastAPI validation errors come as an array of objects
        else if (Array.isArray(data.detail)) {
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
            Create Account
          </h2>

          {error && <ErrorAlert message={error} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-1">
                Name (Optional)
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full"
              />
            </div>

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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(""); // Clear errors when user types
                }}
                onFocusChange={setPasswordFocused}
                required
                placeholder="Enter password"
                className="w-full"
              />
              {/* Show password requirements when focused or when there are validation errors */}
              {(passwordFocused || passwordErrors.length > 0) && (
                <PasswordRequirements password={password} />
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-black dark:text-[#c5b26f] mb-1">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-black/70 dark:text-[#c5b26f]/70">
              Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
