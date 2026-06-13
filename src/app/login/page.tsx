"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email || !password) return setError("Enter your email and password.");

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-12">
      <div className="glass w-full max-w-xl p-8">
        <h2 className="text-gradient mb-3 text-3xl font-bold">Login</h2>
        <p className="mb-7 text-sm text-muted">Enter your email and password to continue.</p>

        <div className="grid gap-4">
          <Field
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hasaan.azmat@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && (
            <div className="rounded-2xl bg-[rgba(248,113,113,0.12)] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-3">
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              Login
            </Button>
          </div>

          <div className="my-2 flex items-center gap-3 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/10" />
            or
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-cyan hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
