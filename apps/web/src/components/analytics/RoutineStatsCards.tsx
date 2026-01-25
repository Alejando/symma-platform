import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Percent, Flame } from "lucide-react";

interface RoutineStats {
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
}

interface RoutineStatsCardsProps {
  stats: RoutineStats;
}

export function RoutineStatsCards({ stats }: RoutineStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground">
            Lifetime sessions completed
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgScore}%</div>
          <p className="text-xs text-muted-foreground">
            Overall performance score
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentStreak} Days</div>
          <p className="text-xs text-muted-foreground">
            Consecutive activity
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
