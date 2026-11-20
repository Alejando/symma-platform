"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { RoutineHistoryItem, RoutineStatsResponse, HistoryItemSummary, Routine } from "@symma/shared-types";
import { RoutineStatsCards } from "@/components/analytics/RoutineStatsCards";
import { SessionHistoryTable } from "@/components/analytics/SessionHistoryTable";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import type { SessionChartPoint, ExerciseOption } from "@/components/analytics/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnumLabel } from "@/components/ui/enum-label";
import { Skeleton } from "@/components/ui/skeleton";

import { getRoutine, getRoutineStats, getAllRoutineHistory } from "@/lib/api";
import { getSessionColor } from "@/lib/session-colors";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useDateFormatter } from "@/hooks/use-date-formatter";
import { ErrorAlert } from "@/components/ui/error-alert";

type SessionWithColor = RoutineHistoryItem & {
  color: string;
  index: number;
  items: HistoryItemSummary[];
};

export default function RoutineAnalyticsPage() {
  const params = useParams();
  const patientId = params.id as string;
  const routineId = params.routineId as string;
  const t = useTranslations('common');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [stats, setStats] = useState<RoutineStatsResponse | null>(null);
  const [history, setHistory] = useState<SessionWithColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleApiError = useApiErrorHandler();
  const formatDate = useDateFormatter();

  const exercises: ExerciseOption[] = useMemo(() => {
    const exerciseMap = new Map<string, string>();
    history.forEach((session) => {
      session.items.forEach((item) => {
        if (!exerciseMap.has(item.exerciseId)) {
          exerciseMap.set(item.exerciseId, item.exerciseName);
        }
      });
    });
    return Array.from(exerciseMap.entries()).map(([id, name]) => ({ id, name }));
  }, [history]);

  const chartSessions: SessionChartPoint[] = useMemo(() => history.map((sessionItem) => ({
    id: sessionItem.id,
    date: sessionItem.date,
    score: sessionItem.score,
    durationSeconds: sessionItem.durationSeconds,
    color: sessionItem.color,
    items: sessionItem.items,
  })), [history]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [routineData, statsData, historyData] = await Promise.all([
          getRoutine(routineId),
          getRoutineStats(routineId),
          getAllRoutineHistory(routineId),
        ]);

        setRoutine(routineData);
        setStats(statsData);
        const colorizedHistory = historyData.map((sessionItem, index) => ({
          ...sessionItem,
          color: getSessionColor(index),
          index,
        }));
        setHistory(colorizedHistory);
      } catch (fetchError) {
        setError(handleApiError(fetchError));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [routineId, handleApiError]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} className="m-8" />;
  }

  if (!stats || !routine) {
    return <div className="p-8">{t('analytics.noDataAvailable')}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('analytics.routineAnalytics')}</h2>
          <p className="text-muted-foreground">
            {t('analytics.detailedMetrics')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {formatDate.calendarDate(routine.startDate)} -{" "}
            {routine.endDate ? formatDate.calendarDate(routine.endDate) : t('routineDetail.present')}
          </Badge>
          <Badge>
            <EnumLabel enumName="RoutineStatus" value={routine.status} />
          </Badge>
        </div>
      </div>

      <RoutineStatsCards stats={stats.summary} averageSymmetry={stats.averageSymmetry} />

      <div className="grid gap-4 md:grid-cols-7">
        <div className="col-span-4 md:col-span-5">
          <ProgressChart data={stats.chartData} sessions={chartSessions} exercises={exercises} />
        </div>
        <div className="col-span-4 md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t('analytics.prescribedExercises')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routine.items?.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{item.exercise?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('analytics.setsByReps', { sets: item.sets, reps: item.repsPerSet })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SessionHistoryTable patientId={patientId} routineId={routineId} />
    </div>
  );
}
