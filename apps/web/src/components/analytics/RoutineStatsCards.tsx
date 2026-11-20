import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Percent, Flame, FlipHorizontal2 } from "lucide-react";
import { usePercentFormatter } from "@/hooks/use-percent-formatter";

interface RoutineStats {
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
}

interface RoutineStatsCardsProps {
  stats: RoutineStats;
  averageSymmetry: number | null;
}

export function RoutineStatsCards({ stats, averageSymmetry }: RoutineStatsCardsProps) {
  const t = useTranslations('common');
  const formatPercent = usePercentFormatter();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('analytics.totalSessions')}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            {t('analytics.lifetimeSessions')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('analytics.averageAccuracy')}</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(stats.avgScore)}</div>
          <p className="text-xs text-muted-foreground">
            {t('analytics.overallPerformance')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('analytics.averageSymmetry')}</CardTitle>
          <FlipHorizontal2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {averageSymmetry === null ? (
            <div className="text-sm font-medium text-muted-foreground">{t('analytics.noSymmetryYet')}</div>
          ) : (
            <div className="text-2xl font-bold">{formatPercent(averageSymmetry)}</div>
          )}
          <p className="text-xs text-muted-foreground">
            {t('analytics.leftRightComparison')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('analytics.currentStreak')}</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{t('analytics.days', { count: stats.currentStreak })}</div>
          <p className="text-xs text-muted-foreground">
            {t('analytics.consecutiveActivity')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
