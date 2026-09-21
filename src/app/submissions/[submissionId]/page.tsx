"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status";
import { AppShell, Badge, Button, Panel, PageTitle } from "@/components/ui";
import { evaluationApi, submissionsApi } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";

const QUESTION_SELECTOR_PAGE_SIZE = 12;

export default function SubmissionDetailPage() {
  const params = useParams<{ submissionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submissionId = params.submissionId;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const submissionQuery = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => submissionsApi.get(submissionId),
    enabled: Boolean(submissionId),
  });
  const evaluationQuery = useQuery({
    queryKey: ["evaluation", submissionId],
    queryFn: () => evaluationApi.getBySubmission(submissionId),
    enabled: Boolean(submissionId) && Boolean(submissionQuery.data && ["SUBMITTED", "UNDER_EVALUATION", "EVALUATED", "EVALUATION_FAILED"].includes(submissionQuery.data.status)),
    retry: false,
  });

  const startSubmission = useMutation({
    mutationFn: () => submissionsApi.start(submissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["submission", submissionId] });
    },
  });

  const submission = submissionQuery.data;
  const expired = submission?.status === "EXPIRED";
  const isStartable = submission?.status === "CREATED";
  const isResumable = submission?.status === "IN_PROGRESS" && !expired;
  const insightCounts = useMemo(() => {
    const counts = { correct: 0, incorrect: 0, partially_correct: 0, skipped: 0 };
    for (const question of evaluationQuery.data?.questions ?? []) counts[question.status] += 1;
    return counts;
  }, [evaluationQuery.data]);
  const questions = useMemo(() => evaluationQuery.data?.questions ?? [], [evaluationQuery.data]);
  const currentQuestion = questions[currentQuestionIndex];
  const problemForAnalysis = currentQuestion;
  const questionSelectorStart = Math.floor(currentQuestionIndex / QUESTION_SELECTOR_PAGE_SIZE) * QUESTION_SELECTOR_PAGE_SIZE;
  const visibleQuestions = questions.slice(questionSelectorStart, questionSelectorStart + QUESTION_SELECTOR_PAGE_SIZE);
  const isNumericalQuestion = currentQuestion?.type === "numerical" || problemForAnalysis?.type === "numerical";
  const analysisOptionList = useMemo(
    () => analysisOptions(currentQuestion, problemForAnalysis),
    [currentQuestion, problemForAnalysis],
  );
  const analysisOptionsForDisplay = useMemo(() => {
    if (!isNumericalQuestion) return analysisOptionList;
    const selected = currentQuestion?.selected_options ?? [];
    return analysisOptionList.filter((option) => option.is_correct || selected.some((item) => sameOption(item, option)));
  }, [analysisOptionList, currentQuestion?.selected_options, isNumericalQuestion]);

  return (
    <AppShell>
      <PageTitle
        eyebrow="Submission"
        title={submission ? `Submission ${submission.id}` : "Submission details"}
        description="Review the submission status and continue or start the assessment attempt."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Submission information">
          {submissionQuery.isPending ? (
            <p className="text-sm text-[var(--muted)]">Loading submission...</p>
          ) : submissionQuery.error ? (
            <p className="text-sm text-[var(--danger)]">{submissionQuery.error.message}</p>
          ) : submission ? (
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Assessment Name" value={evaluationQuery.data?.assessment_title || submission.assessment_id} />
              <Info label="User Name" value={evaluationQuery.data?.user_name || submission.user_id} />
              <Info label="Total duration" value={formatDuration(evaluationQuery.data?.duration_seconds)} />
              <Info label="Time taken" value={formatDuration(timeTakenSeconds(submission.started_at, submission.submitted_at ?? (expired ? submission.expires_at : null)))} />
              <Info label="Started at" value={formatDateTime(submission.started_at)} />
              <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</p>
                <div className="mt-1"><StatusBadge value={expired ? "EXPIRED" : submission.status} /></div>
              </div>
            </div>
          ) : null}
          {submission && isStartable ? (
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <Button onClick={() => startSubmission.mutate()} disabled={startSubmission.isPending}>
                {startSubmission.isPending ? "Starting..." : "Start submission"}
              </Button>
              {startSubmission.error ? <p className="mt-2 text-sm text-[var(--danger)]">{startSubmission.error.message}</p> : null}
            </div>
          ) : null}
          {submission && isResumable ? (
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <Button onClick={() => router.push(`/exam?submissionId=${submission.id}`)}>Resume submission</Button>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Evaluation insights"
          action={submission ? <Link className="link text-sm" href={`/assessments/${submission.assessment_id}`}>Back to assessment</Link> : null}
        >
        {submission ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Info label="Score" value={`${evaluationQuery.data?.scored_marks ?? evaluationQuery.data?.score ?? "—"} / ${evaluationQuery.data?.total_marks ?? "—"}`} />
            <Info label="Problems" value={`${submission.problems?.length ?? 0}`} />
          </div>
        ) : null}
        {evaluationQuery.isPending ? (
          <p className="text-sm text-[var(--muted)]">Loading evaluation...</p>
        ) : !evaluationQuery.data ? (
          <p className="text-sm text-[var(--muted)]">Evaluation details will appear after this submission is evaluated.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <InsightCard label="Correct" value={insightCounts.correct} tone="green" />
              <InsightCard label="Partially correct" value={insightCounts.partially_correct} tone="yellow" />
              <InsightCard label="Incorrect" value={insightCounts.incorrect} tone="red" />
              <InsightCard label="Skipped" value={insightCounts.skipped} tone="blue" />
            </div>
          </>
        )}
        </Panel>
      </div>

      {evaluationQuery.data && currentQuestion ? (
        <Panel title="Question analysis" className="mt-4">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded border border-[var(--line)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-semibold">{currentQuestionIndex + 1}. {problemForAnalysis?.title || "Question"}</p>
                <div className="flex items-center gap-2"><StatusBadge value={currentQuestion.status} /><Badge>{currentQuestion.marks} marks</Badge></div>
              </div>
              <p className="mt-2 break-all text-xs text-[var(--muted)]">{currentQuestion.problem_id}</p>
              {problemForAnalysis?.statement ? <p className="mt-4 whitespace-pre-wrap leading-7 text-[var(--muted)]">{problemForAnalysis.statement}</p> : null}
              <div className="mt-5 grid gap-2">
                {analysisOptionsForDisplay.map((option, optionIndex) => {
                  const selected = currentQuestion.selected_options ?? [];
                  const isSelected = selected.some((item) => sameOption(item, option));
                  const optionStyle = option.is_correct
                    ? isSelected ? "border-green-800 bg-green-800 text-white" : "border-green-300 bg-green-50"
                    : isSelected ? "border-red-500 bg-red-50 text-red-800" : "border-[var(--line)] bg-white";
                  return (
                    <div key={`${currentQuestion.problem_id}-${option.id}-${option.text}-${optionIndex}`} className={`flex flex-wrap items-center justify-between gap-3 rounded border px-4 py-3 text-sm ${optionStyle}`}>
                      <span>{isNumericalQuestion ? null : <span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>}{option.text || "—"}</span>
                      <span className="text-xs font-semibold">{isNumericalQuestion
                        ? (option.is_correct ? "Correct answer" : "Your answer")
                        : option.is_correct
                          ? (isSelected
                            ? "Selected correct"
                            : currentQuestion.status === "skipped" ? "Correct answer · Skipped" : "Correct answer")
                          : isSelected
                            ? "Selected incorrect"
                            : currentQuestion.status === "skipped" ? "Skipped" : "Incorrect option"}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex justify-between gap-2">
                <Button variant="secondary" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((value) => value - 1)}>← Previous</Button>
                <Button disabled={currentQuestionIndex === questions.length - 1} onClick={() => setCurrentQuestionIndex((value) => value + 1)}>Next →</Button>
              </div>
            </div>
            <Panel title={`Questions ${questionSelectorStart + 1}-${Math.min(questionSelectorStart + QUESTION_SELECTOR_PAGE_SIZE, questions.length)} of ${questions.length}`}>
              <div className="grid grid-cols-4 gap-2">
                {visibleQuestions.map((question, pageIndex) => {
                  const index = questionSelectorStart + pageIndex;
                  return <button key={question.problem_id} type="button" onClick={() => setCurrentQuestionIndex(index)} className={`rounded border px-2 py-2 text-sm font-semibold ${index === currentQuestionIndex ? "border-[var(--accent)] bg-[var(--accent-weak)]" : question.status === "correct" ? "border-green-300 bg-green-50 text-green-900" : question.status === "partially_correct" ? "border-amber-300 bg-amber-50 text-amber-900" : question.status === "incorrect" ? "border-red-300 bg-red-50 text-red-900" : "border-slate-300 bg-slate-50 text-slate-700"}`}>{index + 1}</button>;
                })}
              </div>
              <div className="mt-4 flex justify-between gap-2 border-t border-[var(--line)] pt-3">
                <button
                  type="button"
                  className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous question selector page"
                  title="Previous questions"
                  disabled={questionSelectorStart === 0}
                  onClick={() => setCurrentQuestionIndex(questionSelectorStart - QUESTION_SELECTOR_PAGE_SIZE)}
                >
                  ←
                </button>
                <span className="self-center text-xs text-[var(--muted)]">
                  Page {Math.floor(questionSelectorStart / QUESTION_SELECTOR_PAGE_SIZE) + 1} of {Math.ceil(questions.length / QUESTION_SELECTOR_PAGE_SIZE)}
                </span>
                <button
                  type="button"
                  className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next question selector page"
                  title="Next questions"
                  disabled={questionSelectorStart + QUESTION_SELECTOR_PAGE_SIZE >= questions.length}
                  onClick={() => setCurrentQuestionIndex(questionSelectorStart + QUESTION_SELECTOR_PAGE_SIZE)}
                >
                  →
                </button>
              </div>
            </Panel>
          </div>
        </Panel>
      ) : null}
    </AppShell>
  );
}

function sameOption(left: { id?: string; text: string }, right: { id?: string; text: string }) {
  return (left.id && right.id && left.id === right.id) || left.text === right.text;
}

function analysisOptions(
  question: {
    options?: Array<{ id: string; text: string; is_correct: boolean }>;
    selected_options?: Array<{ id: string; text: string; is_correct: boolean }>;
  } | undefined,
  problem?: { options?: Array<{ id?: string; text: string; is_correct?: boolean }> },
) {
  if (!question) return [];
  const evaluatedOptions = question.options ?? [];
  if (!problem?.options?.length) return displayOptions(question);

  return problem.options.map((option) => {
    const evaluated = evaluatedOptions.find((item) => sameOption(item, option));
    return {
      ...option,
      id: option.id ?? evaluated?.id ?? "",
      is_correct: evaluated?.is_correct ?? option.is_correct ?? false,
    };
  });
}

function displayOptions(question: {
  options?: Array<{ id: string; text: string; is_correct: boolean }>;
  selected_options?: Array<{ id: string; text: string; is_correct: boolean }>;
}) {
  const options = question.options ?? [];
  const selected = question.selected_options ?? [];
  return [...options, ...selected.filter((item) => !options.some((option) => sameOption(option, item)))];
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-all font-medium">{value || "—"}</p>
    </div>
  );
}

function formatDuration(seconds?: number | null) {
  if (seconds === undefined || seconds === null || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function timeTakenSeconds(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const elapsed = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  return Number.isFinite(elapsed) ? Math.max(0, elapsed) : null;
}

function InsightCard({ label, value, tone }: { label: string; value: number; tone: "green" | "yellow" | "red" | "blue" }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white p-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-2xl font-bold">{value}</span><Badge tone={tone}>{label}</Badge></div>
    </div>
  );
}
