"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("Login failed. Please try again.");
        return;
      }

      // Fetch the user's role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Could not load your profile. Please contact support.");
        return;
      }

      toast.success("Logged in successfully!");
      router.push(`/dashboard/${profile.role as string}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Logo / Brand */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-medium tracking-wide text-slate-300 uppercase">
          <SparklesIcon className="size-3.5 text-amber-400" />
          AtomQuest Hackathon
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Sign in
        </h1>
        <p className="text-sm text-slate-400">
          Access your Goal Setting &amp; Tracking Portal
        </p>
      </div>

      {/* Demo credentials hint */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-4 text-sm text-slate-300">
        <p className="mb-2 font-semibold text-slate-200">Demo accounts:</p>
        <div className="space-y-1 font-mono text-xs text-slate-400">
          <p>employee@atomquest.com / Employee@123</p>
          <p>manager@atomquest.com / Manager@123</p>
          <p>admin@atomquest.com / Admin@123</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-300">
            Email address
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-sky-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-slate-700 bg-slate-900 pr-10 text-slate-100 placeholder:text-slate-500 focus:border-sky-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
