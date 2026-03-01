"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SessionDetailResponse } from "@symma/shared-types";
import { getSessionDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function scoreBadgeClass(score: number): string {
  if (score >= 70) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (score >= 50) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-rose-100 text-rose-700";
}

function extractRepSeries(seriesData: unknown): number[] {
  if (!seriesData || typeof seriesData !== "object") {
    return [];
  }

  const candidate = (seriesData as { reps?: unknown }).reps;

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter((value): value is number => typeof value === "number");
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authSession } = useSession();

  const sessionId = params.sessionId as string;
  const patientId = params.id as string;
  const routineId = params.routineId as string;

  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!authSession?.user?.accessToken) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const detail = await getSessionDetail(authSession.user.accessToken, sessionId);
        setSessionDetail(detail);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load session detail");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchDetail();
    }
  }, [authSession, sessionId]);

  const detailDate = useMemo(() => {
    if (!sessionDetail) {
      return "";
    }

    return format(parseISO(sessionDetail.date), "PPP");
  }, [sessionDetail]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  if (error || !sessionDetail) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>Unable to load session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error ?? "No data available"}</p>
            <Button onClick={() => router.refresh()} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const previousHref = sessionDetail.navigation.previousSessionId
    ? `/dashboard/patients/${patientId}/routines/${routineId}/sessions/${sessionDetail.navigation.previousSessionId}`
    : null;
  const nextHref = sessionDetail.navigation.nextSessionId
    ? `/dashboard/patients/${patientId}/routines/${routineId}/sessions/${sessionDetail.navigation.nextSessionId}`
    : null;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Session Detail</h2>
          <p className="text-muted-foreground">Detailed exercise performance for this session.</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/patients/${patientId}/routines/${routineId}`}>Back to Analytics</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Metadata</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Badge variant="outline">{detailDate}</Badge>
          <Badge variant="outline">{Math.floor(sessionDetail.durationSeconds / 60)} min</Badge>
          <Badge className={scoreBadgeClass(sessionDetail.score)}>{sessionDetail.score}%</Badge>
          <Badge variant="outline">{sessionDetail.isSynced ? "Synced" : "Pending Sync"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exercise Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionDetail.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercise data recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercise</TableHead>
                  <TableHead>Reps</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Accuracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionDetail.items.map((item) => {
                  const repSeries = extractRepSeries(item.seriesData);

                  return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>{item.exerciseName}</TableCell>
                        <TableCell>{item.repsCompleted}</TableCell>
                        <TableCell>{item.difficulty}</TableCell>
                        <TableCell>
                          {item.averageAccuracy === null ? "N/A" : `${item.averageAccuracy.toFixed(1)}%`}
                        </TableCell>
                      </TableRow>
                      {repSeries.length > 0 ? (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <details>
                              <summary className="cursor-pointer text-xs text-muted-foreground">
                                View rep-by-rep series
                              </summary>
                              <div className="mt-3 h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={repSeries.map((value, index) => ({
                                      rep: index + 1,
                                      value,
                                    }))}
                                  >
                                    <XAxis dataKey="rep" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                    <Bar dataKey="value" fill="#0D9488" radius={[2, 2, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </details>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button disabled={!previousHref} onClick={() => previousHref && router.push(previousHref)} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Session
        </Button>
        <Button disabled={!nextHref} onClick={() => nextHref && router.push(nextHref)} variant="outline">
          Next Session
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
