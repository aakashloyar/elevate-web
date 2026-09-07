import type { Assessment, Evaluation, Problem, ProblemView } from "@/lib/api/types";

export const mockAssessments: Assessment[] = [
  {
    id: "A101",
    title: "Number Theory Foundation",
    description: "Divisibility, gcd, lcm, modular arithmetic",
    duration_seconds: 5400,
    created_at: "2026-08-16T10:00:00Z",
  },
  {
    id: "A102",
    title: "Graph Practice Set",
    description: "BFS, DFS, shortest path basics",
    duration_seconds: 7200,
    created_at: "2026-08-17T10:00:00Z",
  },
];

export const mockProblems: Problem[] = [
  {
    id: "P1001",
    title: "Counting Divisors",
    statement: "How many positive divisors does 72 have?",
    type: "single",
    difficulty: "easy",
    source_type: "manual",
    options: [
      { id: "A", text: "10", is_correct: false },
      { id: "B", text: "12", is_correct: true },
      { id: "C", text: "14", is_correct: false },
      { id: "D", text: "16", is_correct: false },
    ],
    tags: ["math", "number-theory"],
  },
  {
    id: "P1002",
    title: "Connected Components",
    statement: "Select the statements that are true for DFS in an undirected graph.",
    type: "multiple",
    difficulty: "medium",
    source_type: "ai",
    options: [
      { id: "A", text: "DFS can find connected components.", is_correct: true },
      { id: "B", text: "DFS always gives shortest paths.", is_correct: false },
      { id: "C", text: "DFS can detect cycles.", is_correct: true },
    ],
    tags: ["graphs"],
  },
];

export const mockAttemptProblems: ProblemView[] = mockProblems.map((problem, index) => ({
  ...problem,
  draft_answer: index === 0 ? ["B"] : [],
}));

export const mockEvaluation: Evaluation = {
  submission_id: "S123",
  total_marks: 40,
  scored_marks: 31,
  questions: [
    { problem_id: "P1001", status: "correct", marks: 4 },
    { problem_id: "P1002", status: "partially_correct", marks: 2.67 },
    { problem_id: "P1003", status: "incorrect", marks: -1 },
  ],
};
