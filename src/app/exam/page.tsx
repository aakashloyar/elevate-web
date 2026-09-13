"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell, Badge, Button, EmptyState, Panel, PageTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { runnerApi, submissionsApi } from "@/lib/api/services";
import { mockAttemptProblems } from "@/lib/mock-data";

export default function ExamPage() {
  const [attemptId, setAttemptId] = useState("S123");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const problemsQuery = useQuery({
    queryKey: ["attempt-problems", attemptId],
    queryFn: () => runnerApi.getAttemptProblems(attemptId, 0, 10),
  });
  const statusQuery = useQuery({
    queryKey: ["submission-status", attemptId],
    queryFn: () => submissionsApi.status(attemptId),
  });
  const saveBatch = useMutation({
    mutationFn: () =>
      submissionsApi.saveAnswerBatch(
        attemptId,
        Object.entries(answers).map(([problem_id, answer]) => ({ problem_id, answer })),
      ),
  });
  const startSubmission = useMutation({
    mutationFn: () => submissionsApi.start(attemptId),
    onSuccess: () => void statusQuery.refetch(),
  });
  const submitSubmission = useMutation({
    mutationFn: () => submissionsApi.submit(attemptId),
    onSuccess: () => void statusQuery.refetch(),
  });

  const rawProblems = Array.isArray(problemsQuery.data)
    ? problemsQuery.data
    : problemsQuery.data?.problems;
  const problems = rawProblems?.length ? rawProblems : mockAttemptProblems;
  const current = problems[currentIndex];
  const selected = useMemo(
    () => answers[current?.id] ?? current?.draft_answer ?? [],
    [answers, current],
  );

  function toggle(optionId: string) {
    if (!current) return;
    setAnswers((prev) => {
      const existing = prev[current.id] ?? current.draft_answer ?? [];
      if (current.type === "single" || current.type === "numerical") {
        return { ...prev, [current.id]: [optionId] };
      }
      return {
        ...prev,
        [current.id]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      };
    });
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Exam runner"
        title="Attempt problems with saved draft answers"
        description="This page calls the runner endpoint and displays draft answers returned by submission service through the runner."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 card p-3">
        <label className="text-sm">
          Attempt ID{" "}
          <input className="ml-2 rounded border border-[var(--line)] bg-white px-2 py-1" value={attemptId} onChange={(event) => setAttemptId(event.target.value)} />
        </label>
        <div className="flex items-center gap-2 text-sm">
          <span>Status:</span>
          {statusQuery.data ? <StatusBadge value={statusQuery.data.status} /> : <Badge>mock/inactive</Badge>}
          <span className="text-[var(--muted)]">Expires: {statusQuery.data?.expires_at ?? "—"}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => startSubmission.mutate()} disabled={startSubmission.isPending}>Start</Button>
          <Button variant="secondary" onClick={() => saveBatch.mutate()} disabled={saveBatch.isPending || Object.keys(answers).length === 0}>
            {saveBatch.isPending ? "Saving..." : "Save drafts"}
          </Button>
          <Button onClick={() => submitSubmission.mutate()} disabled={submitSubmission.isPending}>Submit</Button>
        </div>
      </div>

      {saveBatch.data ? (
        <div className="mb-4 card p-3 text-sm">
          <p className="font-semibold">Saved {saveBatch.data.saved_count} answer(s)</p>
          {saveBatch.data.errors.length ? (
            <ul className="mt-2 list-disc pl-5 text-[var(--danger)]">
              {saveBatch.data.errors.map((error) => (
                <li key={`${error.problem_id}-${error.message}`}>{error.problem_id}: {error.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Panel title="Questions">
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {problems.map((problem, index) => (
              <button
                key={problem.id}
                onClick={() => setCurrentIndex(index)}
                className={`border px-3 py-2 text-sm font-semibold ${index === currentIndex ? "border-[var(--accent)] bg-[var(--accent-weak)]" : "border-[var(--line)] bg-white"}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={current ? `${currentIndex + 1}. ${current.title || current.id}` : "Problem"}>
          {!current ? (
            <EmptyState title="No problem loaded" description="Check the attempt id or backend runner service." />
          ) : (
            <div>
              <div className="mb-3 flex gap-2">
                <Badge tone="blue">{current.type}</Badge>
                <Badge>{current.difficulty}</Badge>
              </div>
              <p className="mb-5 whitespace-pre-wrap leading-7">{current.statement}</p>
              {current.type === "numerical" ? (
                <input
                  className="w-full rounded border border-[var(--line)] bg-white px-3 py-2 text-sm"
                  value={selected[0] ?? ""}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, [current.id]: [event.target.value] }))}
                  placeholder="Enter numerical answer"
                />
              ) : (
                <div className="grid gap-2">
                  {current.options?.map((option, index) => (
                    <button
                      key={option.id ?? option.text}
                      onClick={() => toggle(option.id ?? option.text)}
                      className={`flex items-start gap-3 border p-3 text-left text-sm ${selected.includes(option.id ?? option.text) ? "border-[var(--accent)] bg-[var(--accent-weak)]" : "border-[var(--line)] bg-white"}`}
                    >
                      <span className="font-bold">{String.fromCharCode(65 + index)}.</span>
                      <span>{option.text}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-5 flex justify-between">
                <Button variant="secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex((value) => value - 1)}>Previous</Button>
                <Button disabled={currentIndex === problems.length - 1} onClick={() => setCurrentIndex((value) => value + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
