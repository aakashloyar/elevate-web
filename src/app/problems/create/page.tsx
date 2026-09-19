"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AppShell, Button, Field, inputClass, Panel, PageTitle } from "@/components/ui";
import { problemsApi } from "@/lib/api/services";
import type { Difficulty, ProblemOption, ProblemType } from "@/lib/api/types";

const defaultOptions: ProblemOption[] = [
  { text: "Option A", is_correct: true },
  { text: "Option B", is_correct: false },
  { text: "Option C", is_correct: false },
  { text: "Option D", is_correct: false },
];

export default function CreateProblemPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [type, setType] = useState<ProblemType>("single");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [createdBy, setCreatedBy] = useState("019fd16d-8296-7039-949f-65044c31d28f");
  const [topics, setTopics] = useState("");
  const [options, setOptions] = useState<ProblemOption[]>(defaultOptions);

  const createProblem = useMutation({
    mutationFn: problemsApi.create,
    onSuccess: () => router.push("/problems"),
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
    createProblem.mutate({
      created_by: createdBy,
      title,
      statement,
      type,
      difficulty,
      source_type: "manual",
      options: options.filter((option) => option.text.trim()),
      tags: topics.split(",").map((topic) => topic.trim()).filter(Boolean),
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
    <AppShell>
      <PageTitle
        eyebrow="Problem bank"
        title="Create problem"
        description="Add a manual problem to the problem bank with its type, difficulty, and topics."
      />

      <div className="grid gap-4 lg:grid-cols-[560px_1fr]">
        <Panel title="Problem details">
          <form onSubmit={onSubmit} className="grid gap-3">
            <Field label="Title">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Binary search complexity" required />
            </Field>
            <Field label="Statement">
              <textarea className={inputClass} rows={6} value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="Write the question statement..." required />
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
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <input
                      className={inputClass}
                      value={option.text}
                      onChange={(event) => updateOption(index, { text: event.target.value })}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
                      <input type="checkbox" checked={Boolean(option.is_correct)} disabled={type === "numerical"} onChange={(event) => updateOption(index, { is_correct: event.target.checked })} />
                      Correct
                    </label>
                  </div>
                ))}
              </div>
            )}
            <Field label="Topics">
              <input className={inputClass} value={topics} onChange={(event) => setTopics(event.target.value)} placeholder="algorithms, arrays, binary-search" />
            </Field>
            <Field label="Created by user ID">
              <input className={inputClass} value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} required />
            </Field>
            <div className="flex gap-2">
              <Button disabled={createProblem.isPending || !optionsValid}>{createProblem.isPending ? "Creating..." : "Create problem"}</Button>
              <Link href="/problems"><Button type="button" variant="secondary">Cancel</Button></Link>
            </div>
            {createProblem.error ? <p className="text-sm text-[var(--danger)]">{createProblem.error.message || "Could not create problem."}</p> : null}
          </form>
        </Panel>

        <Panel title="Next steps">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>Create the problem.</li>
            <li>Review it from the problem bank.</li>
            <li>Attach it to an assessment when ready.</li>
          </ol>
        </Panel>
      </div>
    </AppShell>
  );
}
