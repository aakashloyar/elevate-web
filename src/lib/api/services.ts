import { serviceUrls } from "@/lib/api/config";
import { request } from "@/lib/api/http";
import type {
  Assessment,
  Evaluation,
  GenerationJob,
  Problem,
  ProblemView,
  SubmissionStatusResponse,
} from "@/lib/api/types";

export const assessmentsApi = {
  list: () => request<Assessment[]>(serviceUrls.assessment, "/assessments"),
  get: (id: string) => request<Assessment>(serviceUrls.assessment, `/assessment/${id}`),
  create: (body: Record<string, unknown>) =>
    request<Assessment>(serviceUrls.assessment, "/assessment", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const problemsApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    request<{ problems?: Problem[] } | Problem[]>(serviceUrls.problem, "/problem", { query }),
  create: (body: Record<string, unknown>) =>
    request<{ problem_id: string }>(serviceUrls.problem, "/problem", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const submissionsApi = {
  status: (id: string) =>
    request<SubmissionStatusResponse>(serviceUrls.submission, `/submissions/${id}/status`),
  create: (body: Record<string, unknown>) =>
    request<{ submission_id: string }>(serviceUrls.submission, "/submission", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  saveAnswer: (submissionId: string, body: Record<string, unknown>) =>
    request<unknown>(serviceUrls.submission, `/submission/${submissionId}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const runnerApi = {
  getAttemptProblems: (attemptId: string, offset = 0, limit = 10) =>
    request<{ problems: ProblemView[] } | ProblemView[]>(
      serviceUrls.runner,
      `/attempts/${attemptId}/problems`,
      { query: { offset, limit } },
    ),
};

export const generationApi = {
  createJob: (body: Record<string, unknown>) =>
    request<{ job_id: string; status: GenerationJob["status"] }>(
      serviceUrls.generation,
      "/generation-jobs",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  getJob: (jobId: string) =>
    request<GenerationJob>(serviceUrls.generation, `/generation-jobs/${jobId}`),
};

export const evaluationApi = {
  getBySubmission: (submissionId: string) =>
    request<Evaluation>(serviceUrls.evaluation, `/evaluations/${submissionId}`),
};
