
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "@/hooks/auth/useSignup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

interface SignupFormProps {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
}

const SignupForm = ({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
}: SignupFormProps) => {
  const navigate = useNavigate();
  const { signUp, isLoading, error } = useSignup();
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { fullName?: string; email?: string; password?: string } = {};

    if (!fullName) {
      errors.fullName = "Full name is required";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Pass the values as an object
        await signUp({
          fullName,
          email,
          password
        });
        navigate("/");
      } catch (err) {
        console.error("Signup error:", err);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          disabled={isLoading}
          data-testid="full-name-input"
        />
        {validationErrors.fullName && (
          <p className="text-sm text-destructive">{validationErrors.fullName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={isLoading}
          data-testid="email-input"
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          data-testid="password-input"
        />
        {validationErrors.password && (
          <p className="text-sm text-destructive">
            {validationErrors.password}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  );
};

export default SignupForm;
