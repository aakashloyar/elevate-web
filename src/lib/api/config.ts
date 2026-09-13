export const serviceUrls = {
  user: process.env.NEXT_PUBLIC_USER_SERVICE_URL ?? "http://localhost:8081",
  assessment: process.env.NEXT_PUBLIC_ASSESSMENT_SERVICE_URL ?? "http://localhost:8082",
  problem: process.env.NEXT_PUBLIC_PROBLEM_SERVICE_URL ?? "http://localhost:8083",
  submission: process.env.NEXT_PUBLIC_SUBMISSION_SERVICE_URL ?? "http://localhost:8084",
  evaluation: process.env.NEXT_PUBLIC_EVALUATION_SERVICE_URL ?? "http://localhost:8085",
  runner: process.env.NEXT_PUBLIC_ASSESSMENT_RUNNER_SERVICE_URL ?? "http://localhost:8086",
  generation:
    process.env.NEXT_PUBLIC_PROBLEM_GENERATION_SERVICE_URL ?? "http://localhost:8087",
};
