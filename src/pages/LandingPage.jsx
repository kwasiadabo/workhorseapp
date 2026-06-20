import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Landmark,
  Menu,
  Percent,
  Scissors,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import ThemeToggle from "@/components/shared/ThemeToggle";

const CATEGORIES = [
  "Barbershops",
  "Hair salons",
  "Spas & wellness",
  "Car washes",
  "Nail studios",
  "Cleaning services",
  "Massage centers",
  "Tattoo parlors",
  "Pet grooming",
  "Fitness studios",
  "Medical clinics",
  "Photography studios",
];

const FEATURES = [
  {
    icon: Building2,
    title: "Multi-branch management",
    description:
      "Run every location from one dashboard, with branch-level staff, services and bookings.",
  },
  {
    icon: Users,
    title: "Staff & roles",
    description:
      "Add service providers, assign positions, and control access with five built-in roles.",
  },
  {
    icon: UserRound,
    title: "Client records",
    description:
      "Keep a history of every client — contact details, visit history and preferences, all in one place.",
  },
  {
    icon: Scissors,
    title: "Service catalog",
    description:
      "Organize services into categories with pricing and duration, ready to add to any booking.",
  },
  {
    icon: CalendarCheck,
    title: "Booking workflow",
    description:
      "Bookings move automatically from confirmed to in progress, awaiting payment, and completed.",
  },
  {
    icon: Wallet,
    title: "Payments",
    description:
      "Record payments against bookings and track outstanding balances as work gets done.",
  },
];

const REPORTS = [
  {
    icon: TrendingUp,
    title: "Revenue & profit tracking",
    description:
      "See revenue trends, net income and where your money is really coming from — by branch or payment method.",
  },
  {
    icon: Percent,
    title: "Staff commission breakdown",
    description:
      "Know exactly what each staff member earned against the revenue they brought in.",
  },
  {
    icon: Building2,
    title: "Branch performance comparison",
    description:
      "Compare every location side by side and spot which branches are pulling their weight.",
  },
  {
    icon: Banknote,
    title: "Expense visibility",
    description:
      "Track spending by category and branch so costs never creep up unnoticed.",
  },
  {
    icon: Landmark,
    title: "Bank reconciliation",
    description:
      "Match deposits and withdrawals against your accounts and export clean records anytime.",
  },
  {
    icon: Users,
    title: "Customer & booking insights",
    description:
      "Spot your top spenders, busiest hours and most-booked services at a glance.",
  },
];

const STEPS = [
  {
    title: "Set up your business",
    description:
      "Register your business, add your branches, and invite your team in minutes.",
  },
  {
    title: "Add staff & services",
    description:
      "Assign roles to your team and build out your service catalog with pricing and duration.",
  },
  {
    title: "Start taking bookings",
    description:
      "Create bookings, assign staff, and record payments as clients move through their visit.",
  },
];

const COMPANY = {
  name: "Variable-X Solutions",
  phone: "0500008001",
  email: "info@variablexsolutions.com",
  location: "Accra, Ghana",
};

const PREVIEW_ROWS = [
  {
    name: "Ama Boateng",
    service: "Haircut + beard trim",
    status: "In progress",
    variant: "info",
    amount: "120.00",
  },
  {
    name: "Kojo Mensah",
    service: "Gel manicure",
    status: "Awaiting payment",
    variant: "warning",
    amount: "80.00",
  },
  {
    name: "Efua Owusu",
    service: "Full valet wash",
    status: "Completed",
    variant: "success",
    amount: "150.00",
  },
  {
    name: "Yaw Asante",
    service: "60 min massage",
    status: "Confirmed",
    variant: "secondary",
    amount: "200.00",
  },
];

function Logo({ className = "h-7 w-auto" }) {
  return (
    <img src="/favicon.svg" alt="" className={className} aria-hidden="true" />
  );
}

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-base font-semibold tracking-tight">
              VX-Workhorse
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#reports"
              className="transition-colors hover:text-foreground"
            >
              Reports
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Button variant="ghost" className="hidden sm:inline-flex" render={<Link to="/login" />}>
              Sign in
            </Button>
            <Button render={<Link to="/register" />} variant="brand">
              Get started
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="right" className="gap-0">
          <SheetHeader className="flex-row items-center justify-between border-b">
            <SheetTitle>Menu</SheetTitle>
            <ThemeToggle />
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-4 text-sm font-medium">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-2 py-2.5 text-foreground transition-colors hover:bg-muted"
            >
              Features
            </a>
            <a
              href="#reports"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-2 py-2.5 text-foreground transition-colors hover:bg-muted"
            >
              Reports
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-2 py-2.5 text-foreground transition-colors hover:bg-muted"
            >
              How it works
            </a>
          </nav>
          <div className="mt-auto flex flex-col gap-2 border-t p-4">
            <Button variant="outline" render={<Link to="/login" />} onClick={() => setMobileNavOpen(false)}>
              Sign in
            </Button>
            <Button variant="brand" render={<Link to="/register" />} onClick={() => setMobileNavOpen(false)}>
              Get started
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-32 -left-32 size-96 rounded-full bg-brand/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 right-0 size-[28rem] rounded-full bg-brand-2/20 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
            <div className="flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
                <Sparkles className="size-3.5" />
                Built for service businesses
              </div>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Run your service business from one place
              </h1>
              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Branches, staff, clients, services, bookings and payments —
                built for barbershops, salons, spas, car washes, nail studios
                and more.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  render={<Link to="/register" />}
                  variant="brand"
                >
                  Start your free account
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link to="/login" />}
                >
                  Sign in
                </Button>
              </div>
              <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-brand" />
                  Multi-branch ready
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-brand" />
                  Role-based access
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-brand" />
                  Set up in minutes
                </div>
              </dl>
            </div>

            {/* Product preview */}
            <div className="relative lg:justify-self-end">
              <div
                aria-hidden="true"
                className="absolute -inset-6 -z-10 rounded-[2rem] bg-linear-to-br from-brand/20 via-transparent to-brand-2/20 blur-2xl"
              />
              <Card className="w-full max-w-md ring-1 ring-foreground/10 sm:p-1">
                <div className="flex items-center justify-between border-b px-4 pb-3">
                  <p className="text-sm font-semibold">Today&apos;s bookings</p>
                  <Badge variant="secondary">Live</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 px-4 py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                    <p className="text-xl font-semibold tabular-nums">18</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">In progress</p>
                    <p className="text-xl font-semibold tabular-nums">4</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-xl font-semibold tabular-nums">
                      GH₵2,450
                    </p>
                  </div>
                </div>
                <div className="space-y-1 px-2 pb-2">
                  {PREVIEW_ROWS.map((row) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {row.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {row.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.service}
                        </p>
                      </div>
                      <Badge
                        variant={row.variant}
                        className="hidden sm:inline-flex"
                      >
                        {row.status}
                      </Badge>
                      <p className="text-sm font-medium tabular-nums">
                        GH₵{row.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Category strip */}
        <section className="border-y bg-muted/30">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-6 py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Built for every kind of service business
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="px-3 py-1 text-sm font-normal"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to run day-to-day operations
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              One workspace for your whole team — from the front desk to the
              back office.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="gap-3 p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Reports & insights */}
        <section
          id="reports"
          className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28"
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Know exactly where you stand financially
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Built-in reports give you full control over revenue, costs and
              performance — no spreadsheets required.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REPORTS.map((report) => (
              <Card key={report.title} className="gap-3 p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <report.icon className="size-5" />
                </div>
                <h3 className="font-semibold">{report.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {report.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t bg-muted/30">
          <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Up and running in three steps
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                No lengthy onboarding — get your business set up and start
                taking bookings today.
              </p>
            </div>
            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="flex flex-col gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand to-brand-2 px-8 py-14 text-center sm:px-16">
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-3xl"
            />
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to streamline your business?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              Create your business account and start managing branches, staff,
              bookings and payments today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                render={<Link to="/register" />}
                className="bg-white text-brand hover:bg-white/90"
              >
                Get started for free
              </Button>
              <Button
                size="lg"
                variant="ghost"
                render={<Link to="/login" />}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                Sign in
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-sm font-semibold tracking-tight">
              VX-Workhorse
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#reports"
              className="transition-colors hover:text-foreground"
            >
              Reports
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <Link
              to="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="transition-colors hover:text-foreground"
            >
              Get started
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VX-Workhorse
          </p>
        </div>
        <div className="border-t">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-6 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-2">
              <img
                src="/variable-x-logo.jpeg"
                alt="Variable-X Solutions"
                className="h-6 w-auto rounded-sm bg-white object-contain"
              />
              <p>
                Built by{" "}
                <span className="font-medium text-foreground">
                  Variable-X Solutions
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>{COMPANY.phone}</span>
              <span>{COMPANY.email}</span>
              <span>{COMPANY.location}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
