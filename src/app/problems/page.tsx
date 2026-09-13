"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell, Badge, Button, EmptyState, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { problemsApi } from "@/lib/api/services";
import type { Difficulty, Problem, ProblemType } from "@/lib/api/types";
import { mockProblems } from "@/lib/mock-data";

export default function ProblemsPage() {
  const [type, setType] = useState<ProblemType>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [statement, setStatement] = useState("");
  const [createdBy, setCreatedBy] = useState("019fd16d-8296-7039-949f-65044c31d28f");

  const problemsQuery = useQuery({
    queryKey: ["problems"],
    queryFn: () => problemsApi.list({ offset: 0, limit: 20 }),
  });
  const createProblem = useMutation({
    mutationFn: problemsApi.create,
    onSuccess: () => {
      setStatement("");
      void problemsQuery.refetch();
    },
  });

  const problems = problemsQuery.data?.problems ?? mockProblems;

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
        description="Compact CSES-style listing with type, difficulty, source, and tags visible at a glance."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel title="Problem list">
          {problems.length === 0 ? (
            <EmptyState title="No problems found" description="Create manually or generate from an assessment." />
          ) : (
            <div className="space-y-3">
              {problems.map((problem: Problem) => (
                <article key={problem.id} className="border border-[var(--line)] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{problem.title || problem.id}</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-800">{problem.statement}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone="blue">{problem.type}</Badge>
                      <Badge>{problem.difficulty}</Badge>
                      <Badge tone={problem.source_type === "ai" ? "yellow" : "neutral"}>{problem.source_type}</Badge>
                    </div>
                  </div>
                  {problem.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {problem.tags.map((tag) => <span key={tag} className="text-xs text-[var(--muted)]">#{tag}</span>)}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Panel>

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
      </div>
    </AppShell>
  );
}
