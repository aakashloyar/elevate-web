import { serviceUrls } from "@/lib/api/config";
import { request } from "@/lib/api/http";
import type {
  Assessment,
  AssessmentListResponse,
  CreateSubmissionResponse,
  Evaluation,
  GenerationJob,
  Problem,
  ProblemListResponse,
  ProblemView,
  SaveAnswerBatchResponse,
  SubmissionStatusResponse,
} from "@/lib/api/types";

export const assessmentsApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    request<AssessmentListResponse>(serviceUrls.assessment, "/assessments", { query }),
  get: (id: string) => request<Assessment>(serviceUrls.assessment, `/assessments/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{ assessment_id: string }>(serviceUrls.assessment, "/assessments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addProblem: (assessmentId: string, body: Record<string, unknown>) =>
    request<{ problem_id: string }>(serviceUrls.assessment, `/assessments/${assessmentId}/add-problem`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getProblems: (assessmentId: string) =>
    request<{ problem_ids: string[] }>(serviceUrls.assessment, `/assessments/${assessmentId}/problems`),
};

export const problemsApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    request<ProblemListResponse>(serviceUrls.problem, "/problems", { query }),
  get: (id: string) => request<Problem>(serviceUrls.problem, `/problems/${id}`),
  create: (body: Record<string, unknown>) =>
    request<{ problem_id: string }>(serviceUrls.problem, "/problems", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  batch: (problemIds: string[]) =>
    request<Array<{ problem_id: string; problem_type: Problem["type"]; options: Array<{ id: string; text: string }> }>>(
      serviceUrls.problem,
      "/problems/batch",
      {
        method: "POST",
        body: JSON.stringify({ problem_ids: problemIds }),
      },
    ),
};

export const submissionsApi = {
  get: (id: string) => request<unknown>(serviceUrls.submission, `/submissions/${id}`),
  status: (id: string) =>
    request<SubmissionStatusResponse>(serviceUrls.submission, `/submissions/${id}/status`),
  create: (body: Record<string, unknown>) =>
    request<CreateSubmissionResponse>(serviceUrls.submission, "/submissions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  saveAnswer: (submissionId: string, body: Record<string, unknown>) =>
    request<void>(serviceUrls.submission, `/submissions/${submissionId}/save`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  saveAnswerBatch: (submissionId: string, answers: Array<{ problem_id: string; answer: string[] }>) =>
    request<SaveAnswerBatchResponse>(serviceUrls.submission, `/submissions/${submissionId}/save/batch`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  start: (submissionId: string) =>
    request<void>(serviceUrls.submission, `/submissions/${submissionId}/start`, {
      method: "POST",
    }),
  submit: (submissionId: string) =>
    request<void>(serviceUrls.submission, `/submissions/${submissionId}/submit`, {
      method: "POST",
    }),
  updateStatus: (submissionId: string, status: SubmissionStatusResponse["status"]) =>
    request<{ submission_id: string; status: SubmissionStatusResponse["status"] }>(
      serviceUrls.submission,
      `/submissions/${submissionId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    ),
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
