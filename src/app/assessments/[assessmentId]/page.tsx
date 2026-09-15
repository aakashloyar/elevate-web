"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status";
import { AppShell, Badge, Button, EmptyState, Field, inputClass, Panel, PageTitle, TruncatedText } from "@/components/ui";
import { assessmentsApi, generationApi, problemsApi } from "@/lib/api/services";
import type { Difficulty, Problem, ProblemOption, ProblemType } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils";

const defaultOptions = [
  { text: "O(1)", is_correct: false },
  { text: "O(log n)", is_correct: true },
  { text: "O(n)", is_correct: false },
  { text: "O(n log n)", is_correct: false },
];

export default function AssessmentDetailPage() {
  const params = useParams<{ assessmentId: string }>();
  const assessmentId = params.assessmentId;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  const assessmentQuery = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: () => assessmentsApi.get(assessmentId),
    enabled: Boolean(assessmentId),
  });

  const problemIdsQuery = useQuery({
    queryKey: ["assessment-problem-ids", assessmentId],
    queryFn: () => assessmentsApi.getProblems(assessmentId),
    enabled: Boolean(assessmentId),
  });

  const problemIds = useMemo(() => problemIdsQuery.data?.problem_ids ?? [], [problemIdsQuery.data?.problem_ids]);

  const problemsQuery = useQuery({
    queryKey: ["assessment-problems", problemIds],
    queryFn: () => Promise.all(problemIds.map((problemId) => problemsApi.get(problemId))),
    enabled: problemIds.length > 0,
  });

  const refreshProblems = () => {
    queryClient.invalidateQueries({ queryKey: ["assessment-problem-ids", assessmentId] });
    queryClient.invalidateQueries({ queryKey: ["assessment-problems"] });
  };

  const assessment = assessmentQuery.data;

  return (
    <AppShell>
      <PageTitle
        eyebrow="Assessment"
        title={assessment?.title ?? "Assessment detail"}
        description={assessment?.description || "Review this assessment and attach manual or AI-generated problems."}
      />

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
                <Info label="Problems" value={`${problemIds.length}`} />
                <Info label="Created at" value={formatDateTime(assessment.created_at)} />
                <Info label="Updated at" value={formatDateTime(assessment.updated_at)} />
              </div>
            ) : null}
        </Panel>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Panel title="Attached problems">
            {problemIdsQuery.isLoading || problemsQuery.isLoading ? (
              <p className="text-sm text-[var(--muted)]">Loading problems...</p>
            ) : problemIds.length === 0 ? (
              <EmptyState title="No problems attached" description="Use manual add or AI generation to add problems to this assessment." />
            ) : (
              <div className="grid gap-3">
                {(problemsQuery.data ?? []).map((problem) => (
                  <ProblemRow key={problem.id} problem={problem} />
                ))}
              </div>
            )}
          </Panel>

          <div className="grid content-start gap-4">
            <Panel title="Add problems">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={mode === "manual" ? "primary" : "secondary"} onClick={() => setMode("manual")}>
                  Manual
                </Button>
                <Button type="button" variant={mode === "ai" ? "primary" : "secondary"} onClick={() => setMode("ai")}>
                  AI generation
                </Button>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Manual adds one ready problem immediately. AI creates a generation job linked to this assessment.
              </p>
            </Panel>

            {mode === "manual" ? (
              <ManualProblemCard
                key={`manual-${assessment?.created_by ?? "loading"}`}
                assessmentId={assessmentId}
                createdBy={assessment?.created_by}
                onAdded={refreshProblems}
              />
            ) : (
              <AiGenerationCard
                key={`ai-${assessment?.created_by ?? "loading"}`}
                assessmentId={assessmentId}
                createdBy={assessment?.created_by}
              />
            )}
          </div>
        </div>
      </div>
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

function ProblemRow({ problem }: { problem: Problem }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
            <TruncatedText className="font-semibold">{problem.title || problem.id}</TruncatedText>
            <TruncatedText className="mt-1 text-sm text-[var(--muted)]" lines={2}>{problem.statement || "No statement"}</TruncatedText>
        </div>
        <div className="flex gap-2">
          <Badge tone="blue">{problem.type}</Badge>
          <Badge>{problem.difficulty}</Badge>
        </div>
      </div>
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

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    addProblem.mutate({
      created_by: creatorId,
      title,
      statement,
      type,
      difficulty,
      source_type: "manual",
      options: type === "numerical" ? [] : options.filter((option) => option.text.trim()),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
  }

  function updateOption(index: number, patch: Partial<ProblemOption>) {
    setOptions((current) => current.map((option, optionIndex) => (optionIndex === index ? { ...option, ...patch } : option)));
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
        </div>
        {type !== "numerical" ? (
          <div className="grid gap-2">
            <p className="text-sm font-medium text-neutral-800">Options</p>
            {options.map((option, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] items-center gap-2">
                <input className={inputClass} value={option.text} onChange={(event) => updateOption(index, { text: event.target.value })} />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(option.is_correct)} onChange={(event) => updateOption(index, { is_correct: event.target.checked })} />
                  Correct
                </label>
              </div>
            ))}
          </div>
        ) : null}
        <Field label="Tags">
          <input className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="algorithms, arrays" />
        </Field>
        <Button disabled={addProblem.isPending}>{addProblem.isPending ? "Adding..." : "Add problem to assessment"}</Button>
        {addProblem.data ? <p className="text-sm text-[var(--muted)]">Added problem {addProblem.data.problem_id}</p> : null}
        {addProblem.error ? <p className="text-sm text-[var(--danger)]">{addProblem.error.message}</p> : null}
      </form>
    </Panel>
  );
}

function AiGenerationCard({ assessmentId, createdBy }: { assessmentId: string; createdBy?: string }) {
  const [userId, setUserId] = useState(createdBy || "019fd16d-8296-7039-949f-65044c31d28f");
  const [level, setLevel] = useState<Difficulty>("medium");
  const [description, setDescription] = useState("Generate NCERT-style conceptual questions.");
  const [singleCount, setSingleCount] = useState("5");
  const [multiCount, setMultiCount] = useState("3");
  const [numericalCount, setNumericalCount] = useState("2");
  const [topicIds, setTopicIds] = useState("binary-search, arrays");
  const [jobId, setJobId] = useState("");

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
