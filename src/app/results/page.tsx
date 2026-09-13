"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Badge, Button, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { evaluationApi, submissionsApi } from "@/lib/api/services";
import { mockEvaluation } from "@/lib/mock-data";

export default function ResultsPage() {
  const [submissionId, setSubmissionId] = useState("S123");
  const [activeId, setActiveId] = useState("S123");

  const statusQuery = useQuery({
    queryKey: ["result-status", activeId],
    queryFn: () => submissionsApi.status(activeId),
    enabled: Boolean(activeId),
  });
  const evaluationQuery = useQuery({
    queryKey: ["evaluation", activeId],
    queryFn: () => evaluationApi.getBySubmission(activeId),
    enabled: Boolean(activeId),
  });
  const evaluation = evaluationQuery.data ?? mockEvaluation;
  const score = evaluation.scored_marks ?? evaluation.score;
  const total = evaluation.total_marks;

  return (
    <AppShell>
      <PageTitle
        eyebrow="Results"
        title="Submission status and evaluation"
        description="Poll submission lifecycle first, then read complete result from evaluation service once evaluated."
      />

      <div className="mb-4 card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Submission ID">
            <input className={inputClass} value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} />
          </Field>
          <Button onClick={() => setActiveId(submissionId)}>Check result</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel title="Status">
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Submission:</span> {activeId}</p>
            <p><span className="font-semibold">State:</span> {statusQuery.data ? <StatusBadge value={statusQuery.data.status} /> : <Badge>mock/inactive</Badge>}</p>
            <p className="text-[var(--muted)]">Expires: {statusQuery.data?.expires_at ?? "—"}</p>
          </div>
        </Panel>

        <Panel title="Evaluation">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="border border-[var(--line)] bg-white p-3">
              <p className="text-xs text-[var(--muted)]">Scored</p>
              <p className="text-2xl font-bold">{score ?? "—"}</p>
            </div>
            <div className="border border-[var(--line)] bg-white p-3">
              <p className="text-xs text-[var(--muted)]">Total</p>
              <p className="text-2xl font-bold">{total ?? "—"}</p>
            </div>
            <div className="border border-[var(--line)] bg-white p-3">
              <p className="text-xs text-[var(--muted)]">Questions</p>
              <p className="text-2xl font-bold">{evaluation.questions?.length ?? 0}</p>
            </div>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-left">
                <th className="py-2 pr-3">Problem</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Marks</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.questions?.map((question) => (
                <tr key={question.problem_id} className="border-b border-[var(--line)] last:border-0">
                  <td className="py-2 pr-3 font-medium">{question.problem_id}</td>
                  <td className="py-2 pr-3"><StatusBadge value={question.status} /></td>
                  <td className="py-2">{question.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
