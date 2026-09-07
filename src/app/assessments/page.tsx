"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell, Button, EmptyState, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { assessmentsApi } from "@/lib/api/services";
import { mockAssessments } from "@/lib/mock-data";
import { formatDateTime, minutesFromSeconds } from "@/lib/utils";

export default function AssessmentsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("90");

  const assessmentsQuery = useQuery({
    queryKey: ["assessments"],
    queryFn: assessmentsApi.list,
  });

  const createAssessment = useMutation({
    mutationFn: assessmentsApi.create,
    onSuccess: () => {
      setTitle("");
      setDescription("");
    },
  });

  const assessments = Array.isArray(assessmentsQuery.data)
    ? assessmentsQuery.data
    : mockAssessments;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createAssessment.mutate({
      title,
      description,
      duration_seconds: Number(duration) * 60,
    });
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Assessments"
        title="Create and manage tests"
        description="A plain list-first workspace for assessment metadata, marking schemes, and problem attachment."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel title="Assessment list">
          {assessments.length === 0 ? (
            <EmptyState title="No assessments yet" description="Create one from the form on the right." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-left">
                    <th className="py-2 pr-4">Assessment</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr key={assessment.id} className="border-b border-[var(--line)] last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{assessment.title ?? assessment.name ?? assessment.id}</p>
                        <p className="text-xs text-[var(--muted)]">{assessment.description ?? "No description"}</p>
                      </td>
                      <td className="py-3 pr-4">{minutesFromSeconds(assessment.duration_seconds)}</td>
                      <td className="py-3 pr-4 text-[var(--muted)]">{formatDateTime(assessment.created_at)}</td>
                      <td className="py-3"><a className="link" href={`/generation?assessmentId=${assessment.id}`}>Generate</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="New assessment">
          <form onSubmit={onSubmit} className="grid gap-3">
            <Field label="Title">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Algebra test 01" required />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Linear equations and identities" />
            </Field>
            <Field label="Duration minutes">
              <input className={inputClass} type="number" value={duration} onChange={(event) => setDuration(event.target.value)} min={1} />
            </Field>
            <Button disabled={createAssessment.isPending}>{createAssessment.isPending ? "Creating..." : "Create assessment"}</Button>
            {createAssessment.error ? <p className="text-sm text-[var(--danger)]">Backend not reachable or request shape changed.</p> : null}
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
