"use client"

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import type { HistoryItemSummary } from "@symma/shared-types";
import { useDateFormatter } from "@/hooks/use-date-formatter";

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

export function sortByDateAscending<T extends { date: string }>(points: T[]): T[] {
  return [...points].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

function toDay(date: string): string {
  return date.slice(0, 10);
}

export interface PlottedPoint {
  key: string;
  date: string;
  value: number;
  color: string;
}

interface PlottedPointsInput {
  data: ChartDataPoint[];
  sessions: SessionChartPoint[];
  metric: MetricType;
  exerciseId: string;
  selectedIds?: Set<string>;
}

const DEFAULT_POINT_COLOR = "#0D9488";

export function buildPlottedPoints({
  data,
  sessions,
  metric,
  exerciseId,
  selectedIds,
}: PlottedPointsInput): PlottedPoint[] {
  const plotsFullScoreHistory =
    metric === "score" && exerciseId === "average" && (!selectedIds || selectedIds.size === 0);

  if (plotsFullScoreHistory) {
    const colorByDay = new Map(sessions.map((session) => [toDay(session.date), session.color]));
    return sortByDateAscending(data).map((point, index) => ({
      key: `${point.date}-${index}`,
      date: point.date,
      value: point.score,
      color: colorByDay.get(toDay(point.date)) ?? DEFAULT_POINT_COLOR,
    }));
  }

  return sortByDateAscending(getSelectedSessions(sessions, selectedIds)).map((session) => ({
    key: session.id,
    date: session.date,
    value: getMetricValue(session, metric, exerciseId),
    color: session.color,
  }));
}

function getMetricValue(
  session: SessionChartPoint,
  metric: MetricType,
  exerciseId: string
): number {
  if (exerciseId === "average") {
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
  const t = useTranslations('common');
  const formatDate = useDateFormatter();
  const [metric, setMetric] = useState<MetricType>("score");
  const [selectedExercise, setSelectedExercise] = useState<string>("average");

  const METRIC_LABELS: Record<MetricType, string> = {
    score: t('analytics.score'),
    reps: t('analytics.repetitions'),
    time: t('analytics.time'),
  };

  const formatMetricValue = (value: number) => t(`analytics.metricValue.${metric}`, { value });

  const sessionByDay = new Map<string, SessionChartPoint>();
  sessions.forEach((session) => {
    if (!sessionByDay.has(toDay(session.date))) {
      sessionByDay.set(toDay(session.date), session);
    }
  });

  const chartData = useMemo(
    () => buildPlottedPoints({ data, sessions, metric, exerciseId: selectedExercise, selectedIds }),
    [data, sessions, metric, selectedExercise, selectedIds]
  );

  const yAxisDomain = useMemo(() => {
    if (metric === "score") return [0, 100];
    const maxValue = Math.max(...chartData.map((d) => d.value), 10);
    return [0, Math.ceil(maxValue * 1.1)];
  }, [chartData, metric]);

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t('analytics.performanceTrend')}</CardTitle>
        <div className="flex items-center gap-4">
          <Tabs value={metric} onValueChange={(value) => setMetric(value as MetricType)}>
            <TabsList className="h-8">
              <TabsTrigger value="score" className="text-xs px-2 py-1">{t('analytics.score')}</TabsTrigger>
              <TabsTrigger value="reps" className="text-xs px-2 py-1">{t('labels.reps')}</TabsTrigger>
              <TabsTrigger value="time" className="text-xs px-2 py-1">{t('analytics.time')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder={t('analytics.selectExercise')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="average">{t('analytics.allExercisesAvg')}</SelectItem>
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
                tickFormatter={(date: string) => formatDate.dayAndMonth(date)}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatMetricValue}
                domain={yAxisDomain}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const dataPoint = payload[0];
                  if (!dataPoint) return null;
                  
                  const value = dataPoint.value as number;
                  const matchedSession = typeof label === 'string' ? sessionByDay.get(toDay(label)) : null;
                  
                  const formattedDate = typeof label === 'string' ? formatDate.longDate(label) : String(label);
                  const duration = matchedSession
                    ? ` • ${t('analytics.min', { minutes: Math.floor(matchedSession.durationSeconds / 60) })}`
                    : '';
                  
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <p className="text-sm font-medium text-muted-foreground">{formattedDate}{duration}</p>
                      <p className="text-sm font-semibold">
                        {METRIC_LABELS[metric]}: {formatMetricValue(value)}
                      </p>
                    </div>
                  );
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
                legendType="none"
                tooltipType="none"
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
