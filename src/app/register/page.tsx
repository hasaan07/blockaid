"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (name.trim().length < 1) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!agree) return setError("Please accept the Terms & Privacy Policy.");

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-200px)] items-center justify-center px-5 py-12">
      <div className="glass w-full max-w-xl p-8">
        <h2 className="text-gradient mb-3 text-3xl font-bold">Create Account</h2>
        <p className="mb-7 text-sm text-muted">Fill in the details below to create an account.</p>

        <div className="grid gap-4">
          <Field
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Hasaan Azmat"
            autoComplete="name"
          />
          <Field
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hasaan.azmat@example.com"
            autoComplete="email"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
            <Field
              label="Confirm Password"
              name="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="h-4 w-4"
            />
            <span>I agree to the Terms &amp; Privacy Policy</span>
          </label>

          {error && (
            <div className="rounded-2xl bg-[rgba(248,113,113,0.12)] px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} loading={loading} className="mt-2">
            Create Account
          </Button>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
