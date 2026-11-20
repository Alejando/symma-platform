"use client"

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import type { RoutineHistoryItem } from "@symma/shared-types";
import { getRoutineHistory } from "@/lib/api";
import { usePercentFormatter } from "@/hooks/use-percent-formatter";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useDateFormatter } from "@/hooks/use-date-formatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const SESSION_HISTORY_PAGE_SIZE = 20;

interface SessionHistoryTableProps {
  patientId: string;
  routineId: string;
}

export function SessionHistoryTable({ patientId, routineId }: SessionHistoryTableProps) {
  const t = useTranslations('common');
  const formatPercent = usePercentFormatter();
  const handleApiError = useApiErrorHandler();
  const formatDate = useDateFormatter();
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState<RoutineHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPage() {
      setError(null);
      try {
        const result = await getRoutineHistory(routineId, { page, limit: SESSION_HISTORY_PAGE_SIZE });
        setSessions(result.data);
        setTotal(result.total);
      } catch (loadError) {
        setError(handleApiError(loadError));
      }
    }
    loadPage();
  }, [routineId, page, handleApiError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('analytics.sessionHistory')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ErrorAlert message={error} />
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
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>{formatDate.longDate(session.date)}</TableCell>
                <TableCell>{t('analytics.min', { minutes: Math.floor(session.durationSeconds / 60) })}</TableCell>
                <TableCell>{formatPercent(session.score)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost" title={t('analytics.viewDetails')}>
                    <Link href={`/dashboard/patients/${patientId}/routines/${routineId}/sessions/${session.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination page={page} limit={SESSION_HISTORY_PAGE_SIZE} total={total} onPageChange={setPage} />
      </CardContent>
    </Card>
  );
}
