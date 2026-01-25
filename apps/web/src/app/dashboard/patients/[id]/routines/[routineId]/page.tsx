"use client"

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RoutineStatsCards } from "@/components/analytics/RoutineStatsCards";
import { ProgressChart } from "@/components/analytics/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

import { useSession } from "next-auth/react";
import { getRoutineStats, getRoutineHistory } from "@/lib/api";

export default function RoutineAnalyticsPage() {
  const params = useParams();
  const routineId = params.routineId as string;
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (session?.user?.accessToken) {
        try {
          const [statsData, historyData] = await Promise.all([
            getRoutineStats(session.user.accessToken, routineId),
            getRoutineHistory(session.user.accessToken, routineId)
          ]);

          setStats(statsData);
          setHistory(historyData);
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
    return <div className="p-8">No data available</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Routine Analytics</h2>
          <p className="text-muted-foreground">
            Detailed performance metrics and history.
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
          <ProgressChart data={stats.chartData} />
        </div>
        <div className="col-span-4 md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Prescribed Exercises</CardTitle>
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
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{format(parseISO(session.date), "PPP")}</TableCell>
                  <TableCell>{Math.floor(session.durationSeconds / 60)} min</TableCell>
                  <TableCell>{(session.score * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">View Evidence</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
