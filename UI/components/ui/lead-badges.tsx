import { titleCase } from "@/lib/utils";
export function StatusBadge({ state }: { state: string }) {
  const value = state.toLowerCase();
  const safe = ["new", "contacted", "qualified", "converted", "lost"].includes(value) ? value : "unknown";
  return <span className={`badge status-${safe}`}><span className="small-dot" />{titleCase(state)}</span>;
}
export function PriorityBadge({ priority }: { priority: string | null }) {
  return priority ? <span className={`badge priority-${priority}`}><span className="priority-bars">{priority === "high" ? "▂▅█" : priority === "medium" ? "▂▅" : "▂"}</span>{titleCase(priority)}</span> : <span className="unavailable">Unqualified</span>;
}
export function Score({ score }: { score: number | null }) {
  return score === null ? <span className="unavailable">Not scored</span> : <div className="score" aria-label={`AI score: ${score} out of 100`}><span>{score}<small>/100</small></span><div className="score-track"><div style={{ width: `${score}%` }} className={score >= 70 ? "score-high" : score >= 40 ? "score-medium" : "score-low"} /></div></div>;
}
