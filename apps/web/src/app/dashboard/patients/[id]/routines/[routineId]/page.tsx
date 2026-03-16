"use client"

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { RoutineHistoryItem, RoutineStatsResponse, HistoryItemSummary } from "@symma/shared-types";
import { RoutineStatsCards } from "@/components/analytics/RoutineStatsCards";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import type { SessionChartPoint, ExerciseOption } from "@/components/analytics/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Eye } from "lucide-react";

import { useSession } from "next-auth/react";
import { getRoutineStats, getRoutineHistory } from "@/lib/api";
import { getSessionColor } from "@/lib/session-colors";

type SessionWithColor = RoutineHistoryItem & {
  color: string;
  index: number;
  items: HistoryItemSummary[];
};

export default function RoutineAnalyticsPage() {
  const params = useParams();
  const patientId = params.id as string;
  const routineId = params.routineId as string;
  const { data: session } = useSession();
  const t = useTranslations('common');
  const [stats, setStats] = useState<RoutineStatsResponse | null>(null);
  const [history, setHistory] = useState<SessionWithColor[]>([]);
  const [loading, setLoading] = useState(true);

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
      if (session?.user?.accessToken) {
        try {
          const [statsData, historyData] = await Promise.all([
            getRoutineStats(session.user.accessToken, routineId),
            getRoutineHistory(session.user.accessToken, routineId)
          ]);

          setStats(statsData);
          const colorizedHistory = historyData.map((sessionItem, index) => ({
            ...sessionItem,
            color: getSessionColor(index),
            index,
          }));
          setHistory(colorizedHistory);
        } catch (error) {
          console.error("Failed to fetch data", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (routineId && session) {
      fetchData();
    }
  }, [routineId, session]);

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

  // Fallback for demo if no data or error
  // Wait, if no data, stats might be null.
  if (!stats) {
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
          {/* Date Range Placeholders */}
          <Badge variant="outline">Jan 01 - Jan 30</Badge>
          <Badge>Active</Badge>
        </div>
      </div>

      <RoutineStatsCards stats={stats.summary} />

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
                {/* Placeholder for exercises config */}
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Smile Stretch</p>
                    <p className="text-xs text-muted-foreground">10 Reps</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Brow Raise</p>
                    <p className="text-xs text-muted-foreground">10 Reps</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.sessionHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('analytics.date')}</TableHead>
                <TableHead>{t('routineDetail.duration')}</TableHead>
                <TableHead>{t('analytics.score')}</TableHead>
                <TableHead className="text-right">{t('labels.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((sessionItem) => (
                <TableRow key={sessionItem.id}>
                  <TableCell>{format(parseISO(sessionItem.date), "PPP", { locale: es })}</TableCell>
                  <TableCell>{t('analytics.min', { minutes: Math.floor(sessionItem.durationSeconds / 60) })}</TableCell>
                  <TableCell>{sessionItem.score}%</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="icon" variant="ghost" title={t('analytics.viewDetails')}>
                      <Link href={`/dashboard/patients/${patientId}/routines/${routineId}/sessions/${sessionItem.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
