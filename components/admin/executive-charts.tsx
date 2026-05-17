"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/admin-service";

interface ThrustWeightDatum {
  name: string;
  value: number;
}

interface CompletionDatum {
  name: string;
  avgIndex: number;
}

interface ExecutiveChartsProps {
  thrustWeightage: ThrustWeightDatum[];
  completionByThrust: CompletionDatum[];
}

export function ExecutiveCharts({
  thrustWeightage,
  completionByThrust,
}: ExecutiveChartsProps) {
  return (
    <div className="grid w-full min-w-0 gap-4 lg:grid-cols-2">
      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>Thrust area weightage</CardTitle>
          <CardDescription>
            Distribution of goal weightage across corporate thrust areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {thrustWeightage.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No thrust area data available.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={thrustWeightage}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {thrustWeightage.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, "Weightage"]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle>Avg. completion index</CardTitle>
          <CardDescription>
            Mean progress score by thrust area (from quarterly check-ins)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completionByThrust.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No check-in data for completion indexes.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={completionByThrust}
                margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-24}
                  textAnchor="end"
                  interval={0}
                  height={64}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, "Avg. index"]}
                />
                <Bar
                  dataKey="avgIndex"
                  radius={[6, 6, 0, 0]}
                  fill="var(--chart-2)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
