"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function ApplicationLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="Elevate"
      width={size}
      height={size}
      priority
      className="rounded-full object-cover shadow-sm"
    />
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  useEffect(() => { if (ready && !token && pathname !== "/login" && pathname !== "/register") router.replace("/login"); }, [pathname, ready, router, token]);
  if (!ready || !token) return null;
  return (
    <div>
      <header className="border-b border-[var(--line)] bg-[var(--paper)]">
        <div className="container-shell flex min-h-16 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <ApplicationLogo size={38} />
            <span className="text-2xl font-bold tracking-tight text-[var(--accent)]">Elevate</span>
            <span className="text-sm text-[var(--muted)]">assessment judge</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <NavLink href="/assessments">Assessments</NavLink>
            <NavLink href="/problems">Problems</NavLink>
            <NavLink href="/submissions">Submissions</NavLink>
            <NavLink href="/generation-jobs">Generation jobs</NavLink>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="link cursor-pointer rounded px-3 py-2 font-medium hover:bg-[var(--accent-weak)]"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="container-shell py-6">{children}</main>
      {logoutOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
          <div
            className="w-full max-w-sm rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <h2 id="logout-title" className="text-lg font-semibold">Are you sure you want to log out?</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">You will need to verify your account again to access the application.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                className="cursor-pointer rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { logout(); router.replace("/login"); }}
                className="cursor-pointer rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 border-b border-[var(--line)] pb-4">
      <div className={action ? "grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]" : undefined}>
        <div>
          {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{eyebrow}</p> : null}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
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
        "inline-flex cursor-pointer items-center justify-center rounded border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
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

export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-block max-w-full align-top">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden max-w-xs whitespace-normal rounded-md bg-neutral-900 px-3 py-2 text-left text-xs font-normal leading-5 text-white shadow-lg group-hover:block"
      >
        {content}
      </span>
    </span>
  );
}

export function TruncatedText({
  children,
  className,
  lines = 1,
}: {
  children: React.ReactNode;
  className?: string;
  lines?: 1 | 2 | 3;
}) {
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined;

  const truncated = (
    <span
      className={cn(
        "block min-w-0 overflow-hidden text-ellipsis",
        lines === 1 ? "whitespace-nowrap" : lines === 2 ? "line-clamp-2" : "line-clamp-3",
        className,
      )}
    >
      {children}
    </span>
  );

  return text ? <Tooltip content={text}>{truncated}</Tooltip> : truncated;
}
