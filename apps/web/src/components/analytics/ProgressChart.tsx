"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import type { HistoryItemSummary } from "@symma/shared-types";

export type MetricType = "score" | "reps" | "time";

interface ChartDataPoint {
  date: string;
  score: number;
}

export interface SessionChartPoint {
  id: string;
  date: string;
  score: number;
  durationSeconds: number;
  color: string;
  items: HistoryItemSummary[];
}

export interface ExerciseOption {
  id: string;
  name: string;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
  sessions?: SessionChartPoint[];
  selectedIds?: Set<string>;
  exercises?: ExerciseOption[];
}

export function getSelectedSessions(
  sessions: SessionChartPoint[],
  selectedIds?: Set<string>
): SessionChartPoint[] {
  if (!selectedIds || selectedIds.size === 0) {
    return sessions;
  }

  return sessions.filter((session) => selectedIds.has(session.id));
}

const METRIC_LABELS: Record<MetricType, string> = {
  score: "Score",
  reps: "Repetitions",
  time: "Time",
};

const METRIC_UNITS: Record<MetricType, string> = {
  score: "%",
  reps: " reps",
  time: " min",
};

function getMetricValue(
  session: SessionChartPoint,
  metric: MetricType,
  exerciseId: string | null
): number {
  if (exerciseId === null || exerciseId === "average") {
    switch (metric) {
      case "score":
        return session.score;
      case "reps": {
        const totalReps = session.items.reduce((sum, item) => sum + item.repsCompleted, 0);
        return session.items.length > 0 ? Math.round(totalReps / session.items.length) : 0;
      }
      case "time":
        return Math.round(session.durationSeconds / 60);
    }
  }

  const item = session.items.find((i) => i.exerciseId === exerciseId);
  if (!item) return 0;

  switch (metric) {
    case "score":
      return item.averageAccuracy ?? 0;
    case "reps":
      return item.repsCompleted;
    case "time":
      return Math.round(session.durationSeconds / session.items.length / 60);
  }
}

export function ProgressChart({ data, sessions = [], selectedIds, exercises = [] }: ProgressChartProps) {
  const [metric, setMetric] = useState<MetricType>("score");
  const [selectedExercise, setSelectedExercise] = useState<string>("average");

  const selectedSessions = getSelectedSessions(sessions, selectedIds);

  const sessionByDate = new Map<string, SessionChartPoint>();
  sessions.forEach((session) => {
    if (!sessionByDate.has(session.date)) {
      sessionByDate.set(session.date, session);
    }
  });

  const chartData = useMemo(() => {
    return selectedSessions.map((session) => ({
      date: session.date,
      value: getMetricValue(session, metric, selectedExercise),
      color: session.color,
      id: session.id,
    }));
  }, [selectedSessions, metric, selectedExercise]);

  const yAxisDomain = useMemo(() => {
    if (metric === "score") return [0, 100];
    const maxValue = Math.max(...chartData.map((d) => d.value), 10);
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData, metric]);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Performance Trend</CardTitle>
        <div className="flex items-center gap-4">
          <Tabs value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
            <TabsList className="h-8">
              <TabsTrigger value="score" className="text-xs px-2 py-1">Score</TabsTrigger>
              <TabsTrigger value="reps" className="text-xs px-2 py-1">Reps</TabsTrigger>
              <TabsTrigger value="time" className="text-xs px-2 py-1">Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">All Exercises (Avg)</SelectItem>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(str) => {
                  try {
                    return format(parseISO(str), "dd/MM");
                  } catch {
                    return str;
                  }
                }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}${METRIC_UNITS[metric]}`}
                domain={yAxisDomain}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                itemStyle={{ color: 'var(--foreground)' }}
                formatter={(value: number) => [`${value}${METRIC_UNITS[metric]}`, METRIC_LABELS[metric]]}
                labelFormatter={(label) => {
                  if (typeof label !== "string") {
                    return String(label);
                  }

                  const matchedSession = sessionByDate.get(label);
                  const formattedDate = format(parseISO(label), "MMM do, yyyy");

                  if (!matchedSession) {
                    return formattedDate;
                  }

                  return `${formattedDate} • ${Math.floor(matchedSession.durationSeconds / 60)} min`;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0D9488"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />

              <Scatter
                data={chartData}
                dataKey="value"
                shape={(props: unknown) => {
                  const typedProps = props as {
                    cx?: number;
                    cy?: number;
                    payload?: { color: string };
                  };
                  const { cx, cy, payload } = typedProps;
                  if (cx === undefined || cy === undefined || !payload) {
                    return <circle cx={0} cy={0} r={0} fill="transparent" />;
                  }

                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload.color}
                      stroke="var(--background)"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
