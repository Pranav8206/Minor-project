"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import api from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
        role: "user",
      });

      setMessage("Account created successfully. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
      }, 900);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <div className="cims-card w-full p-8 backdrop-blur">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-[0.2em]">New Account</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold">Create Account</h1>
        <p className="text-text-secondary mt-2 text-sm">Register to start managing investigation workflows.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-text-primary mb-2 block text-sm font-medium">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Officer name"
              className="cims-input w-full px-4 py-3 text-sm"
            />
          </label>

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
              placeholder="Create a password"
              className="cims-input w-full px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-text-primary mb-2 block text-sm font-medium">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              className="cims-input w-full px-4 py-3 text-sm"
            />
          </label>

          {error ? <p className="text-sm font-medium text-primary">{error}</p> : null}
          {message ? <p className="text-sm font-medium text-text-secondary">{message}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="cims-button-primary w-full px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-text-secondary mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}