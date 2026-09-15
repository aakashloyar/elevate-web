"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AppShell, Button, PageTitle, TruncatedText } from "@/components/ui";
import { assessmentsApi } from "@/lib/api/services";
import type { Assessment } from "@/lib/api/types";
import { formatDateTime, minutesFromSeconds } from "@/lib/utils";

const pageSize = 10;

export default function AssessmentsPage() {
  const router = useRouter();
  const columns: DataTableColumn<Assessment>[] = [
    {
      key: "assessment",
      header: "Assessment",
      render: (assessment) => (
        <TruncatedText className="font-semibold hover:text-[var(--accent)]">{assessment.title || assessment.id}</TruncatedText>
      ),
    },
    {
      key: "description",
      header: "Description",
      className: "w-[30%]",
      render: (assessment) => <TruncatedText className="text-xs leading-5 text-[var(--muted)]">{assessment.description || "No description"}</TruncatedText>,
    },
    {
      key: "created_by",
      header: "CreatedBy",
      className: "w-[18%]",
      render: (assessment) => <TruncatedText className="text-[var(--muted)]">{assessment.created_by || "—"}</TruncatedText>,
    },
    {
      key: "duration",
      header: "Duration",
      render: (assessment) => minutesFromSeconds(assessment.duration_seconds),
    },
    {
      key: "created",
      header: "CreatedAt",
      render: (assessment) => <span className="text-[var(--muted)]">{formatDateTime(assessment.created_at)}</span>,
    },
  ];

  return (
    <AppShell>
      <PageTitle
        eyebrow="Assessments"
        title="Create and manage tests"
        description="Search and page through assessments from the backend. The table fetches the next page only when requested."
      />

      <div className="grid gap-4">
        <DataTable
          title="Assessment list"
          searchPlaceholder="Search by title"
          pageSize={pageSize}
          columns={columns}
          queryKey="assessments"
          emptyTitle="No assessments found"
          emptyDescription="Create an assessment or change your search."
          getRowKey={(assessment) => assessment.id}
          onRowClick={(assessment) => router.push(`/assessments/${assessment.id}`)}
          createAction={<Link href="/assessments/create"><Button>New assessment</Button></Link>}
          fetchPage={async ({ offset, limit, search }) => {
            const response = await assessmentsApi.list({ offset, limit, title: search || undefined });
            return { rows: response.assessments };
          }}
        />
      </div>
    </AppShell>
  );
}
