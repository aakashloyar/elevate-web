"use client";

import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { StatusBadge } from "@/components/status";
import { AppShell, PageTitle, TruncatedText } from "@/components/ui";
import { submissionsApi } from "@/lib/api/services";
import type { SubmissionSummary } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const pageSize = 10;

export default function SubmissionsPage() {
  const router = useRouter();
  const columns: DataTableColumn<SubmissionSummary>[] = [
    {
      key: "submission",
      header: "Submission",
      render: (submission) => <TruncatedText className="font-semibold hover:text-[var(--accent)]">{submission.id}</TruncatedText>,
    },
    {
      key: "assessment",
      header: "Assessment",
      render: (submission) => <TruncatedText>{submission.assessment_title || submission.assessment_id}</TruncatedText>,
    },
    {
      key: "user",
      header: "User",
      render: (submission) => <TruncatedText className="text-[var(--muted)]">{submission.user_name || submission.user_id || "—"}</TruncatedText>,
    },
    {
      key: "status",
      header: "Status",
      render: (submission) => <StatusBadge value={submission.status} />,
    },
    {
      key: "duration",
      header: "Duration",
      render: (submission) => `${submission.duration_seconds}s`,
    },
    {
      key: "created",
      header: "Created",
      render: (submission) => <span className="text-[var(--muted)]">{formatDateTime(submission.created_at)}</span>,
    },
  ];

  return (
    <AppShell>
      <PageTitle eyebrow="Submissions" title="User submissions" description="Review attempts and open an individual submission for its evaluation insights." />
      <DataTable
        title="Submission list"
        pageSize={pageSize}
        columns={columns}
        queryKey="submissions"
        emptyTitle="No submissions found"
        emptyDescription="There are no submissions to display."
        getRowKey={(submission) => submission.id}
        onRowClick={(submission) => router.push(`/submissions/${submission.id}`)}
        fetchPage={async ({ offset, limit }) => {
          const response = await submissionsApi.list({ offset, limit });
          return { rows: response.submissions };
        }}
      />
    </AppShell>
  );
}
