"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status";
import { AppShell, Button, Field, inputClass, Panel, PageTitle, TruncatedText } from "@/components/ui";
import { submissionsApi } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";

const defaultUserID = "019fd16d-8296-7039-949f-65044c31d28f";

export default function SubmissionsPage() {
  const router = useRouter();
  const [userID, setUserID] = useState(defaultUserID);
  const [activeUserID, setActiveUserID] = useState(defaultUserID);
  const submissionsQuery = useQuery({
    queryKey: ["submissions", activeUserID],
    queryFn: () => submissionsApi.list(activeUserID),
    enabled: Boolean(activeUserID),
  });

  const submissions = submissionsQuery.data?.submissions ?? [];

  return (
    <AppShell>
      <PageTitle eyebrow="Submissions" title="User submissions" description="Review attempts and open an individual submission for its evaluation insights." />
      <Panel title="Find submissions">
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); setActiveUserID(userID.trim()); }}>
          <Field label="User ID">
            <input className={inputClass} value={userID} onChange={(event) => setUserID(event.target.value)} required />
          </Field>
          <Button type="submit">Load submissions</Button>
        </form>
      </Panel>

      <Panel title="Submissions" className="mt-4">
        {submissionsQuery.isPending ? <p className="text-sm text-[var(--muted)]">Loading submissions...</p> : null}
        {submissionsQuery.error ? <p className="text-sm text-[var(--danger)]">{submissionsQuery.error.message}</p> : null}
        {!submissionsQuery.isPending && !submissionsQuery.error && submissions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No submissions found for this user.</p>
        ) : null}
        {submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="border-b border-[var(--line)] text-left"><th className="py-2 pr-3">Submission</th><th className="py-2 pr-3">Assessment</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Duration</th><th className="py-2">Created</th></tr></thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="cursor-pointer border-b border-[var(--line)] last:border-0 hover:bg-[var(--accent-weak)]" onClick={() => router.push(`/submissions/${submission.id}`)}>
                    <td className="max-w-0 py-3 pr-3 font-medium"><Link href={`/submissions/${submission.id}`} onClick={(event) => event.stopPropagation()}><TruncatedText>{submission.id}</TruncatedText></Link></td>
                    <td className="max-w-0 py-3 pr-3"><TruncatedText>{submission.assessment_id}</TruncatedText></td>
                    <td className="py-3 pr-3"><StatusBadge value={submission.status} /></td>
                    <td className="py-3 pr-3">{submission.duration_seconds}s</td>
                    <td className="py-3">{formatDateTime(submission.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Panel>
    </AppShell>
  );
}
