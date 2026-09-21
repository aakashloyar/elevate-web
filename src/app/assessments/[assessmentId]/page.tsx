"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status";
import { AppShell, Badge, Button, EmptyState, Field, inputClass, Panel, PageTitle, TruncatedText } from "@/components/ui";
import { assessmentsApi, generationApi, problemsApi, submissionsApi } from "@/lib/api/services";
import type { Difficulty, Problem, ProblemOption, ProblemType } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const defaultOptions = [
  { text: "O(1)", is_correct: false },
  { text: "O(log n)", is_correct: true },
  { text: "O(n)", is_correct: false },
  { text: "O(n log n)", is_correct: false },
];
const PROBLEMS_BATCH_SIZE = 12;

export default function AssessmentDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params.assessmentId;
  const [currentAttachedProblemIndex, setCurrentAttachedProblemIndex] = useState(0);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionDuration, setSubmissionDuration] = useState("");
  const router = useRouter();

  const assessmentQuery = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId),
    enabled: Boolean(assessmentId),
  });

  const problemIdsQuery = useQuery({
    queryKey: ["assessment-problem-ids", assessmentId],
    queryFn: () => assessmentsApi.getProblems(assessmentId),
    enabled: Boolean(assessmentId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: 3,
  });

  const problemIds = Array.from(new Set(problemIdsQuery.data?.problem_ids ?? []))
    .filter((problemId) => problemId && problemId !== assessmentId);
  const problemsQuery = useInfiniteQuery({
    queryKey: ["assessment-problems", assessmentId, problemIds],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => problemsApi.batch(problemIds.slice(pageParam, pageParam + PROBLEMS_BATCH_SIZE), true),
    enabled: problemIds.length > 0,
    getNextPageParam: (_lastPage, pages) => {
      const nextOffset = pages.length * PROBLEMS_BATCH_SIZE;
      return nextOffset < problemIds.length ? nextOffset : undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const loadedProblems = problemsQuery.data?.pages.flat() ?? [];
  const attachedProblemsStart = Math.floor(currentAttachedProblemIndex / PROBLEMS_BATCH_SIZE) * PROBLEMS_BATCH_SIZE;
  const visibleProblems = loadedProblems.slice(attachedProblemsStart, attachedProblemsStart + PROBLEMS_BATCH_SIZE);
  const currentAttachedProblem = loadedProblems[currentAttachedProblemIndex];

  const assessment = assessmentQuery.data;
  const createSubmission = useMutation({
    mutationFn: () =>
      submissionsApi.create({
        assessment_id: assessmentId,
        user_id: assessment?.created_by,
        duration_seconds: Number(submissionDuration),
      }),
    onSuccess: (data) => router.push(`/submissions/${data.submission_id}`),
  });

  return (
    <AppShell>
      <PageTitle
        eyebrow="Assessment"
        title={assessment?.title ?? "Assessment detail"}
        description={assessment?.description || "Review this assessment and attach manual or AI-generated problems."}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
        <Panel
          title="Assessment info"
          action={<Link className="link" href="/assessments">Back to assessments</Link>}
        >
            {assessmentQuery.isLoading ? (
              <p className="text-sm text-[var(--muted)]">Loading assessment...</p>
            ) : assessmentQuery.error ? (
              <p className="text-sm text-[var(--danger)]">{assessmentQuery.error.message}</p>
            ) : assessment ? (
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <Info label="Assessment ID" value={assessment.id} />
                <Info label="Duration" value={`${assessment.duration_seconds ?? 0} seconds`} />
                <Info label="Created by" value={assessment.created_by || "—"} />
                <Info
                  label="Problems"
                  value={
                    problemIdsQuery.isSuccess
                      ? `${problemIds.length}`
                      : problemIdsQuery.error
                        ? "—"
                        : "Loading..."
                  }
                />
                <Info label="Created at" value={formatDateTime(assessment.created_at)} />
                <Info label="Updated at" value={formatDateTime(assessment.updated_at)} />
              </div>
            ) : null}
        </Panel>

          <Panel title={problemIds.length > 0 ? `Attached problems ${currentAttachedProblemIndex + 1} of ${problemIds.length}` : "Attached problems"}>
            {problemIdsQuery.isPending || problemsQuery.isPending ? (
              <p className="text-sm text-[var(--muted)]">Loading problems...</p>
            ) : problemIdsQuery.error || problemsQuery.error ? (
              <p className="text-sm text-[var(--danger)]">{problemIdsQuery.error?.message ?? problemsQuery.error?.message}</p>
            ) : problemIds.length === 0 ? (
              <EmptyState title="No problems attached" description="Use the Add problem button to create and attach a problem to this assessment." />
            ) : (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                <div className="min-w-0">
                  {currentAttachedProblem ? <AttachedProblemCard problem={currentAttachedProblem} /> : null}
                  {currentAttachedProblem ? (
                    <div className="mt-4 flex justify-between gap-2">
                      <Button
                        variant="secondary"
                        disabled={currentAttachedProblemIndex === 0}
                        onClick={() => setCurrentAttachedProblemIndex((index) => index - 1)}
                      >
                        ← Previous
                      </Button>
                      <Button
                        disabled={currentAttachedProblemIndex === problemIds.length - 1 || problemsQuery.isFetchingNextPage}
                        onClick={async () => {
                          const nextIndex = currentAttachedProblemIndex + 1;
                          if (nextIndex >= loadedProblems.length && problemsQuery.hasNextPage) {
                            await problemsQuery.fetchNextPage();
                          }
                          setCurrentAttachedProblemIndex(nextIndex);
                        }}
                      >
                        {problemsQuery.isFetchingNextPage ? "Loading..." : "Next →"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {problemIds.length > 0 && visibleProblems.length > 0 ? (
                  <aside className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Questions</h3>
                      <span className="text-xs text-[var(--muted)]">{problemIds.length}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {visibleProblems.map((problem, pageIndex) => {
                        const index = attachedProblemsStart + pageIndex;
                        return (
                          <button
                            key={problem.id || problem.problem_id || `problem-selector-${index}`}
                            type="button"
                            onClick={() => setCurrentAttachedProblemIndex(index)}
                            className={`rounded border px-2 py-2 text-sm font-semibold ${index === currentAttachedProblemIndex ? "border-[var(--accent)] bg-[var(--accent-weak)]" : "border-[var(--line)] bg-white"}`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                    {problemIds.length > PROBLEMS_BATCH_SIZE ? (
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
                        <button
                          type="button"
                          className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Previous attached problems"
                          title="Previous problems"
                          disabled={attachedProblemsStart === 0}
                          onClick={() => setCurrentAttachedProblemIndex(attachedProblemsStart - PROBLEMS_BATCH_SIZE)}
                        >←</button>
                        <span className="text-center text-xs text-[var(--muted)]">
                          Page {Math.floor(attachedProblemsStart / PROBLEMS_BATCH_SIZE) + 1} of {Math.ceil(problemIds.length / PROBLEMS_BATCH_SIZE)}
                        </span>
                        <button
                          type="button"
                          className="rounded border border-[var(--line)] bg-white px-3 py-1 text-lg leading-none disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Next attached problems"
                          title="Next problems"
                          disabled={attachedProblemsStart + PROBLEMS_BATCH_SIZE >= problemIds.length || problemsQuery.isFetchingNextPage}
                          onClick={async () => {
                            if (attachedProblemsStart + PROBLEMS_BATCH_SIZE >= problemIds.length) return;
                            if (attachedProblemsStart + PROBLEMS_BATCH_SIZE >= loadedProblems.length && problemsQuery.hasNextPage) {
                              await problemsQuery.fetchNextPage();
                            }
                            setCurrentAttachedProblemIndex(attachedProblemsStart + PROBLEMS_BATCH_SIZE);
                          }}
                        >→</button>
                      </div>
                    ) : null}
                  </aside>
                ) : null}
              </div>
            )}
          </Panel>
        </div>

          <div className="grid content-start gap-4">
            <Panel title="Add problem">
              <p className="text-sm leading-6 text-[var(--muted)]">Choose how you want to add a problem to this assessment.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link href={`/problems/create?assessmentId=${assessmentId}`}>
                  <Button className="w-full">Add manually</Button>
                </Link>
                <Link href={`/generation?assessmentId=${assessmentId}`}>
                  <Button className="w-full">Generate with AI</Button>
                </Link>
              </div>
            </Panel>
            <Panel title="Submission">
              <p className="text-sm leading-6 text-[var(--muted)]">
                Create an attempt for this assessment and start it when you are ready.
              </p>
              <Button
                className="mt-3 w-full"
                disabled={createSubmission.isPending || !assessment?.created_by || !assessment?.duration_seconds}
                onClick={() => {
                  setSubmissionDuration(String(assessment?.duration_seconds ?? ""));
                  setSubmissionDialogOpen(true);
                }}
              >
                {createSubmission.isPending ? "Creating submission..." : "Create submission"}
              </Button>
              {createSubmission.error ? <p className="mt-2 text-sm text-[var(--danger)]">{createSubmission.error.message}</p> : null}
            </Panel>
          </div>
      </div>

      {submissionDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
          <div className="w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--paper)] p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="submission-duration-title">
            <h2 id="submission-duration-title" className="text-lg font-semibold">Choose submission duration</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              The assessment default is pre-filled. You can adjust it for this submission.
            </p>
            <label className="mt-4 grid gap-1 text-sm font-medium">
              Duration in seconds
              <input
                className={inputClass}
                type="number"
                min={1}
                step={1}
                value={submissionDuration}
                onChange={(event) => setSubmissionDuration(event.target.value)}
                autoFocus
              />
            </label>
            {createSubmission.error ? <p className="mt-2 text-sm text-[var(--danger)]">{createSubmission.error.message}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setSubmissionDialogOpen(false)} disabled={createSubmission.isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createSubmission.isPending || Number(submissionDuration) <= 0}
                onClick={() => createSubmission.mutate()}
              >
                {createSubmission.isPending ? "Creating..." : "Create submission"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <TruncatedText className="mt-1 font-medium">{value}</TruncatedText>
    </div>
  );
}

function AttachedProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{problem.title || problem.id}</h3>
        <div className="flex items-center gap-2">
          <Badge tone="blue">{problem.type}</Badge>
          <Badge>{problem.difficulty}</Badge>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">{problem.statement || "No statement"}</p>
      {problem.options?.length ? (
        <div className="mt-5 grid gap-2">
          {problem.options.map((option, index) => (
            <div key={`${option.id ?? option.text}-${index}`} className="rounded border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm">
              <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>{option.text || "—"}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ManualProblemCard({
  assessmentId,
  createdBy,
  onAdded,
}: {
  assessmentId: string;
  createdBy?: string;
  onAdded: () => void;
}) {
  const [creatorId, setCreatorId] = useState(createdBy || "019fd16d-8296-7039-949f-65044c31d28f");
  const [title, setTitle] = useState("What is the time complexity of binary search?");
  const [statement, setStatement] = useState("Given a sorted array of n elements, what is the time complexity of searching for an element using binary search?");
  const [type, setType] = useState<ProblemType>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("algorithms, binary-search, time-complexity");
  const [options, setOptions] = useState<ProblemOption[]>(defaultOptions);

  const addProblem = useMutation({
    mutationFn: (body: Record<string, unknown>) => assessmentsApi.addProblem(assessmentId, body),
    onSuccess: () => onAdded(),
  });

  const validOptions = options.filter((option) => option.text.trim());
  const correctOptionCount = validOptions.filter((option) => option.is_correct).length;
  const optionsValid = type === "single"
    ? correctOptionCount === 1
    : type === "multiple"
      ? correctOptionCount > 0
      : validOptions.length === 1 && Boolean(validOptions[0].is_correct);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    addProblem.mutate({
      created_by: creatorId,
      title,
      statement,
      type,
      difficulty,
      source_type: "manual",
      options: options.filter((option) => option.text.trim()),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  }

  function updateOption(index: number, patch: Partial<ProblemOption>) {
    setOptions((current) => current.map((option, optionIndex) => {
      if (type === "single" && patch.is_correct && optionIndex !== index) {
        return { ...option, is_correct: false };
      }
      return optionIndex === index ? { ...option, ...patch } : option;
    }));
  }

  function onTypeChange(nextType: ProblemType) {
    setType(nextType);
    if (nextType === "numerical") {
      setOptions((current) => current.map((option, index) => ({ ...option, is_correct: index === 0 })));
    }
  }

  return (
    <Panel title="Add one manual problem">
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="Created by user ID">
          <input className={inputClass} value={creatorId} onChange={(event) => setCreatorId(event.target.value)} required />
        </Field>
        <Field label="Title">
          <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} required />
        </Field>
        <Field label="Statement">
          <textarea className={inputClass} rows={4} value={statement} onChange={(event) => setStatement(event.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(event) => onTypeChange(event.target.value as ProblemType)}>
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
        </div>
        {(
          <div className="grid gap-2">
            <p className="text-sm font-medium text-neutral-800">Options</p>
            {(type === "numerical" ? options.slice(0, 1) : options).map((option, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] items-center gap-2">
                <input className={inputClass} value={option.text} onChange={(event) => updateOption(index, { text: event.target.value })} />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={Boolean(option.is_correct)} disabled={type === "numerical"} onChange={(event) => updateOption(index, { is_correct: event.target.checked })} />
                  Correct
                </label>
              </div>
            ))}
          </div>
        )}
        <Field label="Tags">
          <input className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="algorithms, arrays" />
        </Field>
        <Button disabled={addProblem.isPending || !optionsValid}>{addProblem.isPending ? "Adding..." : "Add problem to assessment"}</Button>
        {addProblem.data ? <p className="text-sm text-[var(--muted)]">Added problem {addProblem.data.problem_id}</p> : null}
        {addProblem.error ? <p className="text-sm text-[var(--danger)]">{addProblem.error.message}</p> : null}
      </form>
    </Panel>
  );
}

function AiGenerationCard({
  assessmentId,
  createdBy,
  onCompleted,
}: {
  assessmentId: string;
  createdBy?: string;
  onCompleted: () => void;
}) {
  const [userId, setUserId] = useState(createdBy || "019fd16d-8296-7039-949f-65044c31d28f");
  const [level, setLevel] = useState<Difficulty>("medium");
  const [description, setDescription] = useState("Generate NCERT-style conceptual questions.");
  const [singleCount, setSingleCount] = useState("5");
  const [multiCount, setMultiCount] = useState("3");
  const [numericalCount, setNumericalCount] = useState("2");
  const [topicIds, setTopicIds] = useState("binary-search, arrays");
  const [jobId, setJobId] = useState("");
  const completedJobId = useRef("");

  const createJob = useMutation({
    mutationFn: generationApi.createJob,
    onSuccess: (data) => setJobId(data.job_id),
  });

  const jobQuery = useQuery({
    queryKey: ["generation-job", jobId],
    queryFn: () => generationApi.getJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval: jobId ? 3000 : false,
  });

  useEffect(() => {
    if (jobId && jobQuery.data?.status === "completed" && completedJobId.current !== jobId) {
      completedJobId.current = jobId;
      onCompleted();
    }
  }, [jobId, jobQuery.data?.status, multiCount, numericalCount, onCompleted, singleCount]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createJob.mutate({
      user_id: userId,
      assessment_id: assessmentId,
      document_id: null,
      single_correct_count: Number(singleCount),
      multi_correct_count: Number(multiCount),
      numerical_count: Number(numericalCount),
      level,
      description,
      topic_ids: topicIds.split(",").map((topic) => topic.trim()).filter(Boolean),
    });
  }

  return (
    <Panel title="Generate problems with AI">
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="User ID">
          <input className={inputClass} value={userId} onChange={(event) => setUserId(event.target.value)} required />
        </Field>
        <Field label="Level">
          <select className={inputClass} value={level} onChange={(event) => setLevel(event.target.value as Difficulty)}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Single">
            <input className={inputClass} type="number" min={0} value={singleCount} onChange={(event) => setSingleCount(event.target.value)} />
          </Field>
          <Field label="Multi">
            <input className={inputClass} type="number" min={0} value={multiCount} onChange={(event) => setMultiCount(event.target.value)} />
          </Field>
          <Field label="Numerical">
            <input className={inputClass} type="number" min={0} value={numericalCount} onChange={(event) => setNumericalCount(event.target.value)} />
          </Field>
        </div>
        <Field label="Topic IDs">
          <input className={inputClass} value={topicIds} onChange={(event) => setTopicIds(event.target.value)} placeholder="binary-search, arrays" />
        </Field>
        <Field label="Description">
          <textarea className={inputClass} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Button disabled={createJob.isPending}>{createJob.isPending ? "Starting..." : "Start AI generation"}</Button>
        {jobId ? (
          <div className="rounded border border-[var(--line)] bg-white p-3 text-sm">
            <p><span className="font-semibold">Job:</span> {jobId}</p>
            <p className="mt-2"><span className="font-semibold">Status:</span> <StatusBadge value={jobQuery.data?.status ?? createJob.data?.status ?? "pending"} /></p>
          </div>
        ) : null}
        {createJob.error ? <p className="text-sm text-[var(--danger)]">{createJob.error.message}</p> : null}
      </form>
    </Panel>
  );
}
