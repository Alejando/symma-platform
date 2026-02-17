// Dashboard contracts — therapist dashboard stats

export interface DashboardMetric {
  value: number;    // int
  trend: number;    // int, percentage change (0 = no trend data)
}

export interface AtRiskPatientResponse {
  id: string;
  name: string;
  daysInactive: number;          // int
  avatarUrl: string | null;
}

export interface DashboardStatsResponse {
  metrics: {
    activePatients: DashboardMetric;
    complianceAlerts: DashboardMetric;
    avgEfficacy: DashboardMetric;
  };
  atRiskPatients: AtRiskPatientResponse[];
}
