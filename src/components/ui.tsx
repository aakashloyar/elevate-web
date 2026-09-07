import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="container-shell flex min-h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--accent)]">Elevate</span>
            <span className="text-sm text-[var(--muted)]">assessment judge</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <NavLink href="/assessments">Assessments</NavLink>
            <NavLink href="/problems">Problems</NavLink>
            <NavLink href="/exam">Exam runner</NavLink>
            <NavLink href="/generation">AI generation</NavLink>
            <NavLink href="/results">Results</NavLink>
          </nav>
        </div>
      </header>
      <main className="container-shell py-6">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded px-3 py-2 text-[var(--muted)] hover:bg-[var(--accent-weak)] hover:text-[var(--accent)]">
      {children}
    </Link>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 border-b border-[var(--line)] pb-4">
      {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p> : null}
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
      {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card", className)}>
      {title || action ? (
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          {title ? <h2 className="font-semibold">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "border-[var(--accent)] bg-[var(--accent)] text-white hover:brightness-95",
        variant === "secondary" && "border-[var(--line)] bg-white text-neutral-900 hover:bg-neutral-50",
        variant === "danger" && "border-[var(--danger)] bg-[var(--danger)] text-white hover:brightness-95",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-neutral-800">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "blue" | "green" | "red" | "yellow" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-xs font-semibold",
        tone === "neutral" && "border-neutral-300 bg-neutral-50 text-neutral-700",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-800",
        tone === "green" && "border-green-200 bg-green-50 text-green-800",
        tone === "red" && "border-red-200 bg-red-50 text-red-800",
        tone === "yellow" && "border-yellow-200 bg-yellow-50 text-yellow-800",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-dashed border-[var(--line)] bg-white/50 p-8 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}
