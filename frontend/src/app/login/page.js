"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import api from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const token = response.data?.token;

      if (!token) {
        setError("Login succeeded but token was not returned.");
        return;
      }

      window.localStorage.setItem("token", token);

      if (response.data?.user) {
        window.localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      router.replace("/dashboard");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="cims-card w-full p-8 backdrop-blur">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">Secure Access</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold">Welcome Back</h1>
        <p className="text-text-secondary mt-2 text-sm">Sign in to continue managing investigation workflows.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-text-primary mb-2 block text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="officer@department.gov"
              className="cims-input w-full px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-text-primary mb-2 block text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="cims-input w-full px-4 py-3 text-sm"
            />
          </label>

          {error ? <p className="text-sm font-medium text-primary">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="cims-button-primary w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          First time here?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
