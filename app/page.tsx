"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  InfoIcon,
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

const EVALUATION_TRACKS = [
  {
    journey: "Employee Journey",
    title: "Soham Kulkarni",
    description:
      "Draft weighted OKRs, submit your goal sheet, and track quarterly progress from an individual contributor lens.",
    href: "/dashboard/employee",
    icon: UserIcon,
    accent: "from-sky-500/20 to-cyan-500/5",
    ring: "ring-sky-500/25",
    buttonLabel: "Enter employee workspace",
  },
  {
    journey: "Manager Journey",
    title: "L1 Team Supervisor",
    description:
      "Review team submissions, score metrics, and unlock quarterly evaluations for direct reports.",
    href: "/dashboard/manager",
    icon: BriefcaseIcon,
    accent: "from-violet-500/20 to-purple-500/5",
    ring: "ring-violet-500/25",
    buttonLabel: "Enter manager workspace",
  },
  {
    journey: "HR Administration & Audits",
    title: "Corporate Compliance",
    description:
      "Executive dashboards, audit trails, force-unlock controls, and organization-wide goal exports.",
    href: "/dashboard/admin",
    icon: ShieldCheckIcon,
    accent: "from-emerald-500/20 to-teal-500/5",
    ring: "ring-emerald-500/25",
    buttonLabel: "Enter admin workspace",
  },
] as const;

export default function HomePage() {
  const { currentUser } = useUser();

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
            Welcome back,{" "}
            <span className="font-medium text-white">{currentUser.name}</span>.
            Choose an evaluation track below to explore the end-to-end goal
            lifecycle for employees, managers, and HR administrators.
          </p>

          <div
            className={cn(
              "mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-slate-700/70",
              "bg-slate-900/70 px-4 py-3 text-left shadow-xl shadow-black/25 backdrop-blur-sm sm:mx-0",
            )}
          >
            <InfoIcon
              className="mt-0.5 size-4 shrink-0 text-sky-400"
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-medium text-slate-100">For judges:</span>{" "}
              You can switch between Employee, Manager, and HR Admin profiles at
              any time using the global identity switcher in the navigation
              banner at the very top of your browser view — no need to return to
              this page.
            </p>
          </div>
        </section>

        <section
          aria-label="Evaluation tracks"
          className="grid flex-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {EVALUATION_TRACKS.map((track) => (
            <TrackCard key={track.href} track={track} />
          ))}
        </section>
      </div>
    </main>
  );
}

type Track = (typeof EVALUATION_TRACKS)[number];

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
          <Link href={track.href}>
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
