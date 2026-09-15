"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AppShell, Button, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { assessmentsApi } from "@/lib/api/services";

export default function CreateAssessmentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("5400");
  const [createdBy, setCreatedBy] = useState("01a09427-5792-7192-a6b6-d1fce684767d");

  const createAssessment = useMutation({
    mutationFn: assessmentsApi.create,
    onSuccess: (data) => router.push(`/assessments/${data.assessment_id}`),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createAssessment.mutate({
      title,
      description,
      duration_seconds: Number(durationSeconds),
      created_by: createdBy,
    });
  }

  return (
    <AppShell>
      <PageTitle
        eyebrow="Assessments"
        title="Create assessment"
        description="Create assessment metadata first. Problems and generation can be attached after creation."
      />

      <div className="grid gap-4 lg:grid-cols-[560px_1fr]">
        <Panel title="Assessment details">
          <form onSubmit={onSubmit} className="grid gap-3">
            <Field label="Title">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Algebra test 01" required />
            </Field>
            <Field label="Description">
              <textarea className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Linear equations and identities" />
            </Field>
            <Field label="Duration seconds">
              <input className={inputClass} type="number" value={durationSeconds} onChange={(event) => setDurationSeconds(event.target.value)} min={1} required />
            </Field>
            <Field label="Created by user ID">
              <input className={inputClass} value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
            </Field>
            <div className="flex gap-2">
              <Button disabled={createAssessment.isPending}>{createAssessment.isPending ? "Creating..." : "Create assessment"}</Button>
              <Link href="/assessments"><Button type="button" variant="secondary">Cancel</Button></Link>
            </div>
            {createAssessment.error ? (
              <p className="text-sm text-[var(--danger)]">
                {createAssessment.error.message || "Could not create assessment. Check backend and required fields."}
              </p>
            ) : null}
          </form>
        </Panel>

        <Panel title="Next steps">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>Create the assessment.</li>
            <li>Add a marking scheme from backend/Bruno flow.</li>
            <li>Add manual problems or generate AI problems for this assessment.</li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}
