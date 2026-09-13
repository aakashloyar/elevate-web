"use client";

import { FormEvent, Suspense, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { AppShell, Button, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status";
import { generationApi } from "@/lib/api/services";
import type { Difficulty } from "@/lib/api/types";

function GenerationContent() {
  const params = useSearchParams();
  const [assessmentId, setAssessmentId] = useState(params.get("assessmentId") ?? "f207db6a-c9bc-4743-96f3-56028ec6cfa2");
  const [userId, setUserId] = useState("019fd16d-8296-7039-949f-65044c31d28f");
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
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <Panel title="Generate problem set">
        <form onSubmit={onSubmit} className="grid gap-3">
          <Field label="Assessment ID">
            <input className={inputClass} value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} required />
          </Field>
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
            <textarea className={inputClass} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <Button disabled={createJob.isPending}>{createJob.isPending ? "Starting..." : "Start generation"}</Button>
        </form>
      </Panel>

      <Panel title="Job status">
        {jobId ? (
          <div className="space-y-3 text-sm">
            <p><span className="font-semibold">Job:</span> {jobId}</p>
            <p><span className="font-semibold">Status:</span> <StatusBadge value={jobQuery.data?.status ?? createJob.data?.status ?? "pending"} /></p>
            <p className="text-[var(--muted)]">The backend worker consumes the job, calls Gemini, publishes generated problems to problem service, then problem service forwards created IDs to assessment.</p>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Start a generation job to watch its status here.</p>
        )}
      </Panel>
    </div>
  );
}

export default function GenerationPage() {
  return (
    <AppShell>
      <PageTitle
        eyebrow="AI generation"
        title="Generate problems for an assessment"
        description="A small form for the current problem generation service. Counts are fixed for the first UI pass and can become editable next."
      />
      <Suspense>
        <GenerationContent />
      </Suspense>
    </AppShell>
  );
}
