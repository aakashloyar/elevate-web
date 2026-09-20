"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status";
import { AppShell, Button, Panel, PageTitle } from "@/components/ui";
import { submissionsApi } from "@/lib/api/services";
import { formatDateTime } from "@/lib/utils";

export default function SubmissionDetailPage() {
  const params = useParams<{ submissionId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const submissionId = params.submissionId;

  const submissionQuery = useQuery({
    queryKey: ["submission", submissionId],
    queryFn: () => submissionsApi.get(submissionId),
    enabled: Boolean(submissionId),
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
  const isFinished = Boolean(
    submission && ["SUBMITTED", "UNDER_EVALUATION", "EVALUATED", "EVALUATION_FAILED"].includes(submission.status),
  );

  return (
    <AppShell>
      <PageTitle
        eyebrow="Submission"
        title={submission ? `Submission ${submission.id}` : "Submission details"}
        description="Review the submission status and continue or start the assessment attempt."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Submission information">
          {submissionQuery.isPending ? (
            <p className="text-sm text-[var(--muted)]">Loading submission...</p>
          ) : submissionQuery.error ? (
            <p className="text-sm text-[var(--danger)]">{submissionQuery.error.message}</p>
          ) : submission ? (
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <Info label="Submission ID" value={submission.id} />
              <Info label="Assessment ID" value={submission.assessment_id} />
              <Info label="User ID" value={submission.user_id} />
              <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Status</p>
                <div className="mt-1"><StatusBadge value={expired ? "EXPIRED" : submission.status} /></div>
              </div>
              <Info label="Started at" value={formatDateTime(submission.started_at)} />
              <Info label="Expires at" value={formatDateTime(submission.expires_at)} />
              <Info label="Created at" value={formatDateTime(submission.created_at)} />
              <Info label="Problems" value={`${submission.problems?.length ?? 0}`} />
            </div>
          ) : null}
        </Panel>

        <Panel title="Next action">
          {!submission ? null : isStartable ? (
            <>
              <p className="text-sm leading-6 text-[var(--muted)]">This submission has not started yet.</p>
              <Button className="mt-3 w-full" onClick={() => startSubmission.mutate()} disabled={startSubmission.isPending}>
                {startSubmission.isPending ? "Starting..." : "Start submission"}
              </Button>
            </>
          ) : isResumable ? (
            <>
              <p className="text-sm leading-6 text-[var(--muted)]">This submission is in progress.</p>
              <Button className="mt-3 w-full" onClick={() => router.push(`/exam?submissionId=${submission.id}`)}>
                Resume submission
              </Button>
            </>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              {expired ? "This submission has expired." : isFinished ? "This submission has been submitted." : `Current status: ${submission.status}.`}
            </p>
          )}
          {startSubmission.error ? <p className="mt-2 text-sm text-[var(--danger)]">{startSubmission.error.message}</p> : null}
          {submission ? <Link className="link mt-4 inline-block" href={`/assessments/${submission.assessment_id}`}>Back to assessment</Link> : null}
        </Panel>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 break-all font-medium">{value || "—"}</p>
    </div>
  );
}
