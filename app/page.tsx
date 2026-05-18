"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  Loader2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";

const ROLE_TRACKS = {
  employee: {
    journey: "Employee Journey",
    title: "Individual Contributor",
    description:
      "Draft weighted goals, set Thrust Areas and UoM, submit your goal sheet, and track quarterly progress.",
    href: "/dashboard/employee",
    icon: UserIcon,
    accent: "from-sky-500/20 to-cyan-500/5",
    ring: "ring-sky-500/25",
    buttonLabel: "Go to employee workspace",
  },
  manager: {
    journey: "Manager Journey",
    title: "L1 Team Supervisor",
    description:
      "Review team submissions, score metrics, approve goals, and conduct quarterly check-ins.",
    href: "/dashboard/manager",
    icon: BriefcaseIcon,
    accent: "from-violet-500/20 to-purple-500/5",
    ring: "ring-violet-500/25",
    buttonLabel: "Go to manager workspace",
  },
  admin: {
    journey: "HR Administration & Audits",
    title: "Corporate Compliance",
    description:
      "Executive dashboards, audit trails, force-unlock controls, and organization-wide goal exports.",
    href: "/dashboard/admin",
    icon: ShieldCheckIcon,
    accent: "from-emerald-500/20 to-teal-500/5",
    ring: "ring-emerald-500/25",
    buttonLabel: "Go to admin workspace",
  },
} as const;

export default function HomePage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();

  // Auto-redirect to the user's dashboard if already logged in
  useEffect(() => {
    if (!loading && currentUser) {
      router.replace(`/dashboard/${currentUser.role}`);
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2Icon className="size-5 animate-spin" />
        Loading…
      </div>
    );
  }

  // If not logged in, show the portal overview with login CTA
  if (!currentUser) {
    return (
      <main className="relative flex flex-1 flex-col bg-slate-950 text-slate-100">
        <PageBackdrop />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
          <section className="space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-medium tracking-wide text-slate-300 uppercase shadow-lg shadow-black/20 backdrop-blur-sm">
              <SparklesIcon className="size-3.5 text-amber-400" />
              Atomberg AtomQuest Hackathon
            </div>

            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              AtomQuest Goal Setting &amp; Tracking Portal
            </h1>

            <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
              A structured, digital portal for the full lifecycle of employee
              goals — creation, alignment, quarterly check-ins, and performance
              visibility.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-sky-600 text-white hover:bg-sky-500"
              >
                <Link href="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </section>

          <section
            aria-label="Role overviews"
            className="grid flex-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {(
              Object.values(ROLE_TRACKS) as (typeof ROLE_TRACKS)[keyof typeof ROLE_TRACKS][]
            ).map((track) => (
              <TrackCard key={track.href} track={track} />
            ))}
          </section>
        </div>
      </main>
    );
  }

  // Logged-in state renders a spinner while the redirect fires
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-24 text-slate-400">
      <Loader2Icon className="size-5 animate-spin" />
      Redirecting…
    </div>
  );
}

type Track = (typeof ROLE_TRACKS)[keyof typeof ROLE_TRACKS];

function TrackCard({ track }: { track: Track }) {
  const Icon = track.icon;

  return (
    <Card
      className={cn(
        "flex min-h-[22rem] flex-col border-slate-800/90 bg-slate-900/90 py-0 text-slate-100",
        "shadow-xl shadow-black/30 ring-1 ring-slate-700/60 transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/40",
        track.ring,
      )}
    >
      <CardHeader className="gap-4 border-b border-slate-800/80 px-6 pt-6 pb-5">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset ring-white/10",
            track.accent,
          )}
        >
          <Icon className="size-5 text-slate-100" aria-hidden />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-6 pt-5">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          {track.journey}
        </p>
        <CardTitle className="text-xl font-semibold text-white">
          {track.title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed text-slate-400">
          {track.description}
        </CardDescription>
      </CardContent>

      <CardFooter className="mt-auto border-t border-slate-800/80 bg-slate-950/40 px-6 py-5">
        <Button
          asChild
          size="lg"
          className="h-10 w-full gap-2 bg-slate-100 text-slate-900 shadow-md shadow-black/20 hover:bg-white hover:text-slate-900"
        >
          <Link href="/login">
            {track.buttonLabel}
            <ArrowRightIcon className="size-4" aria-hidden />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-slate-700/30 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-72 w-72 translate-x-1/4 translate-y-1/4 rounded-full bg-slate-600/20 blur-3xl" />
    </div>
  );
}
