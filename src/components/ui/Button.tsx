import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "wallet";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-gradient-to-br from-purple-deep to-cyan text-white shadow-glow-primary hover:scale-105",
    secondary: "border border-cyan bg-transparent text-cyan hover:bg-cyan hover:text-ink",
    wallet: "border border-cyan bg-transparent text-cyan hover:bg-cyan hover:text-ink",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Working…" : children}
    </button>
  );
}
