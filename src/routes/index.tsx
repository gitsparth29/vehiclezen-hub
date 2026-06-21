import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck,
  Bus,
  HardHat,
  Package,
  Car,
  Wrench,
  ShieldCheck,
  Bell,
  FileCheck2,
  Gauge,
  Users,
  BarChart3,
  ArrowRight,
  Check,
  CircleCheck,
  Clock,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import heroImage from "@/assets/hero-fleet.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FleetPilot — Fleet Management for Every Industry" },
      {
        name: "description",
        content:
          "One platform for school transport, construction, delivery, rental, and trucking fleets. Track documents, services, costs, and drivers in real time.",
      },
      { property: "og:title", content: "FleetPilot — Fleet Management SaaS" },
      {
        property: "og:description",
        content:
          "Know which vehicle is fit for the road. Automate document expiry, service schedules, and cost tracking across your entire fleet.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const niches = [
  {
    icon: Bus,
    title: "School Transport",
    desc: "Route planning, student manifests, parent alerts, driver background checks, and CCTV compliance.",
    color: "text-warning",
  },
  {
    icon: HardHat,
    title: "Construction",
    desc: "Heavy equipment tracking, hour-meter service intervals, site assignments, and operator logs.",
    color: "text-amber-600",
  },
  {
    icon: Package,
    title: "Delivery",
    desc: "Zone management, daily fitness checklists, package weight, and per-vehicle delivery cost.",
    color: "text-primary",
  },
  {
    icon: Car,
    title: "Vehicle Rental",
    desc: "Booking calendar, pre/post inspections, damage photos, customer KYC, and revenue per car.",
    color: "text-success",
  },
  {
    icon: Truck,
    title: "Trucking & Transport",
    desc: "Permits, loads, tolls, freight cost, long-route maintenance, and compliance documents.",
    color: "text-destructive",
  },
  {
    icon: Wrench,
    title: "General Fleet",
    desc: "Core fleet management for any business with 10+ vehicles. Add niche modules anytime.",
    color: "text-muted-foreground",
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Fitness at a glance",
    desc: "Every vehicle is tagged Fit, Service Due, Expired, or Under Maintenance. Fleet health score updates in real time.",
  },
  {
    icon: FileCheck2,
    title: "Never miss a document",
    desc: "Insurance, fitness, PUC, road tax, permits, licenses — automatic alerts before expiry by email, WhatsApp, or SMS.",
  },
  {
    icon: Wrench,
    title: "Service that finds you",
    desc: "Schedule by date or kilometers. Get reminders before a service is due and a full history per vehicle.",
  },
  {
    icon: BarChart3,
    title: "Cost per kilometer",
    desc: "Fuel, repairs, parts, insurance — all attributed to the vehicle and driver. Spot the most expensive truck in your fleet.",
  },
  {
    icon: Users,
    title: "Driver accountability",
    desc: "Licenses, assignments, violations, and performance scores. Assign vehicles in one click.",
  },
  {
    icon: Bell,
    title: "Alerts that actually arrive",
    desc: "Multi-channel: email, WhatsApp, SMS, push, in-app. Configure per alert type and per recipient.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/mo",
    blurb: "For small fleets getting organized.",
    highlight: false,
    features: ["Up to 10 vehicles", "2 users", "5 GB storage", "Email alerts", "Core modules", "Basic reports"],
  },
  {
    name: "Growth",
    price: "$79",
    period: "/mo",
    blurb: "Scale operations with multi-channel alerts.",
    highlight: true,
    features: ["Up to 30 vehicles", "8 users", "20 GB storage", "Email + WhatsApp + SMS", "1 niche module", "Advanced reports"],
  },
  {
    name: "Business",
    price: "$149",
    period: "/mo",
    blurb: "All 5 industry modules and priority support.",
    highlight: false,
    features: ["Up to 100 vehicles", "20 users", "50 GB storage", "All alert channels", "All 5 niche modules", "Full analytics"],
  },
  {
    name: "Enterprise",
    price: "$299+",
    period: "/mo",
    blurb: "Unlimited scale, white label, dedicated CSM.",
    highlight: false,
    features: ["Unlimited vehicles", "Unlimited users", "Unlimited storage", "Custom alerts", "Custom modules", "Dedicated manager"],
  },
];

const faqs = [
  {
    q: "How many vehicles do I need to get value?",
    a: "FleetPilot is designed for fleets of 10 or more vehicles. Below that, a spreadsheet probably still works — above it, things break.",
  },
  {
    q: "Do I have to choose an industry?",
    a: "Yes — at signup you pick one of six niches. Your dashboard, document types, and reports adapt to it. You can switch or add modules later.",
  },
  {
    q: "Can I import my existing vehicle data?",
    a: "Yes. Bulk CSV import for vehicles, drivers, and documents is available on every plan, including the free trial.",
  },
  {
    q: "Which countries do you support?",
    a: "FleetPilot works globally. We support country-specific document types (RC, PUC, MOT, DOT, Mulkiya), 100+ languages, and multi-currency billing.",
  },
  {
    q: "Is there a free trial?",
    a: "14 days, no credit card. You get the full Growth plan during the trial.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <LogoStrip />
      <Niches />
      <Features />
      <DashboardPreview />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-soft">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">FleetPilot</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#niches" className="text-sm text-muted-foreground hover:text-foreground">Industries</a>
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a>
          <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="hidden text-sm font-medium text-foreground hover:text-primary sm:inline">Sign in</Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            Start free trial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-32 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Trusted by fleet managers in 40+ countries
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Know which vehicle is{" "}
          <span className="text-gradient">fit for the road</span>{" "}
          — every single day.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          One platform for school transport, construction, delivery, rental, and trucking fleets.
          Track documents, schedule services, control costs, and stop chasing spreadsheets.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
          >
            Start 14-day free trial <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
          >
            See features
          </a>
        </div>
        <p className="mt-3 text-xs text-white/50">No credit card required • Cancel anytime</p>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 shadow-elegant">
            <img
              src={heroImage}
              alt="FleetPilot dashboard with mixed fleet vehicles arranged on a connected grid"
              className="w-full"
            />
          </div>
          <FloatingStat
            className="left-2 top-6 sm:-left-8"
            icon={CircleCheck}
            tone="success"
            label="Fleet Health"
            value="94%"
          />
          <FloatingStat
            className="right-2 bottom-12 sm:-right-8"
            icon={AlertTriangle}
            tone="warning"
            label="Service Due"
            value="3 vehicles"
          />
        </div>
      </div>
    </section>
  );
}

function FloatingStat({
  icon: Icon,
  label,
  value,
  tone,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: "success" | "warning";
  className?: string;
}) {
  const toneClass = tone === "success" ? "text-success" : "text-warning";
  return (
    <div
      className={`absolute hidden items-center gap-3 rounded-xl border border-white/10 bg-white/95 px-4 py-3 shadow-elegant backdrop-blur sm:flex ${className}`}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-lg bg-secondary ${toneClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-left">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function LogoStrip() {
  const stats = [
    { value: "12,000+", label: "Vehicles tracked" },
    { value: "40+", label: "Countries" },
    { value: "$8M", label: "Maintenance saved" },
    { value: "99.98%", label: "Uptime" },
  ];
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-6 py-8 text-center">
            <div className="text-3xl font-semibold tracking-tight text-foreground">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Niches() {
  return (
    <section id="niches" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-sm font-medium uppercase tracking-wider text-primary">Built for your industry</div>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">One platform. Six fleets.</h2>
        <p className="mt-4 text-muted-foreground">
          Pick your industry at signup. Your dashboard, document types, and reports configure themselves.
        </p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {niches.map((n) => (
          <div
            key={n.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:border-primary/40 hover:shadow-elegant"
          >
            <div className={`grid h-11 w-11 place-items-center rounded-xl bg-secondary ${n.color}`}>
              <n.icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{n.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{n.desc}</p>
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-primary opacity-0 blur-3xl transition group-hover:opacity-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium uppercase tracking-wider text-primary">Core features</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Everything your fleet needs in one place</h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling sticky notes, WhatsApp threads, and three different spreadsheets.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const statusCards = [
    { label: "Fit", value: 84, icon: CircleCheck, tone: "bg-success/10 text-success" },
    { label: "Service Due", value: 7, icon: Clock, tone: "bg-warning/10 text-warning" },
    { label: "Expired Docs", value: 3, icon: AlertTriangle, tone: "bg-destructive/10 text-destructive" },
    { label: "Maintenance", value: 4, icon: Wrench, tone: "bg-primary/10 text-primary" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="text-sm font-medium uppercase tracking-wider text-primary">Real-time dashboard</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">A control tower for your fleet</h2>
          <p className="mt-4 text-muted-foreground">
            Color-coded vehicle status, upcoming alerts timeline, cost charts, and one-click actions.
            Open it on Monday morning and you'll know exactly what needs attention.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Fleet health score updated every minute",
              "Drill into any vehicle's full history",
              "Export any view to PDF, Excel, or CSV",
              "Role-based access for managers, drivers, accountants",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 flex-none text-success" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Fleet health score</div>
              <div className="text-4xl font-semibold tracking-tight">94<span className="text-2xl text-muted-foreground">%</span></div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
              <Gauge className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {statusCards.map((s) => (
              <div key={s.label} className="rounded-xl border border-border p-4">
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-2xl font-semibold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Upcoming alerts</span>
              <span className="text-xs text-muted-foreground">Next 14 days</span>
            </div>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                { v: "MH-12-AB-3401", a: "Insurance expires in 3 days", tone: "text-destructive" },
                { v: "DL-3C-XY-7820", a: "Service due in 7 days / 800 km", tone: "text-warning" },
                { v: "KA-05-MN-1188", a: "Driver license expires in 12 days", tone: "text-warning" },
              ].map((row) => (
                <li key={row.v} className="flex items-center justify-between gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">{row.v}</span>
                  </div>
                  <span className={`text-xs ${row.tone}`}>{row.a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-sm font-medium uppercase tracking-wider text-primary">Pricing</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">Simple plans that scale with your fleet</h2>
          <p className="mt-4 text-muted-foreground">14-day free trial on every plan. No credit card required.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                p.highlight ? "border-primary shadow-elegant" : "border-border shadow-soft"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-success" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  p.highlight
                    ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    : "border border-border bg-background hover:bg-accent"
                }`}
              >
                Start free trial
              </a>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Add-ons available: GPS tracking, WhatsApp alerts, advanced reports, white label, API access.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <div className="text-sm font-medium uppercase tracking-wider text-primary">FAQ</div>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Questions, answered</h2>
      </div>
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {faqs.map((f) => (
          <details key={f.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4">
              <span className="font-medium">{f.q}</span>
              <span className="grid h-6 w-6 flex-none place-items-center rounded-full border border-border text-muted-foreground transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-hero p-12 text-center md:p-16">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Stop the spreadsheet chaos. Start running a real fleet.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Set up your fleet in 10 minutes. Import vehicles, drivers, and documents in bulk.
          </p>
          <a
            href="#pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-primary shadow-elegant transition hover:bg-white/90"
          >
            Start your free trial <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">FleetPilot</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Fleet management software for school transport, construction, delivery, rental, and trucking.
            </p>
          </div>
          <FooterCol title="Product" links={["Features", "Industries", "Pricing", "Integrations", "Mobile app"]} />
          <FooterCol title="Company" links={["About", "Customers", "Blog", "Careers", "Contact"]} />
          <FooterCol title="Legal" links={["Privacy", "Terms", "Security", "GDPR", "Status"]} />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} FleetPilot. All rights reserved.</span>
          <span>Made for fleets that move the world.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="hover:text-foreground">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
