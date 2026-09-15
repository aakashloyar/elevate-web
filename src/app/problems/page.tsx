"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AppShell, Badge, Button, Field, inputClass, Panel, PageTitle, TruncatedText } from "@/components/ui";
import { problemsApi } from "@/lib/api/services";
import type { Difficulty, Problem, ProblemType } from "@/lib/api/types";

const pageSize = 10;

export default function ProblemsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [type, setType] = useState<ProblemType>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [statement, setStatement] = useState("");
  const [createdBy, setCreatedBy] = useState("019fd16d-8296-7039-949f-65044c31d28f");

  const createProblem = useMutation({
    mutationFn: problemsApi.create,
    onSuccess: () => {
      setStatement("");
      setShowCreateForm(false);
    },
  });

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
      render: (problem) => (
        <TruncatedText className="text-[var(--muted)]">
          {(
            problem.topic_ids?.length ? problem.topic_ids
              : problem.topicIds?.length ? problem.topicIds
                : problem.topics?.length ? problem.topics
                  : problem.tags
          )?.join(", ") || "—"}
        </TruncatedText>
      ),
    },
  ];

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createProblem.mutate({
      created_by: createdBy,
      title: statement.slice(0, 48),
      statement,
      type,
      difficulty,
      source_type: "manual",
      options: [
        { text: "Option A", is_correct: true },
        { text: "Option B", is_correct: false },
      ],
      tags: ["manual"],
    });
  }

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
          createAction={<Button onClick={() => setShowCreateForm((value) => !value)}>{showCreateForm ? "Close form" : "New problem"}</Button>}
          fetchPage={async ({ offset, limit, search }) => {
            const response = await problemsApi.list({ offset, limit, title: search || undefined });
            const rows = await Promise.all(
              response.problems.map(async (problem) => {
                try {
                  return { ...problem, ...(await problemsApi.get(problem.id)) };
                } catch {
                  return problem;
                }
              }),
            );
            return { rows };
          }}
        />

        {showCreateForm ? (
        <Panel title="Quick manual problem">
          <form onSubmit={onSubmit} className="grid gap-3">
            <Field label="Type">
              <select className={inputClass} value={type} onChange={(event) => setType(event.target.value as ProblemType)}>
                <option value="single">single</option>
                <option value="multiple">multiple</option>
                <option value="numerical">numerical</option>
              </select>
            </Field>
            <Field label="Difficulty">
              <select className={inputClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </Field>
            <Field label="Statement">
              <textarea className={inputClass} rows={6} value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Write the question statement..." required />
            </Field>
            <Field label="Created by user ID">
              <input className={inputClass} value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
            </Field>
            <Button disabled={createProblem.isPending}>{createProblem.isPending ? "Saving..." : "Save problem"}</Button>
          </form>
        </Panel>
        ) : null}
      </div>
    </AppShell>
  );
}
