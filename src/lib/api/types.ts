export type ProblemType = "single" | "multiple" | "numerical";
export type Difficulty = "easy" | "medium" | "hard";
export type SourceType = "manual" | "ai";
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";
export type SubmissionStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_EVALUATION"
  | "EVALUATED"
  | "EVALUATION_FAILED"
  | "EXPIRED";

export type Assessment = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  duration_seconds?: number;
  created_at?: string;
};

export type ProblemOption = {
  id?: string;
  text: string;
  is_correct?: boolean;
};

export type Problem = {
  id: string;
  title?: string;
  statement: string;
  type: ProblemType;
  difficulty: Difficulty;
  source_type: SourceType;
  options?: ProblemOption[];
  tags?: string[];
};

export type ProblemView = Problem & {
  draft_answer?: string[];
};

export type SubmissionStatusResponse = {
  submission_id: string;
  status: SubmissionStatus;
  expires_at?: string | null;
};

export type GenerationJob = {
  job_id?: string;
  id?: string;
  status: GenerationStatus;
  created_at?: string;
  updated_at?: string;
};

export type Evaluation = {
  submission_id: string;
  total_marks?: number;
  scored_marks?: number;
  questions?: Array<{
    problem_id: string;
    status: "correct" | "partially_correct" | "incorrect" | "skipped";
    marks: number;
  }>;
};
