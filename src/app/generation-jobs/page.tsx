"use client";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { DifficultyBadge, StatusBadge } from "@/components/status";
import { AppShell, PageTitle, TruncatedText } from "@/components/ui";
import { generationApi } from "@/lib/api/services";
import type { GenerationJob } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const pageSize = 10;

export default function GenerationJobsPage() {
  const columns: DataTableColumn<GenerationJob>[] = [
    {
      key: "description",
      header: "Description",
      className: "w-[22%]",
      render: (job) => <TruncatedText className="max-w-[220px] font-semibold">{job.description || "Untitled generation"}</TruncatedText>,
    },
    {
      key: "assessment",
      header: "Assessment",
      className: "w-[22%]",
      render: (job) => <TruncatedText>{job.assessment_title || "—"}</TruncatedText>,
    },
    {
      key: "status",
      header: "Status",
      render: (job) => <StatusBadge value={job.status} />,
    },
    {
      key: "level",
      header: "Level",
      render: (job) => <DifficultyBadge value={job.level} />,
    },
    {
      key: "requested",
      header: "Requested",
      render: (job) => (job.single_correct_count ?? 0) + (job.multi_correct_count ?? 0) + (job.numerical_count ?? 0),
    },
    {
      key: "generated",
      header: "Generated",
      render: (job) => job.generated_problem_count ?? 0,
    },
    {
      key: "created",
      header: "CreatedAt",
      render: (job) => <span className="text-[var(--muted)]">{formatDateTime(job.created_at)}</span>,
    },
  ];

  return (
    <AppShell>
      <PageTitle
        eyebrow="AI generation"
        title="Generation jobs"
        description="Review problem-generation jobs and their current progress. Jobs are loaded 10 at a time."
      />
      <DataTable
        title="Generation job list"
        searchPlaceholder="Search jobs"
        pageSize={pageSize}
        columns={columns}
        queryKey="generation-jobs"
        emptyTitle="No generation jobs found"
        emptyDescription="Create an AI generation job to see it here."
        getRowKey={(job) => job.id || job.job_id || `${job.created_at}-${job.description}`}
        fetchPage={async ({ offset, limit, search }) => {
          const response = await generationApi.list({ offset, limit, search: search || undefined });
          return { rows: response.generation_jobs };
        }}
      />
    </AppShell>
  );
}
