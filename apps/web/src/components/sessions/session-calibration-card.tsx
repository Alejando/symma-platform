'use client';

import { useFormatter, useTranslations } from 'next-intl';
import type { SessionCalibration } from '@symma/shared-types';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function SessionCalibrationCard({ calibration }: { calibration: SessionCalibration | null }) {
  const t = useTranslations('common');
  const format = useFormatter();
  const formatDate = useDateFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sessionDetail.calibration')}</CardTitle>
        {calibration && (
          <p className="text-sm text-muted-foreground">
            {t('sessionDetail.calibrationCapturedAt', { date: formatDate.dateAndTime(calibration.capturedAt) })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {calibration ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sessionDetail.calibrationParameter')}</TableHead>
                <TableHead className="text-right">{t('sessionDetail.calibrationValue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(calibration.values).map(([parameter, value]) => (
                <TableRow key={parameter}>
                  <TableCell className="font-mono text-xs">{parameter}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {format.number(value, { maximumFractionDigits: 3 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">{t('sessionDetail.noCalibration')}</p>
        )}
      </CardContent>
    </Card>
  );
}
