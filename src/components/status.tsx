import { Badge } from "@/components/ui";

export function StatusBadge({ value }: { value: string }) {
  const lower = value.toLowerCase();
  const tone =
    lower.includes("complete") || lower.includes("evaluated") || lower.includes("correct")
      ? "green"
      : lower.includes("fail") || lower.includes("incorrect")
        ? "red"
        : lower.includes("progress") || lower.includes("processing") || lower.includes("partial")
          ? "yellow"
          : "blue";

  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}

export function DifficultyBadge({ value }: { value?: string | null }) {
  const difficulty = value?.toLowerCase();
  const tone = difficulty === "easy" ? "green" : difficulty === "hard" ? "red" : "yellow";
  return <Badge tone={value ? tone : "neutral"}>{value || "—"}</Badge>;
}
