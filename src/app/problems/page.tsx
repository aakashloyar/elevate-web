"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AppShell, Badge, Button, PageTitle, TruncatedText } from "@/components/ui";
import { problemsApi } from "@/lib/api/services";
import type { Problem } from "@/lib/api/types";

const pageSize = 10;

export default function ProblemsPage() {
  const columns: DataTableColumn<Problem>[] = [
    {
      key: "problem",
      header: "Problem",
      render: (problem) => (
        <div>
          <TruncatedText className="font-semibold">{problem.title || problem.id}</TruncatedText>
          <TruncatedText className="mt-1 max-w-3xl text-sm leading-6 text-neutral-800" lines={2}>{problem.statement || "Open problem details to view full statement."}</TruncatedText>
          {problem.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {problem.tags.map((tag) => <span key={tag} className="text-xs text-[var(--muted)]">#{tag}</span>)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (problem) => <Badge tone="blue">{problem.type}</Badge>,
    },
    {
      key: "difficulty",
      header: "Difficulty",
      render: (problem) => <Badge>{problem.difficulty}</Badge>,
    },
    {
      key: "source",
      header: "Source",
      render: (problem) => {
        const source = problem.source_type ?? problem.sourceType ?? problem.source;
        return <Badge tone={source === "ai" ? "yellow" : "neutral"}>{source || "—"}</Badge>;
      },
    },
    {
      key: "topics",
      header: "Topics",
      className: "w-[20%]",
      render: (problem) => {
        const topics = problem.topic_ids?.length ? problem.topic_ids
          : problem.topicIds?.length ? problem.topicIds
            : problem.topics?.length ? problem.topics
              : problem.tags;

        return topics?.length ? (
          <div className="flex flex-wrap gap-1">
            {topics.map((topic) => (
              <span key={topic} title={topic} className="max-w-full">
                <Badge>
                  <TruncatedText>{topic}</TruncatedText>
                </Badge>
              </span>
            ))}
          </div>
        ) : "—";
      },
    },
  ];

  return (
    <AppShell>
      <PageTitle
        eyebrow="Problem bank"
        title="Problems should read like textbook exercises"
        description="Search and page through backend problems in a simple Codeforces-style table."
      />

      <div className="grid gap-4">
        <DataTable
          title="Problem list"
          searchPlaceholder="Search by title"
          pageSize={pageSize}
          columns={columns}
          queryKey="problems"
          emptyTitle="No problems found"
          emptyDescription="Create manually, generate problems, or change your search."
          getRowKey={(problem) => problem.id}
          createAction={<Link href="/problems/create"><Button>New problem</Button></Link>}
          fetchPage={async ({ offset, limit, search }) => {
            const response = await problemsApi.list({ offset, limit, title: search || undefined });
            return { rows: response.problems };
          }}
        />

      </div>
    </AppShell>
  );
}
