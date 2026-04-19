"use client";

import { useEffect, useState } from "react";
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
      <div className="w-full rounded-3xl border border-white/60 bg-white/90 p-8 shadow-xl shadow-slate-900/10 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Secure Access</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to continue managing investigation workflows.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="officer@department.gov"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-900"
            />
          </label>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
