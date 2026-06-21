import { Card } from "@/components/ui/card";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

export function HealthGauge({ score }: { score: number }) {
  const data = [{ name: "score", value: score, fill: "var(--primary)" }];
  const tone =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs attention";

  return (
    <Card className="p-5 shadow-soft">
      <div className="text-sm font-semibold">Fleet Health</div>
      <div className="text-xs text-muted-foreground">Overall fitness score</div>
      <div className="relative mt-2 h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="75%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              background={{ fill: "var(--muted)" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-4xl font-bold tracking-tight">{score}%</div>
            <div className={`text-xs font-medium ${tone}`}>{label}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
