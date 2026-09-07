import Link from "next/link";
import { AppShell, Badge, Panel, PageTitle } from "@/components/ui";

const cards = [
  { label: "Assessments", value: "12", href: "/assessments", note: "create, mark, assign" },
  { label: "Problems", value: "248", href: "/problems", note: "manual + AI generated" },
  { label: "Active attempts", value: "31", href: "/exam", note: "runner and drafts" },
  { label: "Evaluated", value: "1.2k", href: "/results", note: "submission results" },
];

export default function Home() {
  return (
    <AppShell>
      <PageTitle
        eyebrow="Workspace"
        title="A simple control room for assessments"
        description="Built for fast daily work: create assessments, generate problems, run attempts, and check submissions without a heavy dashboard feeling."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card block p-4 hover:border-[var(--accent)]">
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{card.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Today&apos;s queue">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] text-left">
                  <th className="py-2 pr-3">Item</th>
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2">Next</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Graph Practice Set", "assessment", "draft", "add marking scheme"],
                  ["Job G-204", "problem generation", "processing", "wait for problem ids"],
                  ["Submission S123", "evaluation", "evaluated", "review result"],
                ].map(([item, service, state, next]) => (
                  <tr key={item} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2 pr-3 font-medium">{item}</td>
                    <td className="py-2 pr-3 text-[var(--muted)]">{service}</td>
                    <td className="py-2 pr-3"><Badge tone="blue">{state}</Badge></td>
                    <td className="py-2 text-[var(--muted)]">{next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Backend map">
          <ol className="space-y-3 text-sm">
            <li><Badge>1</Badge> create generation job</li>
            <li><Badge>2</Badge> worker calls Gemini</li>
            <li><Badge>3</Badge> problem service saves generated problems</li>
            <li><Badge>4</Badge> assessment service attaches problem ids</li>
            <li><Badge>5</Badge> submission and evaluation handle results</li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}
