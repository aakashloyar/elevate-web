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
  assessment_id?: string;
  title: string;
  description?: string;
  duration_seconds?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
};

export type AssessmentListResponse = {
  assessments: Assessment[];
};

export type ProblemOption = {
  id?: string;
  text: string;
  is_correct?: boolean;
};

export type Problem = {
  id: string;
  problem_id?: string;
  created_by?: string;
  title?: string;
  statement?: string;
  type: ProblemType;
  difficulty: Difficulty;
  source_type?: SourceType;
  source?: string;
  sourceType?: string;
  topic_ids?: string[];
  topicIds?: string[];
  topics?: string[];
  options?: ProblemOption[];
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ProblemView = Problem & {
  draft_answer?: string[];
};

export type ProblemListResponse = {
  problems: Problem[];
};

export type SubmissionStatusResponse = {
  submission_id: string;
  status: SubmissionStatus;
  expires_at?: string | null;
};

export type CreateSubmissionResponse = {
  submission_id: string;
  created_at: string;
};

export type SaveAnswerBatchResponse = {
  saved_count: number;
  errors: Array<{
    problem_id: string;
    message: string;
  }>;
};

export type GenerationJob = {
  job_id?: string;
  id?: string;
  user_id?: string;
  single_correct_count?: number;
  multi_correct_count?: number;
  numerical_count?: number;
  document_id?: string | null;
  assessment_id?: string | null;
  level?: Difficulty;
  description?: string;
  status: GenerationStatus;
  topic_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

export type Evaluation = {
  submission_id: string;
  assessment_id?: string;
  user_id?: string;
  total_marks?: number;
  scored_marks?: number;
  score?: number;
  evaluated_at?: string;
  questions?: Array<{
    problem_id: string;
    type?: ProblemType;
    status: "correct" | "partially_correct" | "incorrect" | "skipped";
    marks: number;
    selected_options?: Array<{
      id: string;
      text: string;
      is_correct: boolean;
    }>;
  }>;
};
