"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { AppShell, Badge, Button, EmptyState, Panel, PageTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { runnerApi, submissionsApi } from "@/lib/api/services";
import type { ProblemView } from "@/lib/api/types";

const PROBLEMS_PAGE_SIZE = 12;

type PendingSave = {
  answers: Array<{ problem_id: string; answer: string[] }>;
  versions: Record<string, number>;
};

export default function ExamPage() {
  const searchParams = useSearchParams();
  const [attemptId, setAttemptId] = useState(() => searchParams.get("submissionId") ?? "S123");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [dirtyCount, setDirtyCount] = useState(0);
  const answersRef = useRef<Record<string, string[]>>({});
  const answerVersionsRef = useRef<Record<string, number>>({});
  const dirtyAnswersRef = useRef(new Set<string>());

  const problemsQuery = useInfiniteQuery({
    queryKey: ["attempt-problems", attemptId],
    queryFn: ({ pageParam }) => runnerApi.getAttemptProblems(attemptId, pageParam, PROBLEMS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const problems = normalizeProblemsPage(lastPage);
      return problems.length === PROBLEMS_PAGE_SIZE ? allPages.length * PROBLEMS_PAGE_SIZE : undefined;
    },
  });
  const statusQuery = useQuery({
    queryKey: ["submission-status", attemptId],
    queryFn: () => submissionsApi.status(attemptId),
  });
  const saveBatch = useMutation({
    mutationFn: (payload: PendingSave) =>
      submissionsApi.saveAnswerBatch(
        attemptId,
        payload.answers,
      ),
    onSuccess: (_data, payload) => {
      payload.answers.forEach(({ problem_id }) => {
        if (answerVersionsRef.current[problem_id] === payload.versions[problem_id]) {
          dirtyAnswersRef.current.delete(problem_id);
        }
      });
      setDirtyCount(dirtyAnswersRef.current.size);
    },
  });
  const buildPendingSave = useCallback((): PendingSave | null => {
    const answersToSave = Array.from(dirtyAnswersRef.current)
      .filter((problemId) => answersRef.current[problemId] !== undefined)
      .map((problem_id) => ({ problem_id, answer: answersRef.current[problem_id] }));
    if (answersToSave.length === 0) return null;
    return {
      answers: answersToSave,
      versions: Object.fromEntries(answersToSave.map(({ problem_id }) => [problem_id, answerVersionsRef.current[problem_id] ?? 0])),
    };
  }, []);
  const saveDirtyAnswers = useCallback(async () => {
    const pending = buildPendingSave();
    if (pending) await saveBatch.mutateAsync(pending);
  }, [buildPendingSave, saveBatch]);
  const submitSubmission = useMutation({
    mutationFn: async () => {
      await saveDirtyAnswers();
      return submissionsApi.submit(attemptId);
    },
    onSuccess: () => void statusQuery.refetch(),
  });

  const problems = useMemo(
    () => problemsQuery.data?.pages.flatMap(normalizeProblemsPage) ?? [],
    [problemsQuery.data],
  );
  const current = problems[currentIndex];
  const selectorStart = Math.floor(currentIndex / PROBLEMS_PAGE_SIZE) * PROBLEMS_PAGE_SIZE;
  const selectorProblems = problems.slice(selectorStart, selectorStart + PROBLEMS_PAGE_SIZE);
  const selected = useMemo(
    () => answers[current?.id] ?? current?.draft_answer ?? [],
    [answers, current],
  );

  useEffect(() => {
    if (currentIndex >= problems.length - 2 && problemsQuery.hasNextPage && !problemsQuery.isFetchingNextPage) {
      void problemsQuery.fetchNextPage();
    }
  }, [currentIndex, problems.length, problemsQuery]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!saveBatch.isPending && dirtyAnswersRef.current.size > 0) {
        void saveDirtyAnswers();
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [saveBatch.isPending, saveDirtyAnswers]);

  function setAnswer(problemId: string, answer: string[]) {
    answersRef.current = { ...answersRef.current, [problemId]: answer };
    answerVersionsRef.current[problemId] = (answerVersionsRef.current[problemId] ?? 0) + 1;
    dirtyAnswersRef.current.add(problemId);
    setDirtyCount(dirtyAnswersRef.current.size);
    setAnswers((previous) => ({ ...previous, [problemId]: answer }));
  }

  function toggle(optionId: string) {
    if (!current) return;
    const existing = answersRef.current[current.id] ?? current.draft_answer ?? [];
    if (current.type === "single" || current.type === "numerical") {
      setAnswer(current.id, [optionId]);
      return;
    }
    setAnswer(current.id, existing.includes(optionId)
      ? existing.filter((id) => id !== optionId)
      : [...existing, optionId]);
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
          <Button variant="secondary" onClick={() => void saveDirtyAnswers()} disabled={saveBatch.isPending || dirtyCount === 0}>
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Panel title={current ? `${currentIndex + 1}. ${current.title || current.id}` : "Problem"}>
          {problemsQuery.isPending ? (
            <p className="text-sm text-[var(--muted)]">Loading questions...</p>
          ) : problemsQuery.error ? (
            <p className="text-sm text-[var(--danger)]">{problemsQuery.error.message}</p>
          ) : !current ? (
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
                  onChange={(event) => setAnswer(current.id, [event.target.value])}
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
                <Button
                  disabled={(currentIndex === problems.length - 1 && !problemsQuery.hasNextPage) || problemsQuery.isFetchingNextPage}
                  onClick={async () => {
                    if (currentIndex < problems.length - 1) {
                      setCurrentIndex((value) => value + 1);
                      return;
                    }
                    if (problemsQuery.hasNextPage) {
                      await problemsQuery.fetchNextPage();
                      setCurrentIndex((value) => value + 1);
                    }
                  }}
                >
                  {problemsQuery.isFetchingNextPage ? "Loading..." : "Next"}
                </Button>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Questions">
          <div className="mb-3">
            <p className="text-xs text-[var(--muted)]">
              Questions {selectorStart + 1}-{Math.min(selectorStart + PROBLEMS_PAGE_SIZE, problems.length)} of {problems.length} loaded
            </p>
          </div>
          <div className="grid grid-cols-5 gap-2 lg:grid-cols-4">
            {selectorProblems.map((problem, index) => {
              const problemIndex = selectorStart + index;
              return (
              <button
                key={problem.id}
                onClick={() => setCurrentIndex(problemIndex)}
                className={`border px-3 py-2 text-sm font-semibold ${problemIndex === currentIndex ? "border-[var(--accent)] bg-[var(--accent-weak)]" : "border-[var(--line)] bg-white"}`}
              >
                {problemIndex + 1}
              </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between gap-2 border-t border-[var(--line)] pt-3">
            <button
              type="button"
              className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous question selector page"
              title="Previous questions"
              disabled={selectorStart === 0}
              onClick={() => setCurrentIndex(selectorStart - PROBLEMS_PAGE_SIZE)}
            >
              ←
            </button>
            <span className="self-center text-xs text-[var(--muted)]">
              {problemsQuery.isFetchingNextPage ? "Loading..." : `${Math.floor(selectorStart / PROBLEMS_PAGE_SIZE) + 1}`}
            </span>
            <button
              type="button"
              className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next question selector page"
              title="Next questions"
              disabled={problemsQuery.isFetchingNextPage || (!problemsQuery.hasNextPage && selectorStart + PROBLEMS_PAGE_SIZE >= problems.length)}
              onClick={async () => {
                const nextStart = selectorStart + PROBLEMS_PAGE_SIZE;
                if (nextStart < problems.length) {
                  setCurrentIndex(nextStart);
                  return;
                }
                if (problemsQuery.hasNextPage) {
                  await problemsQuery.fetchNextPage();
                  setCurrentIndex(nextStart);
                }
              }}
            >
              →
            </button>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function normalizeProblemsPage(page: { problems: ProblemView[] } | ProblemView[]): ProblemView[] {
  return Array.isArray(page) ? page : page.problems;
}
