"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, Loader2Icon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase";

type UserRole = "employee" | "manager" | "admin";

interface Profile {
  id: string;
  name: string;
  email: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("employee");
  const [managerId, setManagerId] = useState("");
  const [managers, setManagers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available managers for the employee role selection
  useEffect(() => {
    if (role !== "employee") return;
    supabase
      .from("profiles")
      .select("id, name, email")
      .eq("role", "manager")
      .then(({ data }) => {
        if (data) setManagers(data as Profile[]);
      });
  }, [role]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (role === "employee" && !managerId) {
      toast.error("Please select your reporting manager.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            role,
            manager_id: role === "employee" ? managerId : null,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("Signup failed. Please try again.");
        return;
      }

      // If email confirmation is disabled in Supabase, we can redirect directly
      if (data.session) {
        toast.success("Account created! Redirecting…");
        router.push(`/dashboard/${role}`);
        router.refresh();
      } else {
        toast.success(
          "Account created! Check your email to confirm, then sign in.",
        );
        router.push("/login");
      }
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
          Create account
        </h1>
        <p className="text-sm text-slate-400">
          Join the Goal Setting &amp; Tracking Portal
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signup-name" className="text-sm font-medium text-slate-300">
            Full name
          </label>
          <Input
            id="signup-name"
            type="text"
            placeholder="Soham Kulkarni"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-sky-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-slate-300">
            Email address
          </label>
          <Input
            id="signup-email"
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
          <label htmlFor="signup-password" className="text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
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

        <div className="space-y-2">
          <label htmlFor="signup-role" className="text-sm font-medium text-slate-300">
            Role
          </label>
          <select
            id="signup-role"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole);
              setManagerId("");
            }}
            className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">HR Admin</option>
          </select>
        </div>

        {role === "employee" && (
          <div className="space-y-2">
            <label htmlFor="signup-manager" className="text-sm font-medium text-slate-300">
              Reporting manager
            </label>
            <select
              id="signup-manager"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Select manager…</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
            {managers.length === 0 && (
              <p className="text-xs text-slate-500">
                No managers found. A manager account must be created first.
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-sky-400 hover:text-sky-300 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
